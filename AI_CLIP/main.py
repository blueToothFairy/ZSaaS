from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
import numpy as np
import onnxruntime as ort
from transformers import CLIPProcessor
import io
import psutil
import os

MODEL_PATH = "clip_vision_512.onnx"
TEXT_EMB_PATH = "vibe_embeddings.npy"
KEYWORDS_PATH = "vibe_keywords.npy"


def print_memory_usage(stage=""):
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    print(f"[{stage}] RAM usage: {mem:.2f} MB")


app = FastAPI()

session: ort.InferenceSession = None
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

text_matrix = None
keywords = None


def create_session():
    so = ort.SessionOptions()
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.intra_op_num_threads = 1
    so.inter_op_num_threads = 1
    so.enable_mem_pattern = False
    so.enable_cpu_mem_arena = False

    return ort.InferenceSession(
        MODEL_PATH,
        sess_options=so,
        providers=["CPUExecutionProvider"]
    )


@app.on_event("startup")
def startup_event():
    global session, text_matrix, keywords

    print_memory_usage("Before load")

    session = create_session()

    text_matrix = np.load(TEXT_EMB_PATH)       # (N,512)
    keywords = np.load(KEYWORDS_PATH)          # (N,)

    text_matrix = text_matrix / np.linalg.norm(text_matrix, axis=1, keepdims=True)


    print("Loaded text embeddings:", text_matrix.shape)

    dummy = np.random.randn(1, 3, 224, 224).astype(np.float32)
    session.run(None, {"pixel_values": dummy})

    print_memory_usage("After warmup")


@app.get('/ping')
async def ping():
    """Lightweight ping endpoint used by keep-alive pings."""
    return {"status": "ok"}


@app.post("/extract-vibes")
async def extract(file: UploadFile = File(...)):

    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")

    inputs = processor(images=image, return_tensors="np")

    image_emb = session.run(
        ["image_embeddings"],
        {"pixel_values": inputs["pixel_values"]}
    )[0]  # (1,512)

    # cosine similarity (already normalized)
    image_emb = image_emb / np.linalg.norm(image_emb, axis=1, keepdims=True)
    scores = (image_emb @ text_matrix.T)   # (1,N)

    topk_idx = np.argsort(-scores[0])[:10]

    top_keywords = [
        {
            "keyword": keywords[i],
            "score": float(scores[0][i])
        }
        for i in topk_idx
    ]

    return {
        "top_keywords": top_keywords
    }
