import os
import json
from openai import OpenAI
import boto3
from tenacity import retry, wait_random_exponential, stop_after_attempt
from utils import get_openai_api_key, substitute_variables

client = OpenAI(api_key=get_openai_api_key())

# Load configuration from environment variables
PROMPT = os.environ.get('OPENAI_PROMPT')
FUNCTIONS = os.environ.get('OPENAI_FUNCTIONS')
FUNCTION_CALL = os.environ.get('OPENAI_FUNCTION_CALL')
GPT_MODEL = os.environ.get('OPENAI_GPT_MODEL', 'gpt-4-turbo')
LAMBDA_KEY = os.environ.get('LAMBDA_KEY')
MAX_TOKENS = os.environ.get('OPENAI_MAX_TOKENS', 2048)
SUPPRESS_PREFIXING = os.environ.get('SUPPRESS_PREFIXING', 'false') == 'true'


assert PROMPT, "Please provide a prompt in the OPENAI_PROMPT environment variable."
assert FUNCTIONS, "Please provide a list of functions in the OPENAI_FUNCTIONS environment variable."
assert FUNCTION_CALL, "Please provide a function call in the OPENAI_FUNCTION_CALL environment variable."
assert GPT_MODEL, "Please provide a GPT model in the OPENAI_GPT_MODEL environment variable."
assert LAMBDA_KEY, "Please provide a Lambda key as identifier of the lambda function in the LAMBDA_KEY environment variable."

FUNCTIONS = json.loads(FUNCTIONS) # Parse the JSON string into a Python dictionary
PROMPT = json.loads(PROMPT)
FUNCTION_CALL = FUNCTION_CALL

# Log the configuration
print("Prompt:", PROMPT)
print("Functions:", FUNCTIONS)
print("Function Call:", FUNCTION_CALL)
print("GPT Model:", GPT_MODEL)

@retry(wait=wait_random_exponential(multiplier=1, max=40), stop=stop_after_attempt(3))
def chat_completion_request(messages, tools=None, tool_choice=None, model=GPT_MODEL):

    # Log all the parameters
    print("Model:", model)
    print("Messages:", messages)
    print("Tools:", tools)
    print("Tool Choice:", tool_choice)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice={"type": "function", "function": {"name": tool_choice}},
            max_tokens=MAX_TOKENS,
        )
        print("Response:", response.choices[0].message.tool_calls[0].function.arguments)
        return json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    except Exception as e:
        print("Unable to generate ChatCompletion response")
        print(f"Exception: {e}")
        raise


def lambda_handler(event, context):

    # Log the event
    print("Received event:", json.dumps(event))
    # Log the context
    print("Context:", context)

    messages = []

    # Add system messages here if needed
    #messages.append({"role": "system", "content": "<Add logic for system messages here if needed>"})

    prompt_str = substitute_variables(PROMPT, event)

    messages.append({"role": "user", "content": prompt_str})
    chat_response = chat_completion_request(
        messages, tools=FUNCTIONS, tool_choice=FUNCTION_CALL
    )


    print("Assistant response:", chat_response)

    result_values = {k if SUPPRESS_PREFIXING else f"{LAMBDA_KEY}:{k}"  : v for k,v in chat_response.items()}
    print("Result values:", result_values)

    [result_values.update({k:event[k]}) for k in event if not k in result_values]
    return result_values

