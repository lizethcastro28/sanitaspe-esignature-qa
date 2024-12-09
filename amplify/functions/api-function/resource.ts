import { defineFunction } from "@aws-amplify/backend";

/**
 * myApiFunction: definición del recurso /session
 */
export const myApiFunction = defineFunction({
  name: "api-function",
  timeoutSeconds: 300,
  environment: {
    S3_IMAGENS: process.env.S3_IMAGENS || "liveness-images-sessions"
  },
});