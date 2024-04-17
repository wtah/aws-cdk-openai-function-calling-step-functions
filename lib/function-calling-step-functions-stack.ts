import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Construct} from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {prompts} from "../config/prompts";
import {tools} from "../config/tools";


export class FunctionCallingStepFunctionsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Import the Lambda Layer ARN from another stack's output
        const importedLayerArn = cdk.Fn.importValue('OpenAILambdaLayerVersionArn');
        const layer = lambda.LayerVersion.fromLayerVersionArn(this, 'ImportedLayer', importedLayerArn);
        // import the parameter name from the other stack
        const parameterName = cdk.Fn.importValue('OpenAiApiKeyParameterName');

        console.log('importedLayerArn:', importedLayerArn);
        console.log('parameterName:', parameterName);

        // Define the Lambda function and attach the imported layer
        const entryFunction = new lambda.Function(this, 'EntryFunction', {
            runtime: lambda.Runtime.PYTHON_3_9,  // Set the runtime to Python 3.9
            handler: 'handler.lambda_handler',
            code: lambda.Code.fromAsset('src/lambda/function-calling-template', {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_9.bundlingImage,
                    command: [
                        'bash', '-c', `
                        pip install -r requirements.txt -t /asset-output &&
                        cp -r . /asset-output
                        `
                    ],
                }
            }),  // Set this to the path of your local Lambda code
            layers: [layer],  // Attach the imported Lambda layer
            timeout: cdk.Duration.minutes(2),  // Set the timeout to 120 seconds
            environment: {
                OPENAI_PROMPT: prompts['entry_prompt'],
                OPENAI_FUNCTIONS: tools['entry_function_tools'],
                OPENAI_FUNCTION_CALL: 'generate_cloudformation_template',
                OPENAI_API_KEY_PARAMETER_NAME: parameterName,
                LAMBDA_KEY: 'entry_lambda',
                SUPPRESS_PREFIXING: 'true'
            }
        });

        // IAM policy to allow the Lambda function to read the SSM parameter
        const policy = new iam.PolicyStatement({
            actions: ['ssm:GetParameter'],
            resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${parameterName}`],
        });

        // Attach the policy to the Lambda function's execution role
        entryFunction.addToRolePolicy(policy);


        const improveFunction = new lambda.Function(this, 'ImproveFunction', {
            runtime: lambda.Runtime.PYTHON_3_9,  // Set the runtime to Python 3.9
            handler: 'handler.lambda_handler',
            code: lambda.Code.fromAsset('src/lambda/function-calling-template', {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_9.bundlingImage,
                    command: [
                        'bash', '-c', `
                        pip install -r requirements.txt -t /asset-output &&
                        cp -r . /asset-output
                        `
                    ],
                }
            }),  // Set this to the path of your local Lambda code
            layers: [layer],  // Attach the imported Lambda layer
            timeout: cdk.Duration.minutes(2),  // Set the timeout to 120 seconds
            environment: {
                OPENAI_PROMPT: prompts['improve_prompt'],
                OPENAI_FUNCTIONS: tools['entry_function_tools'],
                OPENAI_FUNCTION_CALL: 'generate_cloudformation_template',
                OPENAI_API_KEY_PARAMETER_NAME: parameterName,
                LAMBDA_KEY: 'improve_lambda',
                SUPPRESS_PREFIXING: 'true'
            }
        });

        // Attach the policy to the Lambda function's execution role
        improveFunction.addToRolePolicy(policy);

        const qcFunction = new lambda.Function(this, 'QCFunction', {
            runtime: lambda.Runtime.PYTHON_3_9,  // Set the runtime to Python 3.9
            handler: 'handler.lambda_handler',
            code: lambda.Code.fromAsset('src/lambda/function-calling-template', {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_9.bundlingImage,
                    command: [
                        'bash', '-c', `
                        pip install -r requirements.txt -t /asset-output &&
                        cp -r . /asset-output
                        `
                    ],
                }
            }),  // Set this to the path of your local Lambda code
            layers: [layer],  // Attach the imported Lambda layer
            timeout: cdk.Duration.minutes(2),  // Set the timeout to 120 seconds
            environment: {
                OPENAI_PROMPT: prompts['qc_prompt'],
                OPENAI_FUNCTIONS: tools['qc_function_tools'],
                OPENAI_FUNCTION_CALL: 'qc_cloudformation_template',
                OPENAI_API_KEY_PARAMETER_NAME: parameterName,
                LAMBDA_KEY: 'qc_lambda',
                SUPPRESS_PREFIXING: 'true'
            }
        });

        // Create an output S3 bucket
        const outputBucket = new s3.Bucket(this, 'OutputBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Attach the policy to the Lambda function's execution role
        qcFunction.addToRolePolicy(policy);

        const saveFunction = new lambda.Function(this, 'SaveFunction', {
            runtime: lambda.Runtime.PYTHON_3_9,  // Set the runtime to Python 3.9
            handler: 'handler.lambda_handler',
            code: lambda.Code.fromAsset('src/lambda/save-to-s3', {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_9.bundlingImage,
                    command: [
                        'bash', '-c', `
                        pip install -r requirements.txt -t /asset-output &&
                        cp -r . /asset-output
                        `
                    ],
                }
            }),  // Set this to the path of your local Lambda code
            timeout: cdk.Duration.seconds(10),  // Set the timeout to 10 seconds
            environment: {
                S3_BUCKET_NAME: outputBucket.bucketName
            }
        });

        // Attach the policy to the Lambda function's execution role
        saveFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['s3:PutObject'],
            resources: [outputBucket.bucketArn + '/*'],
        }));

        // Assuming the lambdas are initialized as shown in the previous code
        const processTask = new tasks.LambdaInvoke(this, 'ProcessTask', {
            lambdaFunction: entryFunction,
            outputPath: '$.Payload'
        });

        const qcTask = new tasks.LambdaInvoke(this, 'QualityControlTask', {
            lambdaFunction: qcFunction,
            inputPath: '$',
            outputPath: '$.Payload'
        });

        const improveTask = new tasks.LambdaInvoke(this, 'ImproveTask', {
            lambdaFunction: improveFunction,
            inputPath: '$',
            outputPath: '$.Payload'
        });

        const saveTask = new tasks.LambdaInvoke(this, 'SaveTask', {
            lambdaFunction: saveFunction,
            inputPath: '$',
            outputPath: '$.Payload'
        });

        // Define choice state
        const decision = new sfn.Choice(this, 'Decision')
            .when(sfn.Condition.stringEquals('$.pass_reject', 'fail'), improveTask.next(qcTask))
            .otherwise(saveTask.next(new sfn.Succeed(this, 'Success')));

        // Define the workflow
        const definition = processTask
            .next(qcTask)
            .next(decision);

        // Create the state machine
        new sfn.StateMachine(this, 'StateMachine', {
            definitionBody: sfn.DefinitionBody.fromChainable(definition),
            timeout: cdk.Duration.minutes(15)
        });
    }
}
