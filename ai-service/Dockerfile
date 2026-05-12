# ─── Base ─────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

WORKDIR /app

# Install dependencies into the image layer so they are cached
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt


# ─── Stage: development ──────────────────────────────────────────────────────
# Runs Flask's built-in server with debug/reload. Source mounted via volume.
FROM base AS development

ENV FLASK_APP=app.py
ENV FLASK_ENV=development

# app.py is mounted at runtime via docker-compose volume
EXPOSE 8000

CMD ["flask", "run", "--host=0.0.0.0", "--port=8000", "--debug"]


# ─── Stage: production ───────────────────────────────────────────────────────
# Runs gunicorn — multi-worker WSGI server, no debugger.
FROM base AS production

# Install gunicorn on top of base dependencies
RUN pip install --no-cache-dir gunicorn==21.2.0

COPY app.py ./

# Drop root privileges
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--threads", "4", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "app:app"]
