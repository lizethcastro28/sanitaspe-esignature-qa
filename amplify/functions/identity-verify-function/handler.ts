import type { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { identityVerify } from './identityVerify';

/**
 * handler: maneja las solicitudes HTTP del recurso /identity-verify
 * Invoca la función correspondiente al método HTTP invocado
 * @param event 
 * @returns la respuesta de la función invocada.
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const httpMethod = event.httpMethod;

    let response: APIGatewayProxyResult;

    switch (httpMethod) {
        case "POST":
            response = await identityVerify(event);
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
