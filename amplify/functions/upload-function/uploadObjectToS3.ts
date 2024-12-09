import AWS from 'aws-sdk';
const s3 = new AWS.S3();

interface UploadResult {
    bucket: string;
    key: string;
    location: string;
}

/**
 * uploadObjectToS3: subir archivos a un S3 indicado
 * @param session_id o prefijo de la carpeta donde se va a almacenar
 * @param base64Data el objeto en base64
 * @param bucket_name el nombre del bucket
 * @param objectName el nombre del objeto
 * @param contentType el tipo de contenido del objeto
 * @returns httpstatus
 */
export const uploadObjectToS3 = async (
    session_id: string,
    base64Data: string,
    bucket_name: string,
    objectName: string,
    contentType: string
): Promise<UploadResult> => {
    try {
        // Decodificar el Base64 y eliminar el prefijo
        const base64Content = base64Data.replace(/^data:\w+\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');

        // Crear la key (ruta) usando el session_id y el nombre del objeto
        const key = `${session_id}/${objectName}`;

        // Configurar los parámetros para la carga
        const params = {
            Bucket: bucket_name,
            Key: key,
            Body: buffer,
            ContentEncoding: 'base64',
            ContentType: contentType, // Ajustar según el tipo de contenido del archivo
        };

        // Subir el archivo al bucket de S3
        const result = await s3.upload(params).promise();

        return {
            bucket: result.Bucket,
            key: result.Key,
            location: result.Location,
        };
    } catch (error) {
        console.error('Error al subir el objeto a S3:', error);
        throw new Error('No se pudo subir el objeto.');
    }
};
