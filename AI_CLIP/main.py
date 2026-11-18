from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
from starlette.concurrency import run_in_threadpool
import numpy as np
import onnxruntime as ort
from transformers import CLIPProcessor
import io
import os

MODEL_PATH = "clip_vision_512.onnx"
TEXT_EMB_PATH = "vibe_embeddings.npy"
KEYWORDS_PATH = "vibe_keywords.npy"
CLIP_PROCESSOR_PATH = os.getenv("CLIP_PROCESSOR_PATH", "openai/clip-vit-base-patch32")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 25_000_000


app = FastAPI()
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

session: ort.InferenceSession = None
processor = CLIPProcessor.from_pretrained(CLIP_PROCESSOR_PATH)

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

    session = create_session()

    text_matrix = np.load(TEXT_EMB_PATH)       # (N,512)
    keywords = np.load(KEYWORDS_PATH)          # (N,)

    if len(keywords) < text_matrix.shape[0]:
        raise ValueError(
            f"Keyword catalog has {len(keywords)} labels but {text_matrix.shape[0]} text embeddings"
        )
    if len(keywords) > text_matrix.shape[0]:
        print(
            f"Keyword catalog has {len(keywords)} labels but only {text_matrix.shape[0]} embeddings; "
            "ignoring labels without matching embeddings"
        )
        keywords = keywords[:text_matrix.shape[0]]

    text_matrix = text_matrix / np.linalg.norm(text_matrix, axis=1, keepdims=True)


    print("Loaded text embeddings:", text_matrix.shape)

    dummy = np.random.randn(1, 3, 224, 224).astype(np.float32)
    session.run(None, {"pixel_values": dummy})



@app.get('/ping')
async def ping():
    """Lightweight ping endpoint used by keep-alive pings."""
    return {"status": "ok"}


@app.post("/extract-vibes")
async def extract(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller")

    try:
        image = Image.open(io.BytesIO(contents))
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise HTTPException(status_code=413, detail="Image dimensions are too large")
        image.verify()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except HTTPException:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status_code=413, detail="Image dimensions are too large")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image")
    return await run_in_threadpool(infer_vibes, image)


def infer_vibes(image: Image.Image):
    if session is None or text_matrix is None or keywords is None:
        raise HTTPException(status_code=503, detail="Image model is not ready")

    inputs = processor(images=image, return_tensors="np")
    image_emb = session.run(
        ["image_embeddings"],
        {"pixel_values": inputs["pixel_values"]}
    )[0]  # (1,512)

    # cosine similarity (already normalized)
    norm = np.linalg.norm(image_emb, axis=1, keepdims=True)
    if not np.isfinite(norm).all() or np.any(norm == 0):
        raise HTTPException(status_code=500, detail="Image embedding could not be calculated")
    image_emb = image_emb / norm
    scores = (image_emb @ text_matrix.T)   # (1,N)

    topk_idx = np.argsort(-scores[0])[:10]

    top_keywords = [
        {
            "keyword": keywords[i],
            "score": float(scores[0][i])
        }
        for i in topk_idx
    ]
    return {"top_keywords": top_keywords}
