type StringDictionary = { [key: string]: string };

let entryPrompt: string = `You are a first class AWS Architect and Developer! Your task is to generate a complete CloudFormation template for a new AWS service. Use the provided description and create the template as one complete file!

Description:
{{input:description}}

Requirements:
- The CloudFormation template must be in YAML format
- The CloudFormation template must be in a single file
- The CloudFormation template must be valid and deployable
- The CloudFormation template must contain all necessary resources
- The CloudFormation template must follow best practices
- Your CloudFormation template must be thoroughly documented
`;


let improvePrompt: string = `You are a first class AWS Architect and Developer! Your task is to improve the CloudFormation template for a new AWS service. Use the provided description and improve the template as one complete file!

Description:
{{input:description}}

Current CloudFormation Template:
{{cloudformation_template}}

Current Documentation:
{{documentation}}

Necessary Improvements:
{{needed_improvements}}

Requirements:
- The CloudFormation template must be in YAML format
- The CloudFormation template must be in a single file
- The CloudFormation template must be valid and deployable
- The CloudFormation template must contain all necessary resources
- The CloudFormation template must follow best practices
- Your CloudFormation template must be thoroughly documented
`;

let qcPrompt: string = `You are a first class AWS Architect and Developer! Your task is to review the CloudFormation template for a new AWS service. Use the provided description and review the template as one complete file! Provide feedback on things to improve  on the template and documentation in case there are things that need to be changed otherwise you can write 'eveything ok'. If the template does not fulfill the requirements mark in as 'fail', if the template fulfills the requirements mark it as 'pass'.

Description:
{{input:description}}

Current CloudFormation Template:
{{cloudformation_template}}

Current Documentation:
{{documentation}}

Requirements:
- The CloudFormation template must be in YAML format
- The CloudFormation template must be in a single file
- The CloudFormation template must be valid and deployable
- The CloudFormation template must contain all necessary resources
- The CloudFormation template must follow best practices
- The CloudFormation template must be thoroughly documented
- The CloudFormation template must contain all necessary access rights and components to handle the use-case.
`;




export let prompts: StringDictionary = {
    "entry_prompt": JSON.stringify(entryPrompt),
    "improve_prompt": JSON.stringify(improvePrompt),
    "qc_prompt": JSON.stringify(qcPrompt),
};