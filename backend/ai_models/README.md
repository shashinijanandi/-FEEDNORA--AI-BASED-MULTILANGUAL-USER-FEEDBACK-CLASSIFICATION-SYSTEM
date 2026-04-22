# AI Models Directory

Place your trained model files here:

- `sentiment_model.pkl`  — Sklearn Logistic Regression classifier
- `vectorizer.pkl`       — TF-IDF vectorizer fitted on training corpus

If these files are not present, the system falls back to a rule-based
keyword matching classifier that still works for demonstration purposes.

## Training your own models

```python
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib

# Train
vectorizer = TfidfVectorizer(max_features=10000, ngram_range=(1,2))
X = vectorizer.fit_transform(train_texts)
model = LogisticRegression(max_iter=1000, multi_class='multinomial')
model.fit(X, train_labels)  # labels: 'positive', 'neutral', 'negative'

# Save
joblib.dump(model, 'ai_models/sentiment_model.pkl')
joblib.dump(vectorizer, 'ai_models/vectorizer.pkl')
```
