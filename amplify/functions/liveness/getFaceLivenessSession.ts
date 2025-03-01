import * as AWS from 'aws-sdk';
import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

const rekognition = new AWS.Rekognition();

/**
 * getFaceLivenessSession
 * Devuelve los datos de una session Liveness de Rekognition
 * utiliza el API getFaceLivenessSessionResults
 * @param event debe contener el sessionId a buscar
 * @returns sessionResults: %de coincidencia, imagenes utilizadas.
 */
export const getFaceLivenessSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {

    const path = event.path;
    const parts = path.split('/');
    const sessionId = parts[2];

    if (!sessionId) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: "Missing sessionId in path parameters" })
        };
    }

    try {
        const params = {
            SessionId: sessionId
        };
        const session = await rekognition.getFaceLivenessSessionResults(params).promise();
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(session)
        };
    } catch (error: unknown) {
        console.error('Error getting session result:', error);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};
