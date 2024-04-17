import os

import boto3


def lambda_handler(event, context):

    # Create S3 client
    s3 = boto3.client('s3')

    cloudformation_template = event['cloudformation_template']
    documentation = event['documentation']
    documentation = os.linesep.join([f"# {d}" for d in documentation.split('\n') if d])

    out_string = documentation + "\n\n" + cloudformation_template

    out_key = context.aws_request_id + '/cloudformation.yaml'
    # Write the CloudFormation template to S3
    s3.put_object(
        Body=out_string,
        Bucket=os.environ['S3_BUCKET_NAME'],
        Key=context.aws_request_id + '/cloudformation.yaml'
    )

    return {
        'statusCode': 200,
        'body': 'CloudFormation template and documentation saved to S3 under key: ' + os.environ['S3_BUCKET_NAME'] + "/" + out_key,
    }

