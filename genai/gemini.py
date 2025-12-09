import os
from dotenv import load_dotenv

from google import genai

from .base import AIModel
from logger import get_logger

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
logger = get_logger("Gemini")


class Gemini(AIModel):

    def __init__(self):
        self.client = genai.Client(api_key=api_key)

    def call_llm(self, user_query):
        """
        Method to call llm with the prompt as a param
        """
        logger.info("Calling LLM - gemini-2.5-flash")

        response = self.client.models.generate_content(
            model="gemini-2.5-flash", contents=user_query
        )

        logger.info("LLM call completed")

        return response.text
