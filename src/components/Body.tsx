import { useState } from 'react';
import {
    View,
    Heading,
    Button,
} from "@aws-amplify/ui-react";
import Camera from './Camera';
import DocumentViewer from './DocumentViewer';
import Liveness from './Liveness';
import { Messages } from '../constants/messages';

interface BodyProps {
    name: string;
    detalleFirma: string;
    idStatus: number;
    isRequireDocument: boolean;
    pdfDocuments: any;
    circuit: string;
    bodyConfig: {
        instructions: string;
        instructions_location: string;
    };
}

const Body: React.FC<BodyProps> = ({
    name,
    detalleFirma,
    idStatus,
    isRequireDocument,
    pdfDocuments,
    circuit,
    bodyConfig
}) => {
    const [showBody, setShowBody] = useState(false);

    const handleShowBody = () => {
        setShowBody(true);
    };

    return (
        <div className="container">
            {!showBody && (
              <>
                {/* Botón Firmar */}
                <View style={{ marginTop: 20 }}>
                  <Heading level={2}>{name} {detalleFirma}</Heading>
                  {(idStatus === 1 || idStatus === 3) && !isRequireDocument && (
                    <Button
                    style={{ marginTop: 20 }}
                      variation="primary"
                      onClick={handleShowBody}
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
                    isRequireDocument={isRequireDocument}
                  />
                </div>
              </>
            )}

            {/* Cámara */}
            {idStatus === 1 && isRequireDocument && (
              <Camera docType="DNI" circuit={circuit} />
            )}

            {/* Body */}
            {showBody && (
              <Liveness
                instructions={bodyConfig.instructions}
                instructions_location={bodyConfig.instructions_location}
              />
            )}
          </div>
            
    );
};

export default Body;
