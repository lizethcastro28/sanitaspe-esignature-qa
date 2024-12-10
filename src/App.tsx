import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { get } from 'aws-amplify/data';
import Body from './components/Body';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorContent from './components/ErrorContent';
import { readStream, fillPdfDocuments } from './utils/functions';

import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

type LocationType = 'left' | 'center' | 'right';
type InstructionsLocationType = 'left' | 'right';

interface PdfDocument {
  name: string;
  content?: string;
  url?: string;
};

interface BodyConfig {
  instructions: string;
  instructions_location: InstructionsLocationType;
}

interface HeaderConfig {
  content: string;
  url: string;
  location: LocationType;
  bgColor: string;
}
interface FooterConfig {
  content: string;
  location: LocationType;
  bgColor: string;
}

const apiGateway = 'biometricApi'

const App = () => {
  const [showBody, setShowBody] = useState(false);
  const [name, setName] = useState("");
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>([]);
  const [screen, setScreen] = useState<"error" | "loading" | "detector" | "success" | "notLive" | "dataError" | "cancelled" | "dataDocument">("loading");
  const [status, setStatus] = useState(false);
  const [circuit, setCircuit] = useState("");
  const [detalleFirma, setDetalleFirma] = useState("tus documentos ya fueron firmados");


  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    content: '',
    url: './logowhite.png',
    location: 'left',
    bgColor: '#EA6A30',
  });
  const [bodyConfig, setBodyConfig] = useState<BodyConfig>({
    instructions: '',
    instructions_location: 'left',
  });

  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    content: 'DANAconnect Corp. Todos los derechos reservados.',
    location: 'center',
    bgColor: '#EA6A30',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false); // Estado para manejar errores

  useEffect(() => {
    const fetchDataAndProcess = async () => {
      const params = new URLSearchParams(window.location.search);
      const circuit = params.get('circuit');
      // Verifica si circuit es nulo o vacío
      if (!circuit || circuit.trim() === '') {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      setCircuit(circuit);

      // Verificar si viene danaParam
      const dana = params.get('dana');
      // Si circuit es válido, llama a getData
      await getData(circuit, dana);
      setIsLoading(false);
    };

    fetchDataAndProcess();
  }, []);

  /**
   * getData: obtiene los datos del circuito para realizar la operación.
   * @param circuit codigo del circuito
   * @param dana codigo o external trigger 
   * @returns 
   */
  const getData = async (circuit: string | null, dana: string | null) => {
    let path = `config?circuit=${circuit}`;
    if (dana) {
      path = `config?circuit=${circuit}&dana=${dana}`;
    }

    try {
      const restOperation = get({
        apiName: apiGateway,
        path: path,
      });

      const response = await restOperation.response;

      if (response && response.body) {
        if (response.body instanceof ReadableStream) {
          const responseBody = await readStream(response.body);

          // Parsear el JSON de la respuesta descomprimida
          const responseJson = JSON.parse(responseBody);
          console.log('la respuesta: ', responseJson)
          const docs = responseJson.biometricHistory?.docs;
          setPdfDocuments(pdfDocuments);
          if (Array.isArray(docs) && docs.length > 0) {
            const pdfDocuments = fillPdfDocuments(docs);
            setPdfDocuments(pdfDocuments);
          } else {
            console.error("No hay documentos PDF disponibles");
            setHasError(true); // Cambiar a la página de error
            return;
          }
          const configPage = responseJson.configPage;
          const biometricHistory = responseJson.biometricHistory;
          setName(biometricHistory.signers?.[0]?.name ?? "");
          //No firmar
          if (biometricHistory.idStatus == 1) {
            setStatus(true);
            setDetalleFirma("estos son tus documentos")
          }

          setHeaderConfig({
            content: configPage.header?.content || '',
            url: configPage.header?.url || './logowhite.png',
            location: configPage.header?.location || 'left',
            bgColor: configPage.header?.bgColor || '#EA6A30',
          });

          setBodyConfig({
            instructions: configPage.body?.instructions || '',
            instructions_location: configPage.body?.instructions_location || 'left',
          });

          setFooterConfig({
            content: configPage.footer?.content || 'DANAconnect Corp. Todos los derechos reservados.',
            location: configPage.footer?.location || 'center',
            bgColor: configPage.footer?.bgColor || '#EA6A30',
          });
        } else {
          console.error('No response body found, showing error content', screen);
          setScreen('error')
          setHasError(true); // Cambiar a la página de error
        }
      }
    } catch (error) {
      console.error('GET call config error:', error instanceof Error ? error.message : error);
      setHasError(true); // Cambiar a la página de error
    }
  };

  /**
   * handleClick: muestra la interfaz body con la video firma.
   */
  const handleClick = () => {
    setShowBody(true);
  };

  return (
    <>
      {isLoading ? (
        <div className="loading-container flex justify-center items-center min-h-screen">
          <img src="/spinner.gif" alt="Cargando..." style={{ width: '400px', height: '400px' }} />
        </div>

      ) : hasError ? (
        <div>
          <ErrorContent
            title="Error en Información"
            description="Se ha producido un error al cargar la información de la solicitud."
            instructions="Vuelva a abrir el email original que le enviamos y haga clic en el enlace."
            visible={false}
          />
        </div>
      ) : (
        <>
          <Header
            url={headerConfig.url}
            location={headerConfig.location}
            bgColor={headerConfig.bgColor}
            content={headerConfig.content}
          />
          <div className="container">
            {!showBody && (
              <>
                <div className="flex items-center justify-between mt-4">
                  <h2 className="">{name}: {detalleFirma}</h2>
                  {status && (
                    <button onClick={handleClick} className="mb-4 ml-4 px-4 py-2 bg-blue-500 text-white rounded">
                      Firmar
                    </button>
                  )}
                </div>

                <div className="mb-8">
                  {/* Filtrar para mostrar solo el PDF que contiene "circuit" si el estado es false */}
                  {status === false
                    ? pdfDocuments
                      .filter(doc => doc.name.includes(circuit))
                      .map((doc, index) => (
                        <div key={index} className="mb-4">
                          <h4 className="text-md font-semibold mb-1 text-gray-600">{doc.name}</h4>
                          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                            <Viewer fileUrl={doc.url ? doc.url : `data:application/pdf;base64,${doc.content}`} />
                          </Worker>
                        </div>
                      ))
                    : pdfDocuments.map((doc, index) => (
                      <div key={index} className="mb-4">
                        <h4 className="text-md font-semibold mb-1 text-gray-600">{doc.name}</h4>
                        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                          <Viewer fileUrl={doc.url ? doc.url : `data:application/pdf;base64,${doc.content}`} />
                        </Worker>
                      </div>
                    ))}
                </div>

              </>
            )}

            {showBody && (
              <Body
                instructions={bodyConfig.instructions}
                instructions_location={bodyConfig.instructions_location}
              />
            )}
          </div>
          <Footer
            content={footerConfig.content}
            bgColor={footerConfig.bgColor}
          />
        </>
      )}
    </>
  );
};

export default App;