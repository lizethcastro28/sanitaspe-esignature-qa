import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { uploadObjectToS3 } from "./uploadObjectToS3";

export const putObjet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    // Obtener los parámetros de consulta
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

    // Verificar que los parámetros no sean undefined
    const session_id = body.SessionId;
    const base64Content = body.base64Content;
    const bucket_name = process.env.BUCKET_NAME;
    const objectName = body.objectName;
    const contentType = body.contentType;

    if (!session_id || !base64Content || !bucket_name || !objectName || !contentType) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Faltan parámetros obligatorios en la solicitud.' }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        };
    }

    try {
        const result = await uploadObjectToS3(session_id, base64Content, bucket_name, objectName, contentType);
        console.log('Objeto subido exitosamente:', result);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify({
                message: 'Objeto subido exitosamente',
                result,
            }),
        };
    } catch (error) {
        console.error('Error al subir el objeto:', error);

        // Verificar si el error es una instancia de Error, de lo contrario convertir a string
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
            body: JSON.stringify({
                message: 'Error al subir el objeto',
                error: errorMessage,
            }),
        };
    }
};
