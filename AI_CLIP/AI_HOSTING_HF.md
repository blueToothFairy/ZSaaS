# Deploy the AI Service to Hugging Face Spaces

The AI service is a Docker Space. Keep the Space metadata at the top of `AI_CLIP/README.md`, and keep the container listening on port `7860`.

## Required Runtime Files

The Docker build includes the package and the following runtime assets:

- `app/`
- `assets/models/clip_vision_512.onnx`
- `assets/catalog/vibe_embeddings.npy`
- `assets/catalog/vibe_keywords.npy`
- `assets/clip_processor/`
- `requirements.txt`

Alternative ONNX variants and development notebooks are excluded from the container image.

## Local Container Check

From `AI_CLIP/`, build and start the image:

```bash
docker build -t vibetune-ai .
docker run --rm -p 7860:7860 vibetune-ai
```

Check `http://localhost:7860/ping` for `{"status":"ok"}` and `http://localhost:7860/docs` for the API schema. Model initialization happens before the container reports itself ready.

## Publish the Space

1. Create or open a Hugging Face Space configured with the **Docker** SDK.
2. Clone the Space repository and copy `README.md`, `Dockerfile`, `requirements.txt`, `app/`, `assets/catalog/`, `assets/clip_processor/`, and `assets/models/clip_vision_512.onnx` into its repository root. The Docker image does not need the alternative models, tests, notebook, or scripts.
3. Configure Git LFS for ONNX assets if the Space repository does not already track them:

   ```bash
   git lfs install
   git lfs track "*.onnx"
   git add .gitattributes
   ```

4. Commit and push the service files and required model assets to the Space repository. Do not remove an existing `.git` directory or overwrite unrelated repository history.
5. Wait for the Docker build to complete, then check the Space logs and `https://<space-host>/ping`.

No runtime Hugging Face token is required: the processor files are packaged locally and the image runs in offline mode. If deployment settings are overridden, configure `MODEL_PATH`, `TEXT_EMB_PATH`, `KEYWORDS_PATH`, and `CLIP_PROCESSOR_PATH` to valid container paths.

## Connect the Backend

Set the backend `AI_SERVICE_URL` to the Space base URL. The backend should send image uploads to `POST /extract-vibes` using the multipart field `file`. The endpoint returns a `top_keywords` array containing keyword strings and similarity scores.
