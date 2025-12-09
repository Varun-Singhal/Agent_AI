from pydantic import BaseModel


class PromptStructure(BaseModel):
    explicit_reasoning: bool
    structured_output: bool
    tool_separation: bool
    conversation_loop: bool
    instructional_framing: bool
    internal_self_checks: bool
    reasoning_type_awareness: bool
    fallbacks: bool
    overall_clarity: str
