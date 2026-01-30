from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
import tiktoken
load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")

input_text= "WAZZZZUPPPP"

embeddings = OpenAIEmbeddings(
    model = "text-embedding-3-small"
)

vector = embeddings.embed_query(input_text)

print(vector)
