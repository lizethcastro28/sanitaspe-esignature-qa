import React, { useRef, useState } from "react";
import { post } from "aws-amplify/data";
import Webcam from "react-webcam";
import { readStream } from "../utils/functions";
import { Messages } from '../constants/messages';

interface CameraProps {
  docType: string; // Tipo de documento (e.g., DNI, Pasaporte)
  circuit: string; // Identificador del circuito para la llamada al API
}

const apiGateway = import.meta.env.VITE_API_GATEWAY;
const hrefPadre = document.referrer;

const Camera: React.FC<CameraProps> = ({ docType, circuit }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true); 
  const [message, setMessage] = useState<string>(Messages.camera.upload);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Estado para evitar procesamiento mientras se captura

  const captureAndProcessPhoto = async () => {
    if (isProcessing) return; // Prevenir múltiples llamadas mientras se procesa

    setIsProcessing(true); // Iniciar el procesamiento

    // Capturar la foto
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      console.error("No se pudo capturar la imagen.");
      setIsProcessing(false); // Detener procesamiento en caso de error
      return;
    }

    const cleanedBase64 = imageSrc.split(",")[1];

    // Generar nombre del archivo dinámicamente
    const imageName = `${docType}-${Date.now()}.jpg`;

    // Calcular tamaño estimado en bytes
    const imageSize = Math.round((imageSrc.length * 3) / 4 - (imageSrc.endsWith("==") ? 2 : 1));

    // Crear el objeto con los datos de la imagen
    const data = {
      name: imageName,
      size: imageSize,
      content: cleanedBase64,
    };

    // Guardar el estado
    setCapturedImage(imageSrc);
    setIsCameraActive(false); // Ocultar la cámara
    setMessage(Messages.camera.successCapture);

    // Enviar la foto al API externo
    try {
      // Llamada al API
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

      console.log('-----la data  que va a verify: ', data);
      const response = await restOperation.response;

      if (response) {
        // Verifica si la respuesta tiene un cuerpo como ReadableStream
        if (response.body instanceof ReadableStream) {
          try {
            // Leer el cuerpo del stream
            const responseBody = await readStream(response.body);

            // Parsear el JSON de la respuesta
            const responseJson = JSON.parse(responseBody);

            // Verificar si es válido
            if (responseJson.isValid) {
              // Redirige a la página padre
              window.location.href = hrefPadre;
            } else {
              // Si la respuesta es falsa, mostrar mensaje y permitir tomar otra foto
              setMessage(Messages.camera.dniError);
              setIsCameraActive(true); // Vuelve a activar la cámara
            }
          } catch (error) {
            console.error("Error al procesar la respuesta del servidor:", error);
            setMessage(Messages.camera.requestError); // Mostrar mensaje de error si no se puede procesar la respuesta
            setIsCameraActive(true); // Volver a activar la cámara
          }
        } else {
          console.error("El cuerpo de la respuesta no es un ReadableStream.");
          setMessage(Messages.camera.requestError); // Mostrar mensaje de error si no se recibe el stream esperado
          setIsCameraActive(true); // Volver a activar la cámara
        }
      } else {
        console.error("La respuesta no está definida.");
        setMessage(Messages.camera.requestError); // Mostrar mensaje de error si la respuesta no es válida
        setIsCameraActive(true); // Volver a activar la cámara
      }

    } catch (error) {
      console.error(
        "POST call identity verify error:",
        error instanceof Error ? error.message : error
      );
      setMessage(Messages.camera.requestError); // Mostrar mensaje de error en caso de fallo en la llamada al API
      setIsCameraActive(true); // Volver a activar la cámara
    } finally {
      setIsProcessing(false); // Detener procesamiento
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>{message}</h3>

      {/* Mostrar cámara o imagen capturada */}
      {isCameraActive ? (
        <div>
          {/* Botón que captura la foto y procesa */}
          <div style={{ marginBottom: "10px" }}>
            <button onClick={captureAndProcessPhoto} disabled={isProcessing}>
              {isProcessing ? "Procesando..." : "Procesar"}
            </button>
          </div>

          {/* Componente Webcam */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
          />
        </div>
      ) : (
        <div>
          {/* Mostrar imagen capturada */}
          <img src={capturedImage!} alt="Imagen Capturada" style={{ maxWidth: "100%", height: "auto", margin: "0 auto" }} />
        </div>
      )}
    </div>
  );
};

export default Camera;
