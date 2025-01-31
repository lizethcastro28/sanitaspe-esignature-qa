import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOauthToken } from "../getOauthToken";
import { getAllImagesInBase64 } from "./getAllImagesInBase64";
import { processCircuitApi } from "./processCircuitApi";

export const processCircuit = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    // Obtener el circuito desde los parámetros de consulta
    const circuit = event.queryStringParameters?.circuit;

    // Verifica si el cuerpo está presente
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'El cuerpo de la solicitud está vacío.' }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        console.error('Error al analizar el cuerpo del evento:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Error al obtener la data de la session' }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        };
    }

    const session_id = body.SessionId;
    const reference_image = body.ReferenceImage;

    if (!session_id || !reference_image || !reference_image.S3Object) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Faltan propiedades en el cuerpo de la solicitud.' }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        };
    }

    const bucket_name = reference_image.S3Object.Bucket;

    try {
        const url_token = process.env.OAUTH_TOKEN_URL;
        if (!url_token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error en url api token.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        const tokenResponse = await getOauthToken(url_token);
        const accessToken = tokenResponse?.access_token;

        if (!accessToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error al obtener token de autenticación.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }

        const docs = await getAllImagesInBase64(session_id, bucket_name);

        if (!docs || docs.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error al obtener imágenes.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }

        if (!circuit) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'El parámetro circuit es obligatorio.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        const process_circuit_url = process.env.PROCESS_CIRCUIT_URL;
        if (!process_circuit_url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error en url api PROCESS_CIRCUIT_URL.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        const finalUrl = process_circuit_url.replace("{circuit}", circuit);

        console.log("-----------finalUrl: ", finalUrl);
        console.log("-----------docs: ", docs);

        const data = await processCircuitApi(finalUrl, accessToken, docs);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify(data),
        };

    } catch (error: unknown) {
        console.error('Error en process circuit:', error);

        let errorMessage = 'Error desconocido';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify({ error: errorMessage }),
        };
    }
};
