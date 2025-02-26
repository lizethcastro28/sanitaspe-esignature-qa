import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { get } from 'aws-amplify/data';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorContent from './components/ErrorContent';
import { readStream, fillPdfDocuments } from './utils/functions';
import '@react-pdf-viewer/core/lib/styles/index.css';
import Body from './components/Body';
import Instructions from './components/Instructions';
import { BodyMessages } from './constants/messages';
import {
  Loader,
  Text,
  View,
  Flex,
} from "@aws-amplify/ui-react";

type LocationType = 'left' | 'center' | 'right';
type InstructionsLocationType = 'left' | 'right';

interface PdfDocument {
  name: string;
  content?: string;
  url?: string;
}

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

interface LivenessResult {
  livenessStatus: string,
  livenessConfidence: string,
  geolocation: string
}

const apiGateway = import.meta.env.VITE_API_GATEWAY;

const App = () => {
  const [name, setName] = useState("");
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>([]);
  const [idStatus, setIdStatus] = useState(1);
  const [circuit, setCircuit] = useState("");
  const [detalleFirma, setDetalleFirma] = useState("");
  const [isRequireDocument, setIsRequireDocument] = useState(false);
  const [Messages, setMessages] = useState(BodyMessages);

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

  const [livenessResult, setLivenessResult] = useState<LivenessResult>({
    livenessStatus: "",
    livenessConfidence: "",
    geolocation: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const fetchDataAndProcess = async () => {
      const params = new URLSearchParams(window.location.search);
      const circuitParam = params.get('circuit');
      const dana = params.get('dana');

      if (!circuitParam || circuitParam.trim() === '') {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      setCircuit(circuitParam);

      await getData(circuitParam, dana);
      setIsLoading(false);
    };

    fetchDataAndProcess();
  }, []);

  useEffect(() => {
    console.log('✅ Mensajes actualizados:', Messages);
  }, [Messages]);

  const getData = async (circuit: string | null, dana: string | null) => {
    let path = `config?circuit=${circuit}`;
    if (dana) {
      path += `&dana=${dana}`;
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
          const responseJson = JSON.parse(responseBody);
          console.log('-----Config: ', responseJson);

          const configPage = responseJson.configPage;
          if (configPage.body?.content) {
            try {
              const parsedContent = typeof configPage.body.content === "string"
                ? JSON.parse(configPage.body.content)
                : configPage.body.content;

              setMessages(parsedContent);
            } catch (error) {
              console.error('❌ Error al parsear Messages:', error);
            }
          }

          const docs = responseJson.biometricHistory?.docs;
          if (Array.isArray(docs) && docs.length > 0) {
            const pdfDocuments = fillPdfDocuments(docs);
            setPdfDocuments(pdfDocuments);
          } else {
            console.error("No hay documentos PDF disponibles");
            setHasError(true);
            return;
          }

          const biometricHistory = responseJson.biometricHistory;
          setName(biometricHistory.signers?.[0]?.name ?? "");
          let { idStatus, isRequireDocument } = biometricHistory;

          setIdStatus(idStatus);
          if (idStatus === 1 && isRequireDocument) {
            setIsRequireDocument(true);
            setDetalleFirma("");
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
          setLivenessResult({
            livenessStatus: responseJson.livenessStatus || "",
            livenessConfidence: responseJson.livenessConfidence || "",
            geolocation: responseJson.geolocation || ""
          });
        } else {
          console.error('No response body found, showing error content');
          setHasError(true);
        }
      }
    } catch (error) {
      console.error('GET call config error:', error instanceof Error ? error.message : error);
      setHasError(true);
    }
  };

  const handleContinue = () => {
    setShowInstructions(false);
  };

  return (
    <>
      {isLoading ? (
        <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Flex direction="column" alignItems="center">
            <Text>{Messages.accions.loading}</Text>
            <Loader size="large" variation="linear" />
          </Flex>
        </View>
      ) : hasError ? (
        <ErrorContent
          Messages={Messages}
          title={Messages.dataError.title}
          description={Messages.dataError.description}
          instructions={Messages.dataError.instructions}
          visible={false}
          loader={false}
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
          {showInstructions && idStatus === 1 ? (
            <Instructions
              Messages={Messages}
              title={Messages.instructions.title}
              description={Messages.instructions.description}
              instructions={Messages.instructions.instructions}
              type="info"
              onContinue={handleContinue}
            />
          ) : (
            <Body
              Messages={Messages}
              name={name}
              detalleFirma={detalleFirma}
              idStatus={idStatus}
              isRequireDocument={isRequireDocument}
              pdfDocuments={pdfDocuments}
              circuit={circuit}
              bodyConfig={bodyConfig}
              livenessResult={livenessResult}
            />
          )}
          <Footer content={footerConfig.content} bgColor={footerConfig.bgColor} />
        </>
      )}
    </>
  );
};

export default App;
