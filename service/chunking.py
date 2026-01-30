import re
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from pypdf import PdfReader

file_type = "pdf" #pdf or txt

text_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", " ", ""],
    chunk_size=600,
    chunk_overlap=100,
    length_function=len,
)
#if text file
def chunk_text(file):
    with open(file, "r", encoding="utf-8") as f:
        file_read = f.read()

    chunks_with_meta = []

    lines_per_page = 50
    lines = file_read.split("\n")
    for pseudo_page_number, start in enumerate(range(0, len(lines), lines_per_page), start=1):
        page_text = "\n".join(lines[start:start+lines_per_page])
        for chunk in text_splitter.split_text(page_text):
            chunks_with_meta.append({
                "chunk_content": chunk,
                "page_number": pseudo_page_number,
                "source_file": "TEXT TEST"
            })

    chunks = text_splitter.split_text(file_read)
    return chunks

def chunk_pdf(file):
    reader = (PdfReader(file))
    num_of_pages = len(reader.pages)
    # filename = file.filename.lower()
    # print(reader.pages[0])
    chunks_with_meta = []

    for page_number, page in enumerate(reader.pages, start = 1):
        page_text = page.extract_text() or ""
        for chunk in text_splitter.split_text(page_text):
            chunks_with_meta.append({
                "chunk_content": chunk,
                "page_number": page_number,
                "source_file": "AHHHH"
            })
    
    print(chunks_with_meta[:5])

    
chunk_pdf("test.pdf")


   

    # print(meta.author)
    # print(meta.subject)
    # print(meta.creator)
    # print(meta.producer)
    # print(meta.creation_date)
    # print(meta.modification_date)


# if file_type == "pdf":
#     chunk_text("test.txt")
# elif file_type == "txt":
#     chunk_pdf("test.pdf")

# texts = text_splitter.split_text(file)
# print(texts[:3])

