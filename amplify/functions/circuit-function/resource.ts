import { defineFunction } from "@aws-amplify/backend";

/**
 * circuitFunction.
 * Define el recurso /circuit del API
 */
export const circuitFunction = defineFunction({
    name: "circuit-function",
    timeoutSeconds: 300,
    environment: {
        OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL || "https://integrationlayer.auth.us-east-2.amazoncognito.com/oauth2/token",
        PROCESS_CIRCUIT_URL: process.env.PROCESS_CIRCUIT_URL || "http://biometric.integrationlayer.com/api/v1/biometric/internal/process_circuit/{circuit}",
        SECRET_NAME: process.env.SECRET_NAME || "qa/oauth/api"
    },
});