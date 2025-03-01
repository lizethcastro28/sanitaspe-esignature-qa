// utils/apiService.ts

export async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode(); 
  return result;
}

// Definir la interfaz PdfDocument
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
