import { defineFunction } from "@aws-amplify/backend";


/**
 * uploadFunction: define el recursos /upload
 */
export const uploadFunction = defineFunction({
    name: "upload-function",
    timeoutSeconds: 300,
    environment: {
        BUCKET_NAME: process.env.BUCKET_NAME || "liveness-images-sessions-qa"
    },
})