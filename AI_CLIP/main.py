from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
from starlette.concurrency import run_in_threadpool
import numpy as np
import onnxruntime as ort
from transformers import CLIPProcessor
import io
import psutil
import os
import time

MODEL_PATH = "clip_vision_512.onnx"
TEXT_EMB_PATH = "vibe_embeddings.npy"
KEYWORDS_PATH = "vibe_keywords.npy"
CLIP_PROCESSOR_PATH = os.getenv("CLIP_PROCESSOR_PATH", "openai/clip-vit-base-patch32")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 25_000_000


def print_memory_usage(stage=""):
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    print(f"[{stage}] RAM usage: {mem:.2f} MB")


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

    print_memory_usage("Before load")

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

    print_memory_usage("After warmup")


@app.get('/ping')
async def ping():
    """Lightweight ping endpoint used by keep-alive pings."""
    return {"status": "ok"}


@app.post("/extract-vibes")
async def extract(file: UploadFile = File(...)):
    request_started = time.perf_counter()
    process = psutil.Process(os.getpid())
    memory_before_mb = process.memory_info().rss / 1024 / 1024

    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller")

    decode_started = time.perf_counter()
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
    decode_ms = (time.perf_counter() - decode_started) * 1000

    result = await run_in_threadpool(infer_vibes, image, len(contents), request_started, memory_before_mb, decode_ms)
    return result


def infer_vibes(image: Image.Image, input_bytes: int, request_started: float, memory_before_mb: float, decode_ms: float):
    if session is None or text_matrix is None or keywords is None:
        raise HTTPException(status_code=503, detail="Image model is not ready")

    process = psutil.Process(os.getpid())
    preprocess_started = time.perf_counter()
    inputs = processor(images=image, return_tensors="np")
    preprocess_ms = (time.perf_counter() - preprocess_started) * 1000
    inference_started = time.perf_counter()
    image_emb = session.run(
        ["image_embeddings"],
        {"pixel_values": inputs["pixel_values"]}
    )[0]  # (1,512)
    inference_ms = (time.perf_counter() - inference_started) * 1000

    # cosine similarity (already normalized)
    ranking_started = time.perf_counter()
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
    ranking_ms = (time.perf_counter() - ranking_started) * 1000
    memory_info = process.memory_info()
    peak_memory_bytes = getattr(memory_info, "peak_wset", None)
    if peak_memory_bytes is None and os.name != "nt":
        try:
            import resource
            peak_rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            peak_memory_bytes = peak_rss if os.uname().sysname == "Darwin" else peak_rss * 1024
        except (ImportError, AttributeError):
            peak_memory_bytes = None

    return {
        "top_keywords": top_keywords,
        "telemetry": {
            "model_state": "warm",
            "input_bytes": input_bytes,
            "timing_ms": {
                "decode": round(decode_ms, 3),
                "preprocess": round(preprocess_ms, 3),
                "inference": round(inference_ms, 3),
                "keyword_ranking": round(ranking_ms, 3),
                "total": round((time.perf_counter() - request_started) * 1000, 3),
            },
            "memory_mb": {
                "before": round(memory_before_mb, 3),
                "after": round(memory_info.rss / 1024 / 1024, 3),
                "peak": round(peak_memory_bytes / 1024 / 1024, 3) if peak_memory_bytes is not None else None,
            },
        },
    }
