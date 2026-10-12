from abc import ABC, abstractmethod
from typing import List
import os

class EmbeddingService(ABC):
    """
    Provider-independent interface for generating text embeddings.
    """
    
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate an embedding for a single string."""
        pass
        
    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of strings."""
        pass
        
    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the expected vector dimension."""
        pass


class FakeEmbeddingService(EmbeddingService):
    """
    A fake embedding service for testing purposes.
    Generates deterministic vectors of the correct dimension.
    """
    def __init__(self, dimension: int = 768):
        self._dimension = dimension
        
    def embed_text(self, text: str) -> List[float]:
        # Return a simple deterministic vector based on string length and dimension
        val = len(text) % 100 / 100.0
        return [val] * self._dimension
        
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]
        
    @property
    def dimension(self) -> int:
        return self._dimension

def get_embedding_service() -> EmbeddingService:
    provider = os.getenv("EMBEDDING_PROVIDER", "fake")
    if provider == "fake":
        return FakeEmbeddingService()
    # Placeholder for real implementations later (e.g., ollama, cloud)
    raise NotImplementedError(f"Embedding provider '{provider}' is not yet implemented.")
