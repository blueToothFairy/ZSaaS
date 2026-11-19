FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

WORKDIR /app

RUN groupadd --system vibetune && useradd --system --gid vibetune --create-home vibetune

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt

COPY app ./app
COPY assets/clip_processor ./assets/clip_processor
COPY assets/catalog ./assets/catalog
RUN mkdir -p assets/models
COPY assets/models/clip_vision_512.onnx ./assets/models/clip_vision_512.onnx

USER vibetune
EXPOSE 7860

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
