FROM python:3.11-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY api.py .

RUN pip install flask flask-cors mysql-connector-python

CMD ["python", "api.py"]
