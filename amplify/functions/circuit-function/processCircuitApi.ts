/**
 * processCircuitApi: Realiza solicitud POST al API externa utilizando el accessToken
 * @param url del API
 * @param accessToken para autenticarse
 * @param bodyRequest Lista de documentos a enviar en el request
 * @returns status de la solicitud
 */
export const processCircuitApi = async (
    url: string,
    accessToken: string,
    bodyRequest: any
): Promise<any> => {

    console.log('la url de solicitud: ', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyRequest)
        });

        const responseData = await response.json(); 

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error en la respuesta HTTP! Estado: ${response.status}, Cuerpo: ${errorBody}`);
        }
        return responseData;

    } catch (error) {
        console.error('Error en processCircuitApi:', error);
        throw error; 
    }
};