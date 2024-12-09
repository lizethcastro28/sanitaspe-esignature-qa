import AWS from 'aws-sdk';

// Obtener la región desde la variable de entorno
const region = process.env.AWS_REGION;

// Verifica si la región está definida
if (!region) {
    throw new Error("La región AWS no está definida en la variable de entorno AWS_REGION");
}

// Configurar AWS SDK
const secretsManager = new AWS.SecretsManager({ region });

/**
 * Función para obtener un secreto desde AWS Secrets Manager
 * @param secretName - El nombre del secreto a obtener
 * @returns Un objeto con el valor parseado del secreto
 */
export const getSecretValue = async (secretName: string): Promise<any> => {
    try {
        const result = await secretsManager.getSecretValue({
            SecretId: secretName,
        }).promise();

        if (!result.SecretString) {
            throw new Error(`El secreto ${secretName} no fue encontrado o no tiene valor`);
        }

        // Parsear el secreto como JSON
        return JSON.parse(result.SecretString);
    } catch (error) {
        console.error(`Error al recuperar el secreto ${secretName}:`, error);
        throw error;
    }
};
