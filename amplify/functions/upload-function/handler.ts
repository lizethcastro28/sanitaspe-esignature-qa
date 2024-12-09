import type { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { putObjet } from './putObjet';


/**
 * handler: enruta las solicitudes HTTP a la función correspondiente.
 * @param event 
 * @returns la resouesta de la solicitu
 */
export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const httpMethod = event.httpMethod;

    let response: APIGatewayProxyResult;

    switch (httpMethod) {
        case "POST":
            response = await putObjet(event);
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
