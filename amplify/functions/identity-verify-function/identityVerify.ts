import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOauthToken } from "../getOauthToken";
import { identityVerifyApi } from "./identityVerifyApi"

export const identityVerify = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
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

    const name = body.name;
    const size = body.size;
    const content = body.content;

    if (!name || !size || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Faltan propiedades en el cuerpo de la solicitud identify.' }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        };
    }

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

        if (!circuit) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'El parámetro chanel es obligatorio.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        const identity_verify_url = process.env.IDENTIFY_VERIFY_URL;
        if (!identity_verify_url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error en url api IDENTIFY_VERIFY_URL.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        const finalUrl = identity_verify_url.replace("{circuit}", circuit);

        const data = await identityVerifyApi(finalUrl, accessToken, body);

        console.log('-------------respuesta en servidor: ', data)

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify(data),
        };

    } catch (error: unknown) {
        console.error('Error en IDENTIFY VERIFY REQUEST:', error);

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
