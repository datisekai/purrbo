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

# Thư mục dữ liệu (SQLite persist qua volume)
RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
