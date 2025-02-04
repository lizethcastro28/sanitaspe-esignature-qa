import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { get } from 'aws-amplify/data';
import Body from './components/Body';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorContent from './components/ErrorContent';
import { readStream, fillPdfDocuments } from './utils/functions';

import '@react-pdf-viewer/core/lib/styles/index.css';
import Camera from './components/Camera';
import DocumentViewer from './components/DocumentViewer';
import { Messages } from './constants/messages';
import {
  Loader,
  Text,
  View,
  Flex,
  Heading,
  Button
} from "@aws-amplify/ui-react";


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

const apiGateway = import.meta.env.VITE_API_GATEWAY;


const App = () => {
  const [showBody, setShowBody] = useState(false);
  const [name, setName] = useState("");
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>([]);
  const [screen, setScreen] = useState<"error" | "loading" | "detector" | "success" | "notLive" | "dataError" | "cancelled" | "dataDocument">("loading");
  const [idStatus, setIdStatus] = useState(1);
  const [circuit, setCircuit] = useState("");
  const [detalleFirma, setDetalleFirma] = useState("");
  const [isRekognition, setIsRekognition] = useState(false);


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
    content: Messages.footer.defaultContent,
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
      console.log('-------getConfig: ', response)

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
          //Verifico si debo Firmar
          let { idStatus, isRekognition } = biometricHistory;
          console.log('-----------REKOGNITION:', isRekognition);
          setIdStatus(idStatus);
          if (idStatus === 1) {
            if (isRekognition === true) {
              //subir el DNI
              setIsRekognition(true);
              setDetalleFirma("");
            }
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
            content: configPage.footer?.content || Messages.footer.defaultContent,
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
        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Flex direction="column" alignItems="center">
            <Text>{Messages.accions.loading}</Text>
            <Loader
              size="large"
              variation="linear"
            />
          </Flex>
        </View>

      ) : hasError ? (
        <ErrorContent
          title={Messages.dataError.title}
          description={Messages.dataError.description}
          instructions={Messages.dataError.instructions}
          visible={false}
          type="error"
        />
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
                {/* Botón Firmar */}
                <View style={{ marginTop: 20 }}>
                  <Heading level={2}>{name} {detalleFirma}</Heading>
                  {(idStatus === 1 || idStatus === 3) && !isRekognition && (
                    <Button
                    style={{ marginTop: 20 }}
                      variation="primary"
                      onClick={handleClick}
                      size='large'
                      
                    >
                      {Messages.buttons.sing}
                    </Button>
                  )}
                </View>

                {/* Documentos */}
                <div className="mb-8">
                  <DocumentViewer
                    pdfDocuments={pdfDocuments}
                    idStatus={idStatus}
                    isRekognition={isRekognition}
                  />
                </div>
              </>
            )}

            {/* Cámara */}
            {idStatus === 1 && isRekognition && (
              <Camera docType="DNI" circuit={circuit} />
            )}

            {/* Body */}
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