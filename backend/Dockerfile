# ── Backend Dockerfile ──────────────────────────────────────────────
# Uses python:3.11-slim for a small image (~150 MB)
FROM python:3.11-slim

# set working directory
WORKDIR /app

# install OS-level deps needed by psycopg2-binary
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# install python deps first (layer-cached unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy application source
COPY . .

# expose the API port
EXPOSE 8000

# run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
