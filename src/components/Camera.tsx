import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

interface CameraProps {
  docType: string; // Tipo de documento (e.g., DNI, Pasaporte)
}

const Camera: React.FC<CameraProps> = ({ docType }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);

  const capturePhoto = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      console.error("No se pudo capturar la imagen.");
      return;
    }

    setCapturedImage(imageSrc);
    setIsCameraActive(false); // Ocultar la cámara
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCameraActive(true); // Mostrar la cámara nuevamente
  };

  const processPhoto = () => {
    console.log("Procesando la foto:", capturedImage);
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
