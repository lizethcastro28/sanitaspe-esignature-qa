import { defineFunction } from "@aws-amplify/backend";

/**
 * myApiFunction: definición del recurso /session
 */
export const livenessFunction = defineFunction({
  name: "liveness-function",
  timeoutSeconds: 300,
  environment: {
    S3_IMAGENS: process.env.S3_IMAGENS || "liveness-images-sessions-qa"
  },
});