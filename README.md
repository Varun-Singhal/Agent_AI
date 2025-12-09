## Prompt Evaluator & Rewriter

This project runs your prompt through two LLMs (Gemini 2.5 Flash and GPT‑4o), scores it against a rubric, and rewrites it so it better supports structured, step‑by‑step tool use. JSON validation is enforced with Pydantic, and logs are written to `app.log`.

### What it does
- Loads the evaluation rubric from `pop.md` and the raw user prompt from `prompt.yaml`.
- Builds a “scaling” prompt, asks each model for a structured JSON review, and validates it with `PromptStructure`.
- Feeds the validated analysis back to the model to generate an improved prompt.
- Runs models sequentially (`Gemini` then `GPT`), so each iteration rewrites the prompt based on the previous output.

### Project layout
- `main.py` — Orchestrates the two-pass analysis and regeneration loop.
- `genai/gemini.py` & `genai/gpt.py` — Model wrappers for Gemini and GPT‑4o.
- `prompt.yaml` — The user prompt template; edit this to change the starting prompt.
- `pop.md` — Rubric that defines the JSON review format.
- `schema.py` — Pydantic schema ensuring responses are well-formed.
- `utils.py` — Helpers for loading prompts and building the LLM inputs.

### Requirements
- Python 3.12+
- API keys in environment variables: `GEMINI_API_KEY`, `OPENAI_API_KEY`
- Python deps: `dotenv`, `google-genai`, `langchain`, `langchain-openai`, `pyyaml`, `pydantic`

### Setup
1) Create and activate a virtual environment.  
2) Install dependencies:
```
pip install -U pip
pip install dotenv google-genai langchain langchain-openai pyyaml pydantic
```
3) Add a `.env` file in the project root:
```
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
```

### Running
```
python main.py
```
The script logs progress to the console and `app.log`, prints each model’s analysis, and outputs the regenerated prompt.

### Customizing prompts
- Edit `prompt.yaml` to change the initial prompt template (replace placeholders like `{tool_list}` and `{user_query}` with real values).
- Tweak `pop.md` to adjust the evaluation rubric or JSON fields.
- Add/remove models in `main.py` by updating the `models` list.

### Troubleshooting
- If JSON parsing fails, check the model output in `app.log` and ensure the rubric in `pop.md` still matches `PromptStructure`.
- If dependencies are missing, reinstall the packages listed above.
- Make sure your API keys are loaded (e.g., `python -c "import os; print(os.getenv('GEMINI_API_KEY'))"`).

