FROM python:3.11-alpine

WORKDIR /app

COPY api.py .

RUN pip install flask flask-cors mysql-connector-python && apk add --no-cache curl

CMD ["python", "api.py"]
