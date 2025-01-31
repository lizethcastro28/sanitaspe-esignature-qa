interface ImageObject {
    name: string;
    size: number;
    content: string;
}

/**
 * processCircuitApi: Realiza solicitud POST al API externa utilizando el accessToken
 * @param url del API
 * @param accessToken para autenticarse
 * @param docs Lista de documentos a enviar en el request
 * @returns status de la solicitud
 */
export const processCircuitApi = async (
    url: string,
    accessToken: string,
    docs: ImageObject[]
): Promise<any> => {
    const request = {
        docs
    };
    console.log('--------request: ', request)
    console.log('la url de solicitud: ', url)
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });
    console.log('la respuesta del server: ', response.json())
    if (!response.ok) {
        throw new Error(`Error en la respuesta HTTP! Estado: ${response.status}`);
    }

    return response.json();
};
