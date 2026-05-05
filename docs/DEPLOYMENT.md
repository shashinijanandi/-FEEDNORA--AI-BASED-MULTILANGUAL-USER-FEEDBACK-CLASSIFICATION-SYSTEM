# Deployment Guide — AI Feedback Analytics Platform

## Local Development (No Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows
pip install -r requirements.txt
cp .env.example .env          # edit .env: set DATABASE_URL to local postgres
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local
npm run dev                   # http://localhost:3000
```

---

## Docker Compose (Recommended)

### Prerequisites
- Docker Desktop (or Docker Engine + Compose)
- Your trained model files

### Steps
```bash
# 1. Copy models
python copy_models.py

# 2. Configure env
cp backend/.env.example backend/.env
nano backend/.env   # Change SECRET_KEY!

# 3. Start all services
docker-compose up --build -d

# 4. Watch logs
docker-compose logs -f backend

# 5. Stop
docker-compose down
```

### With pgAdmin (dev)
```bash
docker-compose --profile dev up -d
# pgAdmin at http://localhost:5050
# Email: admin@example.com  Password: admin
```

---

## Production Hardening Checklist

### Security
- [ ] Change `SECRET_KEY` to a random 64-char string
- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Set `DEBUG=false` in backend .env
- [ ] Set `ENVIRONMENT=production`
- [ ] Enable HTTPS via Let's Encrypt + nginx certbot
- [ ] Set `ALLOWED_ORIGINS` to your actual domain only

### Performance
- [ ] Increase Uvicorn workers: `--workers 4` (or `2 * CPU_cores + 1`)
- [ ] Set `pool_size=20, max_overflow=40` in database.py for high traffic
- [ ] Enable nginx gzip compression (already in nginx.conf)
- [ ] Add CDN for static frontend assets

### Database
- [ ] Run `pg_dump` backup script daily via cron
- [ ] Set up PostgreSQL streaming replication
- [ ] Enable connection pooling (PgBouncer)

### Monitoring
```bash
# View backend logs
docker-compose logs -f backend

# Check health
curl http://localhost:8000/health

# Database queries
docker exec -it feedback_db psql -U postgres -d feedback_analytics
```

---

## Admin User Setup

After first deployment, create an admin user via the database:

```sql
-- Connect to postgres:
docker exec -it feedback_db psql -U postgres -d feedback_analytics

-- Promote first user to admin:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or via API (if you know the user ID):
```bash
curl -X PUT http://localhost:8000/api/v1/users/1/role?role=admin \
  -H "Authorization: Bearer <admin_token>"
```

---

## CI/CD (GitHub Actions example)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest tests/ -v
      - name: Build & push Docker images
        run: docker-compose build
      - name: Deploy to server
        run: docker-compose up -d --no-deps --build
```
