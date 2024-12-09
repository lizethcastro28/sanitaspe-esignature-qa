import { getSecretValue } from "./getSecret";
/**
 * getOauthToken: realiza una solicitud HTTP al API externa
 * /oauth2/token
 * @param url 
 * @returns el access_token para acceder a otras APIS
 */
export const getOauthToken = async (url: string) => {

    const secret_name = process.env.SECRET_NAME;

    // Verifica si la región está definida
    if (!secret_name) {
        throw new Error("El nombre del secret param no esta definido variable de entorno SECRET_NAME");
    }

    const secret = await getSecretValue(secret_name);
    const clientId = secret.clientId;
    const clientSecret = secret.clientSecret;


    try {
        // Codifica las credenciales en Base64
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // Configura los encabezados para la solicitud
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
        };

        // Configura el cuerpo de la solicitud
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
        });

        // Realiza la solicitud POST usando fetch
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body.toString(),
        });

        // Verifica si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Devuelve el token en la respuesta
        return data;

    } catch (error: unknown) {
        console.error('Error get oauthToken:', error);

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
}