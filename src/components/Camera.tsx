import React, { useEffect, useRef, useState } from "react";
import { post } from "aws-amplify/data";
import Webcam from "react-webcam";
import {
  Loader,
  View,
  Message,
  Text,
  Button,
  Flex,
} from "@aws-amplify/ui-react";
import { readStream } from "../utils/functions";

interface CameraProps {
  Messages:any,
  docType: string;
  circuit: string;
}

type MessageColorTheme = 'error' | 'info' | 'success' | 'warning' | 'neutral';

const apiGateway = import.meta.env.VITE_API_GATEWAY;
const hrefPadre = document.referrer;

const Camera: React.FC<CameraProps> = ({ Messages, docType, circuit }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(Messages.camera.upload);
  const [colorTheme, setColorTheme] = useState<MessageColorTheme>("info");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [captureCount, setCaptureCount] = useState<number>(0);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setIsCameraActive(true);
      })
      .catch(() => {
        setMessage(Messages.camera.permissionError);
        setColorTheme("error");
      });
  }, []);

  const captureAndProcessPhoto = async () => {
    if (isProcessing || !isCameraActive) return;

    setIsProcessing(true);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setMessage(Messages.camera.imagenError);
      setIsProcessing(false);
      return;
    }

    const cleanedBase64 = imageSrc.substring(imageSrc.indexOf(",") + 1);
    const imageName = `${docType}-${Date.now()}.jpg`;
    const imageSize = Math.round((imageSrc.length * 3) / 4 - (imageSrc.endsWith("==") ? 2 : 1));

    const data = {
      name: imageName,
      size: imageSize,
      content: cleanedBase64,
    };

    try {
      const restOperation = await post({
        apiName: apiGateway,
        path: `identity?circuit=${circuit}`,
        options: {
          body: data,
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      const response = await restOperation.response;

      if (response?.body instanceof ReadableStream) {
        const responseBody = await readStream(response.body);
        const responseJson = JSON.parse(responseBody);

        if (responseJson.isValid) {
          window.location.href = hrefPadre;
          return;
        } else {
          setMessage(Messages.camera.dniError);
          setColorTheme("error");
        }
      } else {
        console.error("El cuerpo de la respuesta no es un ReadableStream.");
        setMessage(Messages.camera.requestError);
        setColorTheme("error");
      }
    } catch (error) {
      console.error("Error al realizar la llamada API:", error);
      setMessage(Messages.camera.requestError);
      setColorTheme("error");
    } finally {
      setIsProcessing(false);
      setCaptureCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (isCameraActive && captureCount < 2) {
      const delay = 2000;
      let seconds = 0;
      let interval: string | number | NodeJS.Timeout | undefined;

      const timeout = setTimeout(() => {
        interval = setInterval(() => {
          seconds += 1;
          setSecondsElapsed(seconds);

          if (seconds >= 5) {
            clearInterval(interval);
            captureAndProcessPhoto();
          }
        }, 1000);
      }, delay);

      return () => {
        clearTimeout(timeout);
        if (interval) clearInterval(interval);
      };
    }
  }, [isCameraActive, captureCount]);

  const handleRetry = () => {
    setCaptureCount(0);
    setMessage(Messages.camera.upload);
    setColorTheme("info");
    setIsCameraActive(true);
    setSecondsElapsed(0);
  };

  return (
    <View>
      <View style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Message colorTheme={colorTheme}>
          {message}
        </Message>
      </View>

      {isCameraActive ? (
        <View style={{ marginTop: 20 }}>
          <Flex direction="column" gap="medium" alignItems="center">
            {captureCount >= 2 && (
              <>
                <Button onClick={handleRetry} variation="primary">
                  {Messages.buttons.manualProcess}
                </Button>
              </>
            )}
            <Flex alignItems="center" gap="medium">
              <Loader variation="linear" percentage={(secondsElapsed / 5) * 100} isDeterminate />
              <Text>{Messages.camera.capture} {secondsElapsed}</Text>
            </Flex>
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
          </Flex>
        </View>
      ) : null}
    </View>
  );
};

export default Camera;
