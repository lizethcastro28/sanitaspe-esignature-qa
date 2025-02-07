import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOauthToken } from "../getOauthToken";
import { getAllImagesInBase64 } from "./getAllImagesInBase64";
import { processCircuitApi } from "./processCircuitApi";

/**
 * Procesa un circuito enviando datos a una API externa.
 * @param event El evento de API Gateway que contiene los datos del circuito.
 * @returns Una promesa que resuelve a un objeto APIGatewayProxyResult.
 */
export const processCircuit = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
    };

    const handleError = (statusCode: number, message: string, error?: unknown): APIGatewayProxyResult => {
        console.error(`Error en process circuit: ${message}`, error);
        return {
            statusCode,
            headers,
            body: JSON.stringify({ message }), // Mensaje consistente
        };
    };

    const circuit = event.queryStringParameters?.circuit;

    if (!event.body) {
        return handleError(400, 'El cuerpo de la solicitud está vacío.');
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return handleError(400, 'Error al analizar el cuerpo del evento.', error);
    }

    const { liveness_results } = body;
    if (!liveness_results || !liveness_results.SessionId || !liveness_results.ReferenceImage
        || !liveness_results.ReferenceImage.S3Object) {
        return handleError(400, 'Faltan propiedades en el cuerpo de la solicitud.');
    }

    const {
        SessionId: session_id,
        ReferenceImage: { S3Object: { Bucket: bucket_name } },
        Status: status,
        Confidence: confidence
    } = liveness_results;


    const url_token = process.env.OAUTH_TOKEN_URL;
    if (!url_token) {
        return handleError(400, 'Error en url api token.');
    }

    try {
        const tokenResponse = await getOauthToken(url_token);
        const accessToken = tokenResponse?.access_token;

        if (!accessToken) {
            return handleError(400, 'Error al obtener token de autenticación.');
        }

        const docs = await getAllImagesInBase64(session_id, bucket_name);

        if (!docs || docs.length === 0) {
            return handleError(400, 'Error al obtener imágenes.');
        }

        if (!circuit) {
            return handleError(400, 'El parámetro circuit es obligatorio.');
        }

        const process_circuit_url = process.env.PROCESS_CIRCUIT_URL;
        if (!process_circuit_url) {
            return handleError(400, 'Error en url api PROCESS_CIRCUIT_URL.');
        }

        const finalUrl = process_circuit_url.replace("{circuit}", circuit);

        const body_request = {
            "status": status,
            "confidence": confidence,
            "geolocation": body.Geolocation,
            "docs": docs
        }

        console.log('--------el request enviado a process_circuit: ', body_request)
        const data = await processCircuitApi(finalUrl, accessToken, body_request);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return handleError(500, 'Error en process circuit.', error); //  Manejo general de errores
    }
};