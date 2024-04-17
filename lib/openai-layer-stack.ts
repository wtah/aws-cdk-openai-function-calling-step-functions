import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class OpenaiLambdaLayerStack extends cdk.Stack {
  public readonly myLayerArn: string;  // Expose the layer ARN as a public member

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda layer
    const openLambdaLayer = new lambda.LayerVersion(this, 'OpenLambdaLayer', {
      code: lambda.Code.fromAsset('src/lambda/openai-layer', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash', '-c', `
            pip install openai==1.19.0 -t /asset-output/python/lib/python3.9/site-packages
            `
          ]
        }
      }),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'A layer containing openai',
    });

    // Store the Layer ARN
    this.myLayerArn = openLambdaLayer.layerVersionArn;

    // Output the Layer ARN for other stacks to use
    new cdk.CfnOutput(this, 'LayerArnOutput', {
      value: openLambdaLayer.layerVersionArn,
      exportName: 'OpenAILambdaLayerVersionArn',
      description: 'ARN of the Lambda Layer containing openai'
    });
  }
}

