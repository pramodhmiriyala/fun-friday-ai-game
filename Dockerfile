# syntax=docker/dockerfile:1
# ══════════════════════════════════════════════════════════════════
# Multi-stage Dockerfile: Fun Friday AI Game Arena
# Serves both Angular 19 frontend and Flask backend from ONE container.
# ══════════════════════════════════════════════════════════════════

# ----- Stage 1: Build Angular Frontend -----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --quiet

COPY frontend/ ./
RUN npm run build -- --configuration production

# ----- Stage 2: Python Backend & Final Image -----
FROM python:3.12-slim AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000 \
    STATIC_DIR=/app/static

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/ ./

# Copy built frontend from Stage 1 directly to static folder
COPY --from=frontend-builder /app/frontend/dist/frontend/browser /app/static

EXPOSE 5000

# Run with production Gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "8", "--timeout", "60", "app:app"]
