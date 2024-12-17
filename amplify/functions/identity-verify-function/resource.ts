import { defineFunction } from "@aws-amplify/backend";


/**
 * identityVerifyFunction
 */
export const identityVerifyFunction = defineFunction({
    name: "identity-verify-function",
    timeoutSeconds: 300,
    environment: {
        OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL || "https://integrationlayer.auth.us-east-2.amazoncognito.com/oauth2/token",
        IDENTIFY_VERIFY_URL: process.env.IDENTIFY_VERIFY_URL || "https://biometric.integrationlayer.com/api/v1/biometric/internal/identity_verify/{circuit}",
        SECRET_NAME: process.env.SECRET_NAME || "qa/oauth/api"
    },
})