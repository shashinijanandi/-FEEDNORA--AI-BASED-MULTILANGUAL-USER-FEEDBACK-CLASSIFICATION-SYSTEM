from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load trained model and vectorizer
try:
    model = joblib.load('data/sentiment_model.pkl')
    vectorizer = joblib.load('data/vectorizer.pkl')
    print("✓ Model and vectorizer loaded successfully!")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    model = None
    vectorizer = None

# Response templates
responses = {
    "happiness": "✨ Thank you! We're delighted you loved our service. Your satisfaction is our success!",
    "sadness": "💙 We understand your concern. Our team is here to help and support you.",
    "anger": "🙏 We sincerely apologize. We take your feedback seriously and will improve.",
    "disgust": "🛠️ We're sorry for the inconvenience. We'll work on fixing this issue.",
    "fear": "🔒 Thank you for sharing your concern. We'll investigate and ensure your safety.",
    "surprise": "👍 Thanks for your feedback! We appreciate your input."
}

@app.route('/')
def home():
    return '''
    <h1>Feedback Sentiment Analysis API</h1>
    <p>Server is running!</p>
    <p>POST /predict to analyze feedback</p>
    '''

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None or vectorizer is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        feedback = data.get('feedback', '')
        
        if not feedback:
            return jsonify({'error': 'No feedback provided'}), 400
        
        # Vectorize and predict
        vec = vectorizer.transform([feedback])
        sentiment = model.predict(vec)[0]
        confidence = float(max(model.predict_proba(vec)[0]))
        
        response = responses.get(sentiment, "Thank you for your feedback!")
        
        return jsonify({
            'sentiment': sentiment,
            'response': response,
            'confidence': confidence,
            'feedback': feedback
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'vectorizer_loaded': vectorizer is not None
    })

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Feedback Sentiment Analysis API Server")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("Frontend available at: frontend/index.html")
    print("=" * 50)
    app.run(debug=True, port=5000)
