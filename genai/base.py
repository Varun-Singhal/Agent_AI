from abc import ABC, abstractmethod


class AIModel(ABC):

    @abstractmethod
    def call_llm(self, user_query):
        pass
