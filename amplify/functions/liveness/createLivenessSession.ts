// createLivenessSession.ts

import * as AWS from 'aws-sdk';
import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

const rekognition = new AWS.Rekognition();

/**
 * createLivenessSession
 * Crea una session en rekognition.createFaceLivenessSession
 * @param event 
 * @returns session
 */
export const createLivenessSession = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log('-----------createSessionLiveness------')
    try {
        const bucket_name = process.env.S3_IMAGENS;
        if (!bucket_name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error en nombre bucket.' }),
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
            };
        }
        const clientRequestToken = event.requestContext.requestId;

        const params = {
            ClientRequestToken: clientRequestToken, // Opcional pero recomendado para idempotencia
            Settings: { // Opcional, para configurar el almacenamiento de imágenes y el límite de imágenes de auditoría
                AuditImagesLimit: 0, // Puedes especificar de 0 a 4
                OutputConfig: {
                    S3Bucket: bucket_name
                }
            }
        };

        const session = await rekognition.createFaceLivenessSession(params).promise();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(session)
        };
    } catch (error: unknown) {
        console.error('Error creating liveness session:', error);

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
