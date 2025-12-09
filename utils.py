import yaml


def read_yaml(filename):
    with open(filename, "r") as file:
        data = yaml.safe_load(file)
    return data


def read_md(filename):
    with open(filename, "r", encoding="utf-8") as file:
        data = file.read()
    return data


def get_scalling_prompt(system_prompt, user_prompt):
    return f"""
        {system_prompt}\n\n
        Following is the prompt written by user:\n\n
        {user_prompt}\n\n
        You must respond with ONLY valid JSON.
        - Do NOT include backticks.
        - Do NOT include explanations before or after.
        - Do NOT include any text outside the JSON object.
        - Your entire response must be exactly one JSON object.
    """


def get_generation_prompt(analysis, user_prompt):
    return f"""
    Based on analysis on the prompt given by the user, rephrase the prompt so that it qualifies all parameters in the analysis.
    \n\n
    Prompt given by user : {user_prompt}
    \n\n
    Analysis : {analysis}
    """
