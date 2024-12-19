import React, { useState, useEffect } from "react";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

interface Document {
  name: string; // Nombre del documento
  url?: string; // URL opcional del documento
  content?: string; // Contenido opcional del documento en base64
}

interface DocumentViewerProps {
  pdfDocuments: Document[];
  idStatus: number;
  isRekognition: boolean;
}

const msgFirmados = "Estos son tus documentos firmados";
const msgNoFirmados = "Por favor Firma estos documentos";

const DocumentViewer: React.FC<DocumentViewerProps> = ({ pdfDocuments, idStatus, isRekognition }) => {
  const [message, setMessage] = useState<string>(msgFirmados);

  // Usamos useEffect para actualizar el mensaje cuando idStatus cambie
  useEffect(() => {
    if (isRekognition) return;

    if (idStatus === 1 || idStatus === 3) {
      setMessage(msgNoFirmados);
    } else {
      setMessage(msgFirmados);
    }
  }, [idStatus, isRekognition]); // Dependencias: solo se actualiza cuando idStatus o isRekognition cambian

  if (isRekognition) return null;

  let filteredDocuments = pdfDocuments;

  return (
    <div className="mb-8">
      <h3>{message}</h3>
      {filteredDocuments.map((doc, index) => (
        <div key={index} className="mb-4">
          <h4 className="text-md font-semibold mb-1 text-gray-600">{doc.name}</h4>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={doc.url ? doc.url : `data:application/pdf;base64,${doc.content}`} />
          </Worker>
        </div>
      ))}
    </div>
  );
};

export default DocumentViewer;
