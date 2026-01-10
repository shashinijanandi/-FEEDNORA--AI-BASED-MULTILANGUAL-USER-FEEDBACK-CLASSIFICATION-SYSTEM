# Frontend - Feedback Sentiment Analysis

A modern web interface to test and interact with your trained sentiment analysis model.

## Features

- ✨ Clean, modern UI with gradient design
- 🎯 Real-time sentiment analysis
- 📊 Confidence score display
- 💬 Personalized auto-generated responses
- 📱 Responsive design
- ⚡ Fast predictions

## Project Structure

```
frontend/
├── index.html          # Web UI (open in browser)
├── api.py             # Flask backend API
├── requirements.txt   # Python dependencies
└── README.md          # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install flask flask-cors joblib
```

### 2. Verify Model Files

Make sure these files exist in the `data/` folder:
- `sentiment_model.pkl` - Trained model
- `vectorizer.pkl` - TF-IDF vectorizer

### 3. Start the Backend API

From the `frontend` folder, run:

```bash
python api.py
```

You should see:
```
🚀 Feedback Sentiment Analysis API Server
==================================================
Starting server on http://localhost:5000
Frontend available at: frontend/index.html
==================================================
```

### 4. Open the Frontend

Open `index.html` in your web browser:
- Double-click `index.html`, or
- Use VS Code Live Server extension, or
- Use Python's built-in server:

```bash
python -m http.server 8000
```

Then visit: `http://localhost:8000/index.html`

## How to Use

1. Enter customer feedback in the text area
2. Click "Analyze Feedback" or press Ctrl+Enter
3. View results:
   - Detected sentiment emotion
   - AI-generated response
   - Confidence percentage

## API Endpoints

### POST /predict
Analyzes feedback and returns sentiment prediction.

**Request:**
```json
{
    "feedback": "This product is amazing!"
}
```

**Response:**
```json
{
    "sentiment": "happiness",
    "response": "✨ Thank you! We're delighted...",
    "confidence": 0.95,
    "feedback": "This product is amazing!"
}
```

### GET /health
Checks server and model status.

**Response:**
```json
{
    "status": "healthy",
    "model_loaded": true,
    "vectorizer_loaded": true
}
```

## Sentiments

The model recognizes 6 sentiment categories:
- 😊 **Happiness** - Positive feedback
- 😢 **Sadness** - Negative/sad feedback
- 😠 **Anger** - Angry/frustrated feedback
- 🤢 **Disgust** - Disgusted feedback
- 😨 **Fear** - Fearful/concerned feedback
- 😲 **Surprise** - Surprised feedback

## Troubleshooting

**Error: "Make sure the backend server is running"**
- Start the API server: `python api.py`
- Ensure port 5000 is available

**Error: "Model not loaded"**
- Check that `data/sentiment_model.pkl` exists
- Check that `data/vectorizer.pkl` exists
- Run the training script first

**Port already in use:**
- Change port in `api.py`: `app.run(debug=True, port=5001)`
- Update frontend to use new port

## Performance Metrics

Check your model performance:

```python
# View accuracy and classification report
python scripts/train_model.py
```

## Advanced Usage

### Custom Port
Edit `api.py` line with `app.run()`:
```python
app.run(debug=True, port=YOUR_PORT)
```

Then update frontend URL in `index.html`:
```javascript
fetch('http://localhost:YOUR_PORT/predict', {
```

### Batch Testing
Use `evaluate_automated.py` to test multiple samples:
```bash
python evaluate_automated.py
```

## Demo Test Cases

Try these feedback samples:

| Feedback | Expected Sentiment |
|----------|-------------------|
| "Love this product!" | Happiness |
| "I'm very disappointed" | Sadness |
| "This is terrible!" | Anger |
| "I'm concerned about safety" | Fear |
| "Unexpected but good!" | Surprise |
| "This is awful" | Disgust |

---

**Happy Testing!** 🚀
