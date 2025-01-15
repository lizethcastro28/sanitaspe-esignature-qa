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
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0); // Segundos transcurridos

  const captureAndProcessPhoto = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      console.error("No se pudo capturar la imagen.");
      setIsProcessing(false);
      return;
    }

    //const cleanedBase64 = imageSrc.split(",")[1];
    const cleanedBase64 = imageSrc.substring(imageSrc.indexOf(",") + 1);
    const imageName = `${docType}-${Date.now()}.jpg`;
    const imageSize = Math.round((imageSrc.length * 3) / 4 - (imageSrc.endsWith("==") ? 2 : 1));

    const data = {
      name: imageName,
      size: imageSize,
      content: cleanedBase64,
    };

    setCapturedImage(imageSrc);
    setIsCameraActive(false);
    setMessage(Messages.camera.successCapture);
    setColorTheme("success");

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
        try {
          const responseBody = await readStream(response.body);
          const responseJson = JSON.parse(responseBody);

          if (responseJson.isValid) {
            window.location.href = hrefPadre;
          } else {
            setMessage(Messages.camera.dniError);
            setIsCameraActive(true);
            setColorTheme("error");
          }
        } catch (error) {
          console.error("Error al procesar la respuesta del servidor:", error);
          setMessage(Messages.camera.requestError);
          setIsCameraActive(true);
          setColorTheme("error");
        }
      } else {
        console.error("El cuerpo de la respuesta no es un ReadableStream.");
        setMessage(Messages.camera.requestError);
        setIsCameraActive(true);
        setColorTheme("error");
      }
    } catch (error) {
      console.error(
        "POST call identity verify error:",
        error instanceof Error ? error.message : error
      );
      setMessage(Messages.camera.requestError);
      setIsCameraActive(true);
      setColorTheme("error");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      let seconds = 0;

      // Temporizador para actualizar los segundos transcurridos
      const interval = setInterval(() => {
        seconds += 1;
        setSecondsElapsed(seconds);

        if (seconds >= 5) {
          clearInterval(interval);
          captureAndProcessPhoto(); // Captura automática al completar los 5 segundos
        }
      }, 1000); // Avanza cada segundo

      return () => clearInterval(interval); // Limpiar temporizador
    }
  }, [isCameraActive]);

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

            <Button
              variation="primary"
              onClick={captureAndProcessPhoto}
              disabled={isProcessing} >
              {isProcessing ? Messages.buttons.process : Messages.buttons.manualProcess}
            </Button>
          </Flex>
        </View>
      ) : (
        <View style={{ marginTop: 20 }}>
          <Flex direction="column" gap="medium">
            <Image
              alt="Imagen Capturada"
              src={capturedImage!}
              style={{ maxWidth: "100%", height: "auto", margin: "0 auto" }}
            />
          </Flex>
        </View>
      )}
    </View>
  );
};

export default Camera;
