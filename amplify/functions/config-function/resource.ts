import { defineFunction } from "@aws-amplify/backend";


/**
 * configFunction: define el recursos /config
 */
export const configFunction = defineFunction({
    name: "config-function",
    timeoutSeconds: 300,
    environment: {
        OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL || "https://integrationlayer.auth.us-east-2.amazoncognito.com/oauth2/token",
        GET_CHANEL_URL: process.env.GET_CHANEL_URL || "http://biometric.integrationlayer.com/api/v1/biometric/internal/get_channel/{circuit}",
        SECRET_NAME: process.env.SECRET_NAME || "oauth/api"
    },
});