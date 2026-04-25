FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN rm -f prod.db

EXPOSE 5000

ENV FLASK_APP=run.py

CMD ["sh", "-c", "flask db upgrade && gunicorn run:app --bind 0.0.0.0:5000"]
