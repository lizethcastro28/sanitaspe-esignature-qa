import React, { useState, useEffect } from "react";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { Messages } from '../constants/messages';

import {
  Heading,
  Message,
} from '@aws-amplify/ui-react';

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

const DocumentViewer: React.FC<DocumentViewerProps> = ({ pdfDocuments, idStatus, isRekognition }) => {
  const [message, setMessage] = useState<string>(Messages.docs.signed);

  // Usamos useEffect para actualizar el mensaje cuando idStatus cambie
  useEffect(() => {
    if (isRekognition) return;

    if (idStatus === 1 || idStatus === 3) {
      setMessage(Messages.docs.unsigned);
    } else {
      setMessage(Messages.docs.signed);
    }
  }, [idStatus, isRekognition]); // Dependencias: solo se actualiza cuando idStatus o isRekognition cambian

  if (isRekognition) return null;

  let filteredDocuments = pdfDocuments;

  return (
    <div className="mb-8">
      <Heading level={4} style={{ marginBottom: '1rem', marginTop: '2rem' }}>
        <Message colorTheme="info">{message}</Message>
      </Heading>

      {filteredDocuments.map((doc, index) => (
        <div key={index} className="mb-4">
          <Heading level={5} style={{ marginBottom: '1rem', marginTop: '3rem', textAlign: 'left' }}>
            {doc.name}
          </Heading>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={doc.url ? doc.url : `data:application/pdf;base64,${doc.content}`} />
          </Worker>
        </div>
      ))}
    </div>
  );
};

export default DocumentViewer;
