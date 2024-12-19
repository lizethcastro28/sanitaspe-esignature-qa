import React, { useRef, useState } from "react";
import { post } from "aws-amplify/data";
import Webcam from "react-webcam";
import { readStream } from "../utils/functions";

interface CameraProps {
  docType: string; // Tipo de documento (e.g., DNI, Pasaporte)
  circuit: string; // Identificador del circuito para la llamada al API
}

const apiGateway = "biometricApi";
const hrefPadre = document.referrer;

const Camera: React.FC<CameraProps> = ({ docType, circuit }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [imageData, setImageData] = useState<{ name: string; size: number; content: string } | null>(null);

  const capturePhoto = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      console.error("No se pudo capturar la imagen.");
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
    setImageData(data);
    setIsCameraActive(false); // Ocultar la cámara

    console.log("Objeto data:", data);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImageData(null);
    setIsCameraActive(true); // Mostrar la cámara nuevamente
  };

  const processPhoto = async () => {
    if (!imageData) {
      console.error("No hay datos de la imagen para procesar.");
      return null;
    }

    try {
      console.log("------Procesando la foto:", imageData);
      console.log("Props recibidas:", { docType, circuit });

      // Llamada al API
      const restOperation = await post({
        apiName: apiGateway,
        path: `identity?circuit=${circuit}`,
        options: {
          body: imageData,
          headers: {
            "Content-Type": "application/json",
          },
        },
      });

      // Manejar la respuesta del API
      const response = await restOperation.response;

      if (response) {
        // Verifica si la respuesta tiene un cuerpo como ReadableStream
        if (response.body instanceof ReadableStream) {
          try {
            // Leer el cuerpo del stream
            const responseBody = await readStream(response.body);

            // Parsear el JSON de la respuesta
            const responseJson = JSON.parse(responseBody);

            console.log("-------- Respuesta del servidor:", responseJson);

            // Verificar si es válido
            if (responseJson.isValid) {
              // Redirige a la página padre
              window.location.href = hrefPadre; 
            } else {
              // Permanece en la página actual
              console.log("Respuesta inválida, permaneciendo en la página actual.");
            }
          } catch (error) {
            console.error("Error al procesar la respuesta del servidor:", error);
          }
        } else {
          console.error("El cuerpo de la respuesta no es un ReadableStream.");
        }
      } else {
        console.error("La respuesta no está definida.");
      }

    } catch (error) {
      console.log('---------ele error: ', error)
      console.error(
        "POST call identity verify error:",
        error instanceof Error ? error.message : error
      );
    }

    // Si no hay respuesta válida, retorna null o un objeto vacío
    return null;
  };

  return (
    <div style={{ textAlign: "center" }}>
      {/* Mostrar cámara o imagen capturada */}
      {isCameraActive ? (
        <div>
          {/* Botón encima del Webcam */}
          <div style={{ marginBottom: "10px" }}>
            <button onClick={capturePhoto}>Capturar</button>
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
          <h3>Tu {docType}</h3>
          <img src={capturedImage!} alt="Imagen Capturada" style={{ maxWidth: "100%", height: "auto", margin: "0 auto" }} />

          {/* Botones para procesar o volver a tomar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "15px",
            }}
          >
            <button onClick={retakePhoto}>Volver a tomar</button>
            <button onClick={processPhoto}>Procesar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
