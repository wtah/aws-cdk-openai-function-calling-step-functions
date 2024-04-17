import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam'; // Import IAM to handle permissions


export class OpenaiParameterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const parameterName = '/config/openai/apiKey';

    // Fetch the OpenAI API key from environment variables
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Create or update an SSM parameter with the OpenAI API key
    const parameter = new ssm.StringParameter(this, 'OpenAiApiKeyParameter', {
      parameterName: parameterName,
      stringValue: openAiApiKey,
      description: 'Parameter to store the OpenAI API key',
      // Choose appropriate tier based on your usage; 'Standard' is the default
      tier: ssm.ParameterTier.STANDARD
    });

    // Output the parameter name
    new cdk.CfnOutput(this, 'OpenAiApiKeyParameterName', {
      value: parameter.parameterName,
      description: 'Name of the SSM parameter storing the OpenAI API key',
      exportName: 'OpenAiApiKeyParameterName'
    });

  }
}
