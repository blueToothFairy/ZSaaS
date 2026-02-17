from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
import numpy as np
import onnxruntime as ort
from transformers import CLIPProcessor
import io
import psutil
import os

def print_memory_usage(stage=""):
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    print(f"[{stage}] RAM usage: {mem:.2f} MB")

MODEL_PATH = "clip_vision_512.onnx"

app = FastAPI()

# Global objects (loaded once)
session: ort.InferenceSession = None
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


def create_session():
    so = ort.SessionOptions()
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.intra_op_num_threads = 1   # giảm RAM free tier
    so.inter_op_num_threads = 1

    return ort.InferenceSession(
        MODEL_PATH,
        sess_options=so,
        providers=["CPUExecutionProvider"]
    )


@app.on_event("startup")
def startup_event():
    global session

    print_memory_usage("Before load")

    session = create_session()

    print_memory_usage("After load")

    dummy = np.random.randn(1, 3, 224, 224).astype(np.float32)
    session.run(None, {"pixel_values": dummy})

    print_memory_usage("After warmup")


@app.post("/embed")
async def embed_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Preprocess theo chuẩn CLIP
    inputs = processor(images=image, return_tensors="np")

    # ONNX inference
    embedding = session.run(
        ["image_embeddings"],   # explicit output name
        {"pixel_values": inputs["pixel_values"]}
    )[0]

    # embedding shape: (1, 512)
    return {
        "embedding": embedding[0].tolist(),
        "shape": list(embedding.shape)
    }
