// utils/apiService.ts
import { post } from 'aws-amplify/data';

const apiGateway = import.meta.env.VITE_API_GATEWAY;

export async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode(); // Decodificar los últimos datos
  return result;
}

// Definir la interfaz PdfDocument en este archivo o importarla desde otro lugar
type PdfDocument = {
  name: string;
  content?: string;
  url?: string;
};


/**
 * fillPdfDocuments
 * @param docs 
 * @returns 
 */
export const fillPdfDocuments = (docs: { name?: string; url?: string }[]): PdfDocument[] => {
  const pdfDocuments: PdfDocument[] = [];

  docs.forEach(doc => {
    if (doc.url) {
      pdfDocuments.push({
        name: doc.name || 'Documento',
        url: doc.url  // Guardar la URL del documento
      });
    }
  });

  return pdfDocuments;
};

/**
     * uploadObjectToS3
     * @param circuit 
     * @param data 
     */
export const uploadObjectToS3 = async (data: any): Promise<boolean> => {
  const requestBody = {
      SessionId: data.session_id,
      base64Content: data.base64Content.split(',')[1],
      objectName: data.objectName,
      contentType: data.contentType,
  };

  try {
      // Realiza la operación POST
      const restOperation = post({
          apiName: apiGateway,
          path: `upload`,
          options: {
              body: requestBody,
          }
      });

      // Espera la respuesta
      const response = await restOperation.response;

      // Verifica si la respuesta es exitosa
      if (response.statusCode === 200) {
          console.log('-----subio con exito');
          return true;
      } else {
          console.error(`Error en la respuesta: ${response.statusCode}`);
          // Maneja el cuerpo de la respuesta de error si es posible
          const errorBody = await response.body.json();
          console.error('Detalles del error: ', errorBody);
          throw new Error('Error al subir el objeto'); // Throw a specific error
      }

  } catch (error) {
      console.error('Error en uploadVideo:', error);
      throw error;
  }
};
