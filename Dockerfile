# Purrbo Backend — FastAPI (chỉ đóng gói api/ domain/ adapters/, không có app RN)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Cài deps trước (tận dụng cache layer)
COPY api/requirements.txt api/requirements.txt
RUN pip install -r api/requirements.txt

# Copy 3 tầng backend (hexagonal)
COPY api ./api
COPY domain ./domain
COPY adapters ./adapters

EXPOSE 8000
# 2 worker (process riêng) — hợp với pool DB đã tính sẵn cho 2 worker (xem db.py)
# + advisory-lock bootstrap (xem main.py) để 2 process không race lúc khởi động.
CMD ["uvicorn", "api.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
