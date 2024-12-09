import React, { useRef } from "react";
import Webcam from "react-webcam";
import { uploadObjectToS3 } from "../utils/functions";

interface CameraProps {
  sessionId: string;
  docType: string; // Tipo de documento (e.g., DNI, Pasaporte)
}

const Camera: React.FC<CameraProps> = ({ sessionId, docType }) => {
  const webcamRef = useRef<Webcam>(null);

  const capturePhoto = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      console.error("No se pudo capturar la imagen.");
      return;
    }

    // Generar nombre del archivo dinámicamente
    const objectName = `${docType}-${Date.now()}.jpg`;
    const contentType = "image/jpeg";

    const data = {
      session_id: sessionId,
      base64Content: imageSrc, // Captura en formato base64
      objectName: objectName,
      contentType: contentType,
      videoSize: null, // Agrega el tamaño de la imagen si es necesario
    };

    console.log("Datos a subir:", data);

    // Subir a S3
    await uploadObjectToS3(data);
  };

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
      />
      <button onClick={capturePhoto}>Capturar Foto</button>
    </div>
  );
};

export default Camera;
