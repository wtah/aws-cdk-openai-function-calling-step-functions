import os
import re
from copy import copy

import boto3
import json

def get_openai_api_key():
    parameter_name = os.environ.get('OPENAI_API_KEY_PARAMETER_NAME')

    print("Parameter Name: ", parameter_name)

    region_name = os.environ.get('AWS_REGION')

    session = boto3.session.Session()
    ssm_client = session.client(service_name='ssm', region_name=region_name)

    try:
        response = ssm_client.get_parameter(Name=parameter_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print("Unable to retrieve parameter: ", e)
        return None


def serialize_value(value):
    """
    Convert a given value to a string in a reasonable manner.
    """
    if isinstance(value, (int, float, bool, str)):
        return str(value)
    elif isinstance(value, (list, dict, tuple)):
        try:
            return json.dumps(value)
        except TypeError as e:
            print(f"Warning: Failed to serialize value {value}. Error: {e}")
            return str(value)
    else:
        return str(value)


def substitute_variables(text, variables):
    """
    Substitute all occurrences of {{variable}} in 'text' with the value from the 'variables' dictionary.
    If the variable isn't found in the dictionary, print a warning.
    """
    # Regex to find {{variable}} patterns
    pattern = r'\{\{([\w:]+)\}\}'
    print('Pattern:', pattern)

    # add non-scoped variables
    for key, value in copy(variables).items():
        if ':' in key:
            variables[key.split(':')[-1]] = value

    # Function to replace each match
    def replace(match):
        var_name = match.group(1)  # Extract variable name from match
        print(f"Replacing variable '{var_name}'")
        if var_name in variables:
            print(f"Value provided for variable '{var_name}'")
            return serialize_value(variables[var_name])  # Serialize and return the value

        else:
            print(f"Warning: No value provided for variable '{var_name}'")
            return match.group(0)  # Return the original text

    return re.sub(pattern, replace, text)


