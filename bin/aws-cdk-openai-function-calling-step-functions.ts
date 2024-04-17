#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import {OpenaiLambdaLayerStack} from "../lib/openai-layer-stack";
import {OpenaiParameterStack} from "../lib/parameter-stack";
import {FunctionCallingStepFunctionsStack} from "../lib/function-calling-step-functions-stack";

const app = new cdk.App();

const lambdaLayer = new OpenaiLambdaLayerStack(app, 'OpenaiLambdaLayerStack');
const parameterStack = new OpenaiParameterStack(app, 'OpenaiSecretStack');
const functionCallingStack = new FunctionCallingStepFunctionsStack(app, 'FunctionCallingStepFunctionsStack');

// Add dependencies to the stack
functionCallingStack.addDependency(lambdaLayer);
functionCallingStack.addDependency(parameterStack);


