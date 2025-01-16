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
  Image
} from "@aws-amplify/ui-react";
import { readStream } from "../utils/functions";
import { Messages } from "../constants/messages";

interface CameraProps {
  docType: string; // Tipo de documento (e.g., DNI, Pasaporte)
  circuit: string; // Identificador del circuito para la llamada al API
}

type MessageColorTheme = 'error' | 'info' | 'success' | 'warning' | 'neutral';

const apiGateway = import.meta.env.VITE_API_GATEWAY;
const hrefPadre = document.referrer;

const Camera: React.FC<CameraProps> = ({ docType, circuit }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [message, setMessage] = useState<string>(Messages.camera.upload);
  const [colorTheme, setColorTheme] = useState<MessageColorTheme>("info");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [captureCount, setCaptureCount] = useState<number>(0);

  const captureAndProcessPhoto = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      console.error("No se pudo capturar la imagen.");
      setMessage("Error: No se pudo capturar la imagen.");
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
          // Redirigir inmediatamente si es válido
          window.location.href = hrefPadre;
          return; // Detener el proceso
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
      setCaptureCount((prev) => prev + 1); // Incrementar el contador de capturas

      if (captureCount + 1 >= 2) {
        setIsCameraActive(false); // Desactivar cámara tras 2 capturas
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && captureCount < 2) {
      let seconds = 0;
      const interval = setInterval(() => {
        seconds += 1;
        setSecondsElapsed(seconds);

        if (seconds >= 5) {
          clearInterval(interval);
          captureAndProcessPhoto();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isCameraActive, captureCount]);

  const handleRetry = () => {
    setCaptureCount(0);
    setCapturedImage(null);
    setMessage(Messages.camera.upload);
    setColorTheme("info");
    setIsCameraActive(true); // Reactivar la cámara
  };

  return (
    <View>
      <View style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Message colorTheme={colorTheme}>
          {message}
        </Message>
      </View>

      {isCameraActive ? (
        <View>
          <Flex style={{ marginBottom: '1rem', marginTop: '2rem' }} direction="column" gap="medium" width="80%" maxWidth="600px" margin="auto">
            <Flex alignItems="center" gap="medium">
              <Loader variation="linear" percentage={(secondsElapsed / 5) * 100} isDeterminate />
              <Text>{Messages.camera.capture} {secondsElapsed}</Text>
            </Flex>

            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
          </Flex>
        </View>
      ) : (
        <View style={{ marginTop: 20 }}>
          <Flex direction="column" gap="medium" alignItems="center">
            {captureCount >= 2 ? (
              <>
                <Message colorTheme="info">
                  {Messages.camera.reintent}
                </Message>
                <Button onClick={handleRetry} variation="primary">
                  {Messages.buttons.manualProcess}
                </Button>
              </>
            ) : (
              <Image
                alt="Imagen Capturada"
                src={capturedImage!}
                style={{ maxWidth: "100%", height: "auto", margin: "0 auto" }}
              />
            )}
          </Flex>
        </View>
      )}
    </View>
  );
};

export default Camera;
