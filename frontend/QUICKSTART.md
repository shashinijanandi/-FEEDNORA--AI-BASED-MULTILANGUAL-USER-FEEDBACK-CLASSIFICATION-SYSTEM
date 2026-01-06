# 🚀 QUICK START GUIDE - Frontend Setup

## What You Need

Your model must be trained first. Check if these files exist:
- `data/sentiment_model.pkl` ✓ (trained model)
- `data/vectorizer.pkl` ✓ (TF-IDF vectorizer)

---

## Setup Steps

### Step 1: Install Dependencies
```bash
cd frontend
# Create a virtual environment (recommended)
python -m venv venv

# --- Windows PowerShell ---
# If running PowerShell you may need to allow script execution for this session:
# Run once in PowerShell as needed:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
# Then activate:
venv\Scripts\Activate.ps1

# --- Windows Command Prompt ---
venv\Scripts\activate.bat

# --- macOS / Linux ---
# source venv/bin/activate

# Install packages using python -m pip (works even if pip isn't on PATH)
python -m pip install -r requirements.txt
```

### Step 2: Start the Backend Server
```bash
python api.py
```

**Expected Output:**
```
🚀 Feedback Sentiment Analysis API Server
==================================================
Starting server on http://localhost:5000
Frontend available at: frontend/index.html
==================================================
 * Running on http://127.0.0.1:5000
```

### Step 3: Open Frontend in Browser
Open `frontend/index.html` in your browser

**Or use Python's built-in server (another terminal):**
```bash
cd frontend
python -m http.server 8000
```
Then visit: `http://localhost:8000/index.html`

---

## Test Your Model

Try entering these sample feedbacks:

✅ **Positive (Happiness):**
- "This is amazing! Love it!"
- "Best purchase ever"

😢 **Negative (Sadness):**
- "I'm very disappointed with this"
- "Not what I expected"

😠 **Angry (Anger):**
- "This is terrible and broken"
- "Worst experience ever"

😨 **Concerned (Fear):**
- "I'm worried about the quality"
- "Is this safe to use?"

---

## Architecture

```
Frontend (HTML + JavaScript)
    ↓ (HTTP POST)
Backend API (Flask + Python)
    ↓
Trained Model (sentiment_model.pkl)
    ↓
TF-IDF Vectorizer (vectorizer.pkl)
    ↓
Result (Sentiment + Confidence + Response)
```

---

## File Locations

```
feedback-response-project/
├── data/
│   ├── sentiment_model.pkl      ← Trained model
│   └── vectorizer.pkl           ← Vectorizer
├── frontend/                    ← NEW FOLDER
│   ├── index.html              ← Open this in browser
│   ├── api.py                  ← Backend server
│   ├── requirements.txt         ← Dependencies
│   ├── start.bat               ← Windows quick start
│   ├── README.md               ← Full documentation
│   └── QUICKSTART.md           ← This file
├── scripts/
│   └── train_model.py          ← Model training
└── app.py                      ← Streamlit version (optional)
```

---

## Troubleshooting

### "Connection refused" / "Cannot reach server"
→ Make sure `api.py` is running (see Step 2)

### "Model not loaded"
→ Check `data/sentiment_model.pkl` exists
→ Run `python scripts/train_model.py` to train model first

### Port 5000 already in use
→ Edit `api.py` last line: `app.run(debug=True, port=5001)`
→ Edit `index.html` line with fetch URL to match new port

### No results displayed
→ Check browser console (F12) for errors
→ Verify backend is running
→ Check network tab in DevTools

---

## Server Health Check

```bash
# Check if backend is running
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

---

## Next Steps

After testing:
1. ✅ Verify predictions are accurate
2. ✅ Check sentiment classifications match expectations
3. ✅ Review confidence scores
4. ✅ Customize responses in `api.py` if needed

**Customize responses:**
Edit the `responses` dictionary in `api.py`:
```python
responses = {
    "happiness": "Your custom message here",
    "sadness": "Your custom message here",
    # ... etc
}
```

---

## Need Help?

Check error messages in:
1. Browser console (F12 → Console tab)
2. Terminal running `api.py`
3. `README.md` in frontend folder

---

**You're all set! 🎉**
