type StringDictionary = { [key: string]: string };

let entry_function_tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_cloudformation_template",
            "description": "Generate a CloudFormation template for a new AWS service",
            "parameters": {
                "type": "object",
                "properties": {
                    "cloudformation_template": {
                        "type": "string",
                        "description": "The CloudFormation template for the new AWS service",
                    },
                    "documentation": {
                        "type": "string",
                        "description": "The documentation for the new AWS service",
                    },
                },
                "required": ["cloudformation_template", "documentation"],
            },
        }
    }
]

let qc_function_tools = [
    {
        "type": "function",
        "function": {
            "name": "qc_cloudformation_template",
            "description": "Quality control a CloudFormation template for a new AWS service",
            "parameters": {
                "type": "object",
                "properties": {
                    "needed_improvements": {
                        "type": "string",
                        "description": "A list of needed improvements for the CloudFormation template",
                    },
                    "pass_reject": {
                        "type": "string",
                        "enum": ["pass", "fail"],
                        "description": "Either 'pass' or 'fail' based on the quality of the CloudFormation template",
                    },
                },
                "required": ["needed_improvements", "pass_reject"],
            },
        }
    }]


export let tools: StringDictionary = {
    "entry_function_tools": JSON.stringify(entry_function_tools),
    "qc_function_tools": JSON.stringify(qc_function_tools)
}