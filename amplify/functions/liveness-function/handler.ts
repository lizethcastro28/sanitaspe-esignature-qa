import type { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { getFaceLivenessSession } from './getFaceLivenessSession';
import { createLivenessSession } from './createLivenessSession';


/**
 * handler: entrada a los recursos /session del Api Gateway.
 * Llama a la función encargada según el método http invocado.
 * @param event 
 * @returns respuesta de la función
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const httpMethod = event.httpMethod;

    let response: APIGatewayProxyResult;

    switch (httpMethod) {
        case "GET":
            response = await getFaceLivenessSession(event);
            break;
        case "POST":
            response = await createLivenessSession(event);
            break;
        default:
            response = handleUnknownRequest(event);
            break;
    }

    return response;
};

// Función para manejar solicitudes desconocidas
const handleUnknownRequest = (event: APIGatewayEvent): APIGatewayProxyResult => {
    return {
        statusCode: 405, // Método no permitido
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
        body: JSON.stringify(`Method ${event.httpMethod} not allowed`),
    };
};
