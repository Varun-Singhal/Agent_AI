import logging
from pathlib import Path


_LOG_FILE = Path("app.log")

# Configure root logger once to write to file and echo to console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(_LOG_FILE, mode="w", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)