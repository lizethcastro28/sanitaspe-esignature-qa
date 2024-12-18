interface ImageObject {
    name: string;
    size: number;
    content: string;
}

/**
 * identityVerifyApi: Realiza solicitud POST al API externa utilizando el accessToken
 * @param url del API
 * @param accessToken para autenticarse
 * @param doc documento a enviar en el request
 * @returns status de la solicitud
 */
export const identityVerifyApi = async (
    url: string,
    accessToken: string,
    doc: ImageObject[]
): Promise<any> => {
    const request = {
        doc
    };
    console.log('----la url: ', url)
    console.log('---la imagen:', doc)
    console.log('---request:', request)

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(doc)
    });
    if (!response.ok) {
        throw new Error(`Error en la respuesta HTTP! Estado: ${response.status}`);
    }

    return response.json();
};
