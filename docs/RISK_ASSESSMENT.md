# Risk Assessment — AI Feedback Analytics Platform
## SLIIT Final Year Project — PP2 Documentation

---

## 1. Technical Risks

### 1.1 Model Bias and Accuracy Risk
**Risk Level:** HIGH  
**Description:** The trained Logistic Regression model may exhibit bias toward sentiments that were over-represented in the training dataset. The confusion matrix shows the model confuses "confusion" with "neutral" and "love" with "happiness", indicating class boundary issues.

**Evidence from Confusion Matrix:**
- Anger ↔ Neutral confusion: 366 misclassifications
- Happiness ↔ Love confusion: 641 misclassifications
- Shame class: Only 255/839 correctly classified (~30%)

**Mitigations:**
- Confidence thresholding: responses below 60% confidence are treated as "neutral"
- Fallback response templates ensure no user receives a null response
- Regular model retraining schedule with balanced class weighting
- Display confidence scores in UI so users understand uncertainty
- Future: SMOTE oversampling for minority classes

---

### 1.2 Topic Modeling Drift
**Risk Level:** MEDIUM  
**Description:** Static topic seeds may not capture newly emerging feedback themes as the product/service evolves.

**Mitigations:**
- Weekly automated topic re-extraction from the full feedback corpus
- Trend monitoring (rising/stable/falling) to detect sudden topic shifts
- Admin alerting when a new keyword cluster forms outside existing topics
- Future: Online LDA with incremental updates

---

### 1.3 Multilingual Text Processing Limitations
**Risk Level:** MEDIUM  
**Description:** The sentiment model was trained predominantly on English text. Sinhala (SI) and Tamil (TA) feedback may produce inaccurate sentiment scores as TF-IDF does not transfer across scripts.

**Mitigations:**
- Language detection flags non-English inputs in the database
- Confidence scores are visually displayed; low-confidence multilingual predictions are clearly marked
- Future: Integrate mBERT or IndicBERT for native SI/TA support
- Translation layer (Google Translate API) planned for v2

---

### 1.4 Model Serving Latency Under Load
**Risk Level:** LOW-MEDIUM  
**Description:** Under high concurrency, joblib model loading and TF-IDF transformation can create bottlenecks.

**Mitigations:**
- Singleton service pattern: models loaded once at startup, cached in memory
- FastAPI async request handling with Uvicorn workers
- Backend configured with 2 Uvicorn workers in Docker
- Future: Redis caching for frequent identical texts

---

## 2. Security Risks

### 2.1 JWT Token Compromise
**Risk Level:** MEDIUM  
**Description:** If access tokens are stolen (e.g., XSS attack on frontend), an attacker can impersonate a user.

**Mitigations:**
- Short access token TTL (30 minutes)
- Refresh token rotation: each use issues a new refresh token
- Tokens stored in memory/localStorage (not cookies, to prevent CSRF)
- HTTPS enforced in production via nginx TLS termination
- Content Security Policy headers in nginx config
- Future: Token blacklisting with Redis on logout

---

### 2.2 SQL Injection
**Risk Level:** LOW  
**Description:** Malicious SQL in user inputs could compromise the database.

**Mitigations:**
- SQLAlchemy ORM with parameterized queries — no raw SQL construction from user input
- Pydantic input validation with strict type enforcement
- All string fields have max_length constraints

---

### 2.3 Sensitive Data Exposure
**Risk Level:** MEDIUM  
**Description:** User feedback may contain PII (names, addresses, account numbers).

**Mitigations:**
- No PII fields collected beyond email and username
- Feedback text is stored as-is but never logged to log files
- Database encrypted at rest in production (PostgreSQL + disk encryption)
- Role-based access: regular users can only see their own feedback

---

### 2.4 API Rate Abuse
**Risk Level:** LOW-MEDIUM  
**Description:** Automated scripts could spam the /feedback/submit endpoint, consuming GPU/CPU resources.

**Mitigations:**
- Nginx rate limiting (60 req/min per IP)
- JWT authentication required for all analysis endpoints
- Input validation rejects texts under 5 characters
- Future: Redis-based per-user rate limiting

---

## 3. Data Risks

### 3.1 Training Data Privacy
**Risk Level:** LOW  
**Description:** Training data used from public datasets (emotions/sentiment corpora). No personal data was used in training.

**Mitigations:**
- Training data sourced from Kaggle/UCI public repositories
- Data lineage documented in model training scripts
- GDPR compliance: no real user data used in model training

---

### 3.2 Model File Corruption / Loss
**Risk Level:** LOW  
**Description:** The `sentiment_model.pkl` and `vectorizer.pkl` files are critical single points of failure.

**Mitigations:**
- Model files checksummed (MD5) and stored in version control (Git LFS)
- Docker volume mount is read-only (`ai_models:/app/ai_models:ro`)
- Fallback rule-based service activates if model files fail to load
- Automated backup of model files in CI/CD pipeline

---

## 4. Operational Risks

### 4.1 Database Single Point of Failure
**Risk Level:** MEDIUM (Development) / MITIGATED (Production)  
**Description:** Single PostgreSQL instance without replication.

**Mitigations (Production):**
- PostgreSQL streaming replication to standby node
- Daily automated pg_dump backups to object storage
- Docker health checks with automatic container restart

---

### 4.2 Dependency Vulnerabilities
**Risk Level:** LOW-MEDIUM  
**Description:** Python/Node packages may have CVEs.

**Mitigations:**
- `pip audit` and `npm audit` run in CI/CD
- Pinned dependency versions in requirements.txt and package.json
- Docker base images updated monthly
- Dependabot alerts enabled on GitHub

---

## 5. Risk Matrix Summary

| Risk | Likelihood | Impact | Risk Score | Status |
|------|-----------|--------|-----------|--------|
| Model bias (class imbalance) | High | High | 🔴 Critical | Mitigated |
| JWT token theft | Low | High | 🟡 Medium | Mitigated |
| Multilingual accuracy | High | Medium | 🟡 Medium | Partial |
| SQL injection | Very Low | Critical | 🟡 Medium | Mitigated |
| Topic model drift | Medium | Medium | 🟡 Medium | Mitigated |
| Data leakage (PII) | Low | High | 🟡 Medium | Mitigated |
| Serving latency | Low | Medium | 🟢 Low | Mitigated |
| DB corruption | Very Low | Critical | 🟢 Low | Mitigated |
| Dependency CVE | Medium | Low | 🟢 Low | Monitored |

---

## 6. Standards & Best Practices Applied

| Area | Standard/Practice |
|------|-------------------|
| API Design | RESTful (RFC 7231), OpenAPI 3.0 |
| Authentication | OAuth2 Bearer tokens, JWT (RFC 7519) |
| Password Security | bcrypt (OWASP recommendation) |
| Input Validation | Pydantic v2 strict validation |
| Error Handling | HTTP status codes (RFC 7231) |
| Logging | Structured logging with rotation |
| Code Quality | PEP 8 (Python), ESLint (JavaScript) |
| Containerization | Docker best practices (non-root, healthchecks) |
| Database | ACID-compliant PostgreSQL, parameterized queries |
| Frontend Security | CSP headers, no eval(), dependency auditing |

---

*Prepared for SLIIT PP2 submission — AI-Based Multilingual Feedback Analytics Platform*
