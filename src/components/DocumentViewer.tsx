import React, { useState, useEffect } from "react";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

import {
  Heading,
  Message,
  Divider,
} from '@aws-amplify/ui-react';

interface Document {
  name: string; // Nombre del documento
  url?: string; // URL opcional del documento
  content?: string; // Contenido opcional del documento en base64
}

interface DocumentViewerProps {
  Messages: any;
  pdfDocuments: Document[];
  idStatus: number;
  isRequireDocument: boolean;
  livenessResult: any;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ Messages, pdfDocuments, idStatus, isRequireDocument, livenessResult }) => {
  const [message, setMessage] = useState<string>(Messages.docs.signed);

  // Usamos useEffect para actualizar el mensaje cuando idStatus cambie
  useEffect(() => {
    if (isRequireDocument) return;

    if (idStatus === 1 || idStatus === 3) {
      setMessage(Messages.docs.unsigned);
    } else {
      setMessage(Messages.docs.signed);
    }
  }, [idStatus, isRequireDocument]);

  if (isRequireDocument) return null;

  let filteredDocuments = pdfDocuments;

  return (
    <div className="mb-8">
      <Heading level={4} style={{ marginBottom: '1rem', marginTop: '2rem' }}>
        <Message colorTheme="info" hasIcon={false}>
          {message}
        </Message>
      </Heading>
      {livenessResult.livenessStatus && (
        <>
          <Message
            hasIcon={false}
            variation="plain"
            colorTheme="info"
            heading="Resultados de Liveness">
            {livenessResult.livenessStatus} - {livenessResult.livenessConfidence} %
          </Message>
          <Divider orientation="horizontal" />
        </>
      )}
      {livenessResult.geolocation && (
        <>
          <Message
            hasIcon={false}
            variation="plain"
            colorTheme="info"
            heading="Geolocalización">
            {livenessResult.geolocation}
          </Message>

          <Divider orientation="horizontal" />
        </>
      )}

      {filteredDocuments.map((doc, index) => (
        <div key={index} className="mb-4">

          <Message
            hasIcon={false}
            variation="plain"
            colorTheme="info"
            heading="Documento(s)">
            {doc.name}
          </Message>


          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={doc.url ? doc.url : `data:application/pdf;base64,${doc.content}`} />
          </Worker>
        </div>
      ))}
    </div>
  );
};

export default DocumentViewer;
