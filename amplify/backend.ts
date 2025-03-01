import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { livenessFunction } from "./functions/liveness-function/resource";
import { configFunction } from "./functions/config-function/resource";
import { circuitFunction } from "./functions/circuit-function/resource";
import { uploadFunction } from "./functions/upload-function/resource"
import { identityVerifyFunction } from "./functions/identity-verify-function/resource";

const backend = defineBackend({
  auth,
  data,
  livenessFunction,
  configFunction,
  circuitFunction,
  uploadFunction,
  identityVerifyFunction,
});

//=============create a new API stack==============
const apiStack = backend.createStack("api-stack");

// create a new REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "biometricApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});
//==============create s3 bucket====================
const livenessBucket = new s3.Bucket(apiStack, 'LivenessBucket', {
  bucketName: 'liveness-images-sessions-qa',
  versioned: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// ==============Create resource session============
// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.livenessFunction.resources.lambda
);
// create a new resource path with IAM authorization
const sessionPath = myRestApi.root.addResource("session", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});
// add methods you would like to create to the resource path
sessionPath.addMethod("GET", lambdaIntegration);
sessionPath.addMethod("POST", lambdaIntegration);
// add a proxy resource path to the API
sessionPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// ==============Create resource getConfig============
// create a new Lambda integration
const lambdaConfigIntegration = new LambdaIntegration(
  backend.configFunction.resources.lambda
);
// create a new resource path with IAM authorization
const configPath = myRestApi.root.addResource("config", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});
// add methods you would like to create to the resource path
configPath.addMethod("GET", lambdaConfigIntegration);
// add a proxy resource path to the API
configPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaConfigIntegration,
});

// ==============Create resource identityVerify============
// create a new Lambda integration
const lambdaIdentityVerifyIntegration = new LambdaIntegration(
  backend.identityVerifyFunction.resources.lambda
);
// create a new resource path with IAM authorization
const identityVerifyPath = myRestApi.root.addResource("identity", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});
// add methods you would like to create to the resource path
identityVerifyPath.addMethod("POST", lambdaIdentityVerifyIntegration);
// add a proxy resource path to the API
identityVerifyPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIdentityVerifyIntegration,
});

// ==============Create resource upload============
// create a new Lambda integration
const lambdaUploadIntegration = new LambdaIntegration(
  backend.uploadFunction.resources.lambda
);
// create a new resource path with IAM authorization
const uploadPath = myRestApi.root.addResource("upload", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});
// add methods you would like to create to the resource path
uploadPath.addMethod("POST", lambdaUploadIntegration);
// add a proxy resource path to the API
uploadPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaUploadIntegration,
});

// ==============Create resource processCircuit============
// create a new Lambda integration
const lambdaCircuitIntegration = new LambdaIntegration(
  backend.circuitFunction.resources.lambda
);
// create a new resource path with IAM authorization
const circuitPath = myRestApi.root.addResource("circuit", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});
// add methods you would like to create to the resource path
circuitPath.addMethod("POST", lambdaCircuitIntegration);
// add a proxy resource path to the API
circuitPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaCircuitIntegration,
});


//================create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = myRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/session", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/session/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/data", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/data/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/config", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/config/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/circuit", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/circuit/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/upload", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/upload/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/identity", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/identity/*", "dev")}`,
      ],
    })
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// create a new policy for Rekognition and SSM access
const SMPolicy = new Policy(apiStack, "SMPolicy", {
  statements: [
    new PolicyStatement({
      actions: [
        "secretsmanager:GetSecretValue"
      ],
      resources: ["*"],
    }),
  ],
});
// create a new policy for Rekognition and S3 access
const S3Policy = new Policy(apiStack, "S3Policy", {
  statements: [
    new PolicyStatement({
      actions: [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
      ],
      resources: [`${livenessBucket.bucketArn}/*`]
    }),
    new PolicyStatement({
      actions: [
        "s3:ListBucket" 
      ],
      resources: [`${livenessBucket.bucketArn}`], // Permite listar el bucket
    }),
  ],
});

// create a new policy for Rekognition and S3 access
const rekognitionAndS3Policy = new Policy(apiStack, "RekognitionAndS3Policy", {
  statements: [
    new PolicyStatement({
      actions: [
        "rekognition:CreateFaceLivenessSession",
        "rekognition:StartFaceLivenessSession",
        "rekognition:GetFaceLivenessSessionResults",
      ],
      resources: ["*"],
    }),
    new PolicyStatement({
      actions: [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
      ],
      resources: [`${livenessBucket.bucketArn}/*`]
    }),
  ],
});

// attach the policy to the Lambda execution role
const lambdaRole = backend.livenessFunction.resources.lambda.role as Role;
lambdaRole.attachInlinePolicy(rekognitionAndS3Policy);

// attach the policy to the Lambda execution role
const lambdaCircuitRole = backend.circuitFunction.resources.lambda.role as Role;
lambdaCircuitRole.attachInlinePolicy(S3Policy);
lambdaCircuitRole.attachInlinePolicy(SMPolicy);

// attach the policy to the Lambda execution role
const lambdaConfigRole = backend.configFunction.resources.lambda.role as Role;
lambdaConfigRole.attachInlinePolicy(SMPolicy);

// attach the policy to the Lambda execution role
const lambdaUploadRole = backend.uploadFunction.resources.lambda.role as Role;
lambdaUploadRole.attachInlinePolicy(S3Policy);

// attach the policy to the Lambda execution role
const lambdaIndetityVerifyRole = backend.identityVerifyFunction.resources.lambda.role as Role;
lambdaIndetityVerifyRole.attachInlinePolicy(SMPolicy);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});
const livenessStack = backend.createStack("liveness-stack");

const livenessPolicy = new Policy(livenessStack, "LivenessPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["rekognition:StartFaceLivenessSession"],
      resources: ["*"],
    }),
  ],
});
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(livenessPolicy); // allows guest user access
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(livenessPolicy);