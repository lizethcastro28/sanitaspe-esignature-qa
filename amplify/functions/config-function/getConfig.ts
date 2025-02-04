import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOauthToken } from "../getOauthToken";

/**
 * getConfig
 * Obtiene el token de autorizacion para luego invocar al API
 * externo getChanel
 * @param event 
 * @returns la respuesta de la solicitud con la información del canal
 */
export const getConfig = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    // Obtener el circuito desde los parámetros de consulta
    const circuit = event.queryStringParameters?.circuit;
    const dana = event.queryStringParameters?.dana;
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

        // Asegúrate de que tokenResponse sea un objeto con un body
        if (!tokenResponse) {
            throw new Error('No se pudo obtener el token de autenticación.');
        }
        const accessToken = tokenResponse.access_token;
        // Verifica si se obtuvo el access_token
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

        // Verifica si el parámetro circuit existe
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
        const get_channel_url = process.env.GET_CHANEL_URL;
        if (!get_channel_url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error en url api GET_CHANEL.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        let finalUrl = get_channel_url.replace("{circuit}", circuit);

        if (dana) {
            finalUrl += `/dana_code/${dana}`;
        }

        // Realizar la solicitud GET a la API externa utilizando el accessToken
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/zip',
            },
        });

        console.log('----La respuesta get_channel: ', response)
        // Verifica si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`Error en la respuesta HTTP! Estado: ${response.status}`);
        }

        const data = await response.json();

        // Devuelve los datos en la respuesta
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify(data),
        };

    } catch (error: unknown) {
        console.error('Error en getConfig:', error);

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
