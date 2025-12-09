import os
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI

from .base import AIModel
from logger import get_logger

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
logger = get_logger("GPT")


class GPT(AIModel):
    def __init__(self):
        self.client = ChatOpenAI(model="gpt-4o", api_key=api_key)

    def call_llm(self, user_query):
        """
        Method to call llm with the prompt as a param
        """
        logger.info("Calling LLM gpt-4o")

        response = self.client.invoke(input=user_query)
        logger.info("LLM Call Completed")

        return response.content
