import { S3 } from 'aws-sdk';

interface ImageObject {
    name: string;
    size: number;
    content: string;
}

const s3 = new S3();

/**
 * getAllImagesInBase64
 * Busca una lista de imagenes en S3, filtrando por session_id.
 * Convierte cada imagen en StringBase64
 * @param session_id 
 * @param bucket_name 
 * @returns lista de imagenes con el formato:
 * {
        name: "imagen.jpg",
        size: 1234,
        content: base64Content
    };
 */
export const getAllImagesInBase64 = async (session_id: string, bucket_name: string): Promise<ImageObject[]> => {
    try {
        console.log('---Bucket: ', bucket_name)
        console.log("---session: ", session_id)
        const listObjects = await s3.listObjectsV2({
            Bucket: bucket_name,
            Prefix: session_id,
        }).promise();
        console.log("----listObjects: ", listObjects)
        
        // Filtrar los archivos para asegurar que no incluya carpetas ni archivos vacíos
        const imageKeys = listObjects.Contents?.filter(file => file.Key && (file.Size ?? 0) > 0).map(file => file.Key) || [];

        // Procesar cada archivo para convertirlo a base64 y crear el objeto ImageObject
        const imageObjects: ImageObject[] = await Promise.all(imageKeys.map(async (key) => {
            const object = await s3.getObject({
                Bucket: bucket_name,
                Key: key!
            }).promise();

            const base64Content = object.Body ? object.Body.toString('base64') : '';
            console.log("----base64: ", base64Content);

            const r = {
                name: key!.split('/').pop()!, // Obtener solo el nombre del archivo del key
                size: object.ContentLength || 0,
                content: base64Content
            };

            return r;
        }));

        return imageObjects;
    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        throw new Error('No se pudieron obtener las imágenes.');
    }
};