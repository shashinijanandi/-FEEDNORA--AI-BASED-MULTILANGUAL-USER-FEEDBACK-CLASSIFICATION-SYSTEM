# 🚀 FeedbackAI — Dynamic Topic Modeling & Intelligent Customer Feedback Response Generation

> **Final Year Research Project — SLIIT**
> Enterprise-grade AI Customer Intelligence Platform for E-Commerce

---

## 🧠 System Overview

This platform demonstrates a complete AI-powered feedback processing pipeline for e-commerce companies, combining:

1. **Dynamic Topic Modeling** (LDA-based) — Discovers and tracks evolving topics in customer feedback
2. **Sentiment Classification** (Logistic Regression + TF-IDF) — Classifies feedback sentiment with confidence scores
3. **Intelligent Response Generation** (T5-Base transformer) — Generates context-aware, personalized responses
4. **Quantitative Evaluation** — BLEU, ROUGE-L, and Semantic Similarity scoring

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              React 18 + Vite + Tailwind CSS                  │
│  Dashboard | Submit | Topics | Responses | Eval | Analytics  │
└─────────────────────────┬────────────────────────────────────┘
                          │ (Static SPA / or API calls)
┌─────────────────────────▼────────────────────────────────────┐
│              FastAPI Backend (connect separately)            │
│  ┌──────────────────┐  ┌───────────────────────────────────┐ │
│  │ Dynamic LDA v2.2 │  │ T5-Base Response Generator        │ │
│  │ Topic Modeling   │  │ Context-conditioned beam search   │ │
│  └──────────────────┘  └───────────────────────────────────┘ │
│  ┌──────────────────┐                                        │
│  │ LR Classifier    │  Sentiment: Positive/Neutral/Negative │
│  │ TF-IDF Features  │                                        │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
feedback-ai-platform/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx         ← KPI cards + all overview charts
│   │   ├── SubmitFeedback.jsx    ← Animated AI pipeline + results
│   │   ├── TopicModeling.jsx     ← Word clouds + time evolution
│   │   ├── ResponseGeneration.jsx ← Approval queue + responses
│   │   ├── EvaluationMetrics.jsx ← Research comparison tables + charts
│   │   ├── Analytics.jsx         ← Multilingual + category trends
│   │   └── Settings.jsx          ← Model config + system health
│   ├── components/
│   │   ├── Layout.jsx            ← Sidebar + header shell
│   │   └── UI.jsx                ← Shared UI primitives
│   ├── data/
│   │   └── mockData.js           ← Rich mock data (replace with API)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── vite.config.js
├── Dockerfile
└── nginx.conf
```

---

## 🚀 Quick Start

### Option A — Development (Local)

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### Option B — Production Build

```bash
npm install
npm run build
npm run preview
# Opens at http://localhost:4173
```

### Option C — Docker

```bash
docker build -t feedback-ai .
docker run -p 3000:3000 feedback-ai
# Opens at http://localhost:3000
```

---

## 📊 Pages & Features

| Page | Description |
|------|-------------|
| **Dashboard** | 6 KPI cards, topic evolution chart, sentiment pie, topic distribution, weekly complaint trend, recent feedback table |
| **Submit Feedback** | Animated 5-step AI pipeline, sentiment detection ring, topic probability chart, word cloud, generated response, collapsible evaluation |
| **Topic Modeling** | 5 discovered topics, word cloud, keyword weight table, temporal evolution chart, all-topics comparison |
| **Response Generation** | Feedback approval queue, topic + sentiment predictions, AI response with edit/approve/copy, evaluation metrics |
| **Evaluation Metrics** | Baseline vs Proposed comparison table, radar chart, confusion matrix heatmap, training curves, BLEU progression |
| **Analytics** | Language distribution (EN/SI/TA), category trends, response time analysis, model health status |
| **Settings** | LDA config, T5 config, LR classifier config, project metadata, system health |

---

## 🤖 AI Research Components

### Component 1 — Dynamic Topic Modeling
- **Algorithm**: LDA (Latent Dirichlet Allocation) with weekly re-training
- **Topics**: 5 auto-discovered (Delivery, Product Quality, Payment, Customer Support, Returns)
- **Evaluation**: Coherence Score = 0.621
- **Key Feature**: Temporal drift tracking — proves topics are *dynamic*, not static

### Component 2 — Intelligent Response Generation
- **Generator**: T5-Base (220M params) fine-tuned on 18,500 feedback-response pairs
- **Context Input**: Sentiment + Topic + Top Keywords
- **Decoding**: Beam search (beam=4) with length penalty
- **BLEU Score**: 0.743 (vs baseline 0.524)

### Sentiment Classifier
- **Model**: Logistic Regression with TF-IDF features
- **Accuracy**: 89.7% (test set)
- **F1 Score**: 0.880 (macro)
- **Classes**: Positive / Neutral / Negative

---

## 🔗 Connecting to Backend API

The UI currently uses mock data from `src/data/mockData.js`.

To connect to the FastAPI backend:

1. Create `src/api/client.js`:
```js
import axios from 'axios'
const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' })
export default api
```

2. Replace mock data calls in each page with API calls:
```js
const { data } = await api.post('/feedback/analyze', { text, category })
```

---

## 🎨 Design System

- **Color Palette**: Deep navy surface + brand blue + cyan accent
- **Typography**: Syne (display headings) + DM Sans (body)
- **Theme**: Dark enterprise — suitable for defense/presentation
- **Charts**: Recharts with custom tooltips and dark theme styling

---

## 👤 Author

**SLIIT Final Year Research Project**
*Dynamic Topic Modeling and Intelligent Customer Feedback Response Generation for E-Commerce Platforms*
