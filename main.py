import os
import asyncio
from dotenv import load_dotenv
from concurrent.futures import TimeoutError

from google import genai

from logger import get_logger
from client import get_tools, call_tool, close_session
from gmail import send_email_with_attachment

logging = get_logger("Orchestrator")

# Load environment variables from .env file
load_dotenv()

# Access your API key and initialize Gemini client correctly
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


async def generate_with_timeout(prompt, timeout=10):
    """Generate content with a timeout"""
    logging.info("Starting LLM generation...")
    try:
        # Convert the synchronous generate_content call to run in a thread
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model="gemini-2.0-flash", contents=prompt
                ),
            ),
            timeout=timeout,
        )
        logging.info("LLM generation completed")
        return response
    except TimeoutError:
        logging.error("LLM generation timed out!")
        raise
    except Exception as e:
        logging.error(f"Error in LLM generation: {e}")
        raise


async def main():
    logging.info("Starting main execution...")
    tool_list = []
    user_query = """Open Paint and fill the canvas with black color and then send
    the log file to my email id 'singhal.varun72@gmail.com'"""
    max_iteration = 5
    final_response = None

    try:
        tools = await get_tools()
        logging.info("Building tool list")
        for tool in tools:
            tool_list.append({"name": tool.name, "description": tool.description})

        logging.info("Generating System Prompt")

        system_prompt = f"""
        You are a simple agent who deals with desktop applications majorly dealing with paint. Based on the
        user request to need to decide what function to be called to complete the job.

        You need to respond in strictly one of the following formats. No need to add any explanations or parameters.

        FUNCTION_CALL: <function_name>|argument1, argument2 ...
        Execution Completed

        Following is the list of funtions you have to chose from as a next step: {tool_list}

        Additionally, we have one more function called send_email which takes email ID as an argument. No other function takes any argument.

        Following is the user query which you need to act upon {user_query}
        """

        logging.info("System Prompt Generated")
        i = 0

        while i < max_iteration:
            final_response = await generate_with_timeout(system_prompt)
            final_response = final_response.text
            if not final_response.startswith("FUNCTION_CALL"):
                break

            system_prompt += f"\n\n\nIn the last step, {final_response} was executed. What should be done next ?\n\n"
            final_response = final_response.split(":", 1)[1].strip()
            function_name = final_response.splitlines()[0].strip()
            logging.info(f"Iteration{str(i+1)}\n\n{function_name}")
            if function_name.startswith("send_email"):
                logging.info("Sending email")
                email_id = function_name.split("|")[1]
                send_email_with_attachment(email_id)
                logging.info("Email Sent Successfully")
                break
            await call_tool(function_name)

            i += 1

        await close_session()

    except Exception as ex:
        pass


if __name__ == "__main__":
    asyncio.run(main())
