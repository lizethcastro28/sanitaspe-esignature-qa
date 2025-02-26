import { useState, useEffect } from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider, Message } from '@aws-amplify/ui-react';
import { get, post } from 'aws-amplify/data';
import '@aws-amplify/ui-react/styles.css';
import '../App.css';
import { dictionary } from './dictionary';
import ErrorContent from './ErrorContent';


interface LivenesProps {
    Messages: any;
    instructions: string;
    instructions_location: string;
}

const apiGateway = import.meta.env.VITE_API_GATEWAY;
const VITE_AWS_REGION = import.meta.env.VITE_AWS_REGION;

const Livenes: React.FC<LivenesProps> = ({ Messages, instructions, instructions_location }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [createLivenessApiData, setCreateLivenessApiData] = useState<{ sessionId: string } | null>(null);
    const [screen, setScreen] = useState<'loading' | 'detector' | 'success' | 'error' | 'notLive' | 'dataError' | 'cancelled' | "dataDocument">('loading');
    const [circuit, setCircuit] = useState("");
    const [sessionResults, setSessionResults] = useState<boolean>(true);
    const [video, setVideo] = useState<any>(null);

    let mediaRecorder: MediaRecorder | null = null;

    interface NominatimResponse {
        display_name: string;
    }

    //=========0. Obtener Geolocalizacion

    const getLocation = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                            );

                            if (!response.ok) {
                                const errorBody = await response.text();
                                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
                            }

                            const data = await response.json() as NominatimResponse;

                            const address = data.display_name;

                            resolve(address);
                        } catch (error) {
                            console.error("Error en getLocation:", error);
                            reject(error);
                        }
                    },
                    (error) => {
                        console.error("Error en getCurrentPosition:", error);
                        reject(error);
                    }
                );
            } else {
                reject(new Error("Geolocalización no soportada en este navegador."));
            }
        });
    };


    useEffect(() => {
        if (screen === 'detector') {
            //Comensar a grabar el video   
            let recordedChunks: BlobPart[] = [];

            const intervalId = setInterval(() => {
                const videoElement = document.querySelector('.amplify-liveness-video') as HTMLVideoElement;
                if (videoElement && videoElement.srcObject) {
                    const mediaStream = videoElement.srcObject as MediaStream;

                    if (mediaStream.active) {
                        // Configure MediaRecorder if not configured yet
                        if (!mediaRecorder) {
                            mediaRecorder = new MediaRecorder(mediaStream, {
                                mimeType: 'video/webm; codecs=vp8',
                                videoBitsPerSecond: 200000
                            });

                            mediaRecorder.ondataavailable = (event) => {
                                if (event.data.size > 0) {
                                    recordedChunks.push(event.data);
                                }
                            };

                            mediaRecorder.onstop = async () => {
                                const recordedBlob = new Blob(recordedChunks, {
                                    type: 'video/webm'
                                });

                                // Obtener el tamaño del video en bytes
                                const videoSize = recordedBlob.size;

                                try {
                                    if (!createLivenessApiData) {
                                        throw new Error("createLivenessApiData is null or undefined.");
                                    }
                                    const base64Data = await convertBlobToBase64(recordedBlob);
                                    const data = {
                                        session_id: createLivenessApiData.sessionId,
                                        base64Content: base64Data,
                                        objectName: 'video.webm',
                                        contentType: 'video/webm',
                                        videoSize: videoSize
                                    };
                                    setVideo(data);
                                } catch (error) {
                                    console.error("Error al convertir el video a base64:", error);
                                }
                            };

                            // Start recording
                            mediaRecorder.start();
                        }

                        // Stop checking video status
                        clearInterval(intervalId);
                    } else {
                        console.log("Esperando que el video comience a grabar...");
                    }
                }
            }, 500); // Check every 500ms

            return () => {
                clearInterval(intervalId);
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop(); // Stop recording if component unmounts
                }
            };
        }
    }, [screen]);


    //Detiene el video si hay resultados de sesion de liveness
    useEffect(() => {
        if (sessionResults) {
            // Here you stop the video only if livenessResult has data
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop(); // Stop recording when there's a liveness result
            }
        }
    }, [sessionResults]);

    //Si hay video, lo sube al S3
    useEffect(() => {
        if (video) {
            uploadVideo(video);
        }
    }, [video]);

    //==========1. Obtener el circuitoID y crear la session Liveness
    useEffect(() => {
        const fetchDataAndProcess = async () => {
            const params = new URLSearchParams(window.location.search);
            const circuit = params.get('circuit');
            if (circuit) {
                try {
                    setCircuit(circuit);
                    fetchCreateLiveness();
                } catch (error) {
                    console.error('Error fetching data:', error);
                    setScreen('error');
                    setLoading(false);
                }
            } else {
                setScreen('error');
                setLoading(false);
            }
        }

        fetchDataAndProcess();
    }, []);

    /**
     * fetchCreateLiveness: crea la session del Livenes.
     * Aqui se obtiene el idSession para comenzar la verificación
     */
    const fetchCreateLiveness = async () => {
        try {
            const restOperation = post({
                apiName: apiGateway,
                path: 'session',
            });
            const response = (await restOperation.response) as unknown as Response;

            if (response.body) {
                const responseBody = await readStream(response.body);
                const sessionData = JSON.parse(responseBody);

                if (sessionData && sessionData.SessionId) {
                    setCreateLivenessApiData({ sessionId: sessionData.SessionId });
                    setScreen('detector');
                } else {
                    console.error('Invalid session data received:', sessionData);
                    setScreen('error');
                }
                setLoading(false);
            } else {
                console.log('POST call succeeded but response body is empty');
                setScreen('error');
            }
        } catch (error) {
            console.log('------POST call failed: ', error);
            setScreen('error');
        }
    };


    /**
     * readStream: formatear una cadena
     * @param stream 
     * @returns 
     */
    async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
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

    /**
     * handleAnalysisComplete: manejar la respuesta del LivenessDetector
     */
    const handleAnalysisComplete = async () => {
        if (createLivenessApiData) {
            setScreen('success');
            try {
                const restOperation = get({
                    apiName: apiGateway,
                    path: `session/${createLivenessApiData.sessionId}`,
                });
                const response = (await restOperation.response) as unknown as Response;

                if (response.body) {
                    const responseBody = await readStream(response.body);
                    const data = JSON.parse(responseBody);

                    if (data.Status === 'SUCCEEDED') {
                        setSessionResults(true);
                        // Obtener la geolocalizacion del usuario
                        const address = await getLocation();
                        if (data.Confidence > 90) {
                            console.log('-----is live: ', data.Confidence);
                            // Redondear data.Confidence a 2 decimales y convertir a número
                            const roundedConfidence = parseFloat(data.Confidence.toFixed(2));
                            data.Confidence = roundedConfidence;
                            data.Geolocation = address;
                            setTimeout(async () => {
                                let redirect = ""
                                const circuitData = await processCircuit(circuit, data);
                                if (circuitData && circuitData.urlRedirect) {
                                    redirect = circuitData.urlRedirect;
                                }
                                window.location.href = redirect;
                            }, 13);
                        } else {
                            console.log('---is not live: ', data.Confidence);
                            setScreen('notLive');
                        }
                    } else {
                        console.error('-------No se realizó la comprobación');
                        setScreen('error');
                    }
                } else {
                    console.error('GET call succeeded but response body is empty');
                    setScreen('error');
                }
            } catch (error) {
                console.error('------GET call failed: ', error);
                setScreen('error');
            }
        } else {
            console.error('No sessionId available');
            setScreen('error');
        }
    };

    /**
     * processCircuit: envía los datos de la validación
     * al API externa
     * @param circuit 
     * @param data 
     */
    const processCircuit = async (circuit: string | null, data: any) => {
        try {
            const restOperation = post({
                apiName: apiGateway,
                path: `circuit?circuit=${circuit}`,
                options: {
                    body: {
                        data
                    }
                }
            });

            const response = await restOperation.response;

            if (response) {
                if (response.body instanceof ReadableStream) {
                    const responseBody = await readStream(response.body);
                    const responseJson = JSON.parse(responseBody);
                    return responseJson;
                }
            }
        } catch (error) {
            console.error('POST call process circuit error:', error instanceof Error ? error.message : error);
        }

        // Si no hay respuesta válida, retorna null o un objeto vacío
        return null;
    };

    /**
     * uploadVideo: envía los datos de la validación
     * al API externa
     * @param circuit 
     * @param data 
     */
    const uploadVideo = async (data: any): Promise<boolean> => {
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
                throw new Error('Error al subir el video');
            }

        } catch (error) {
            console.error('Error en uploadVideo:', error);
            throw error;
        }
    };

    /**
     * onUserCancel
     */
    function onUserCancel() {
        console.log('canceló');
        setScreen('cancelled');
    }

    // Función para convertir el Blob a Base64
    const convertBlobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };



    return (
        <ThemeProvider>
            <div style={{ maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: instructions_location === 'left' ? 'row' : 'row-reverse' }}>

                <div style={{ flex: 1, padding: '1rem' }}>
                    <Message className="my-message"
                        colorTheme={'info'}
                        heading={"Instrucciones"}
                        variation="plain"
                    >
                        {instructions}
                    </Message>
                </div>
                <div style={{ flex: 1 }}>
                    {loading ? (
                        <Loader />
                    ) : screen === 'detector' ? (
                        <div>
                            <FaceLivenessDetector
                                sessionId={createLivenessApiData?.sessionId || ''}
                                region={VITE_AWS_REGION}
                                onAnalysisComplete={handleAnalysisComplete}
                                onUserCancel={onUserCancel}
                                displayText={dictionary['es']}
                                onError={(error) => {
                                    console.error('FaceLivenessDetector error:', error);
                                }}
                            />
                        </div>
                    ) : screen === 'notLive' ? (
                        <ErrorContent
                            Messages={Messages}
                            title={Messages.notLive.title}
                            description={Messages.notLive.description}
                            instructions={Messages.notLive.instructions}
                            visible={true}
                            loader={false}
                            type="error"
                        />
                    ) : screen === 'dataError' ? (
                        <ErrorContent
                            Messages={Messages}
                            title={Messages.dataError.title}
                            description={Messages.dataError.title}
                            instructions={Messages.dataError.title}
                            visible={false}
                            loader={false}
                            type="error"
                        />
                    ) : screen === 'cancelled' ? (
                        <ErrorContent
                            Messages={Messages}
                            title={Messages.cancelledAction.title}
                            description={Messages.cancelledAction.description}
                            instructions={Messages.cancelledAction.instructions}
                            visible={true}
                            loader={false}
                            type="error"
                        />
                    ) : screen === 'success' ? (
                        <ErrorContent
                            Messages={Messages}
                            title={Messages.verificationSuccess.title}
                            description={Messages.verificationSuccess.description}
                            instructions={Messages.verificationSuccess.instructions}
                            visible={false}
                            loader={true}
                            type="info"
                        />
                    ) : (
                        <ErrorContent
                            Messages={Messages}
                            title={Messages.unexpectedError.title}
                            description={Messages.unexpectedError.description}
                            instructions={Messages.unexpectedError.instructions}
                            visible={false}
                            loader={false}
                            type="error"
                        />
                    )
                    }
                </div>
            </div>
        </ThemeProvider>
    );
}

export default Livenes;
