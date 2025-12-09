import json
import re

from genai.gpt import GPT
from genai.gemini import Gemini
from schema import PromptStructure
from logger import get_logger
from utils import read_md, read_yaml, get_scalling_prompt, get_generation_prompt

logger = get_logger("Main")


def main():
    models = [Gemini(), GPT()]
    user_prompt = read_yaml("prompt.yaml").get("input_prompt")
    system_prompt = read_md("pop.md")

    for i, model in enumerate(models):
        logger.info(f"Working with model {str(i+1)}")
        prompt = get_scalling_prompt(system_prompt, user_prompt)
        analysis = None
        logger.info("Scanning prompt")
        analysis = model.call_llm(prompt)
        analysis = re.search(r"\{.*\}", analysis, flags=re.DOTALL).group(0)
        data = json.loads(analysis)
        logger.info("Validating response structure with pydantic schema")
        data = PromptStructure(**data)
        logger.info(f"Prompt Analysis by model : {str(data)}")

        prompt = get_generation_prompt(analysis, user_prompt)
        logger.info("Generating new prompt")
        user_prompt = model.call_llm(prompt)
        logger.info(f"Prompt Generated:\n\n{user_prompt}")


if __name__ == "__main__":
    main()
