# CI/CD with GitHub Actions - Qo'llanma

Bu qo'llanma Blissful Tour loyihasi uchun GitHub Actions bilan CI/CD pipeline ni sozlash va ishlatish bo'yicha to'liq yo'riqnoma.

## CI/CD Pipeline Arxitekturasi

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Push/PR                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CI Pipeline (Automatic)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Backend    │  │   Frontend   │  │   Security   │     │
│  │    Tests     │  │    Build     │  │     Scan     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (Only on main branch)
┌─────────────────────────────────────────────────────────────┐
│            CD Pipeline (Deploy to Production)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Build & Push│  │   Deploy to  │  │    Health    │     │
│  │ Docker Images│  │    Server    │  │    Check     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Workflow Fayllar

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Qachon ishga tushadi:**
- Pull request ochilganda
- `main` yoki `develop` branchga push qilinganda

**Nima qiladi:**
1. **Backend Tests** - PostgreSQL va Redis bilan Django testlarni bajaradi
2. **Frontend Build** - React applicationni build qiladi
3. **Docker Build Test** - Docker imagelerni test build qiladi
4. **Security Scan** - Trivy bilan vulnerability scan qiladi

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Qachon ishga tushadi:**
- `main` branchga push qilinganda
- Manual trigger orqali

**Nima qiladi:**
1. **Build & Push** - Docker imagelerni Docker Hub ga push qiladi
2. **Deploy** - SSH orqali serverga ulanib yangi versiyani deploy qiladi
3. **Health Check** - Deploy muvaffaqiyatli ekanligini tekshiradi
4. **Notify** - Natijani xabar qiladi

## Sozlash (Setup)

### 1-qadam: Docker Hub Account

1. [Docker Hub](https://hub.docker.com/) ga ro'yxatdan o'ting
2. Access Token yarating:
   - Account Settings → Security → New Access Token
   - Token nomini kiriting (masalan: `github-actions`)
   - Read, Write, Delete ruxsatlarini bering
   - Token ni nusxalab oling (faqat bir marta ko'rsatiladi!)

### 2-qadam: Server SSH Key

SSH key yarating yoki mavjudini ishlating:

```bash
# Yangi SSH key yaratish (local kompyuterda)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Public keyni serverga qo'shish
ssh-copy-id -i ~/.ssh/github_actions_key.pub user@server-ip

# Private keyni o'qish (GitHub Secrets uchun kerak)
cat ~/.ssh/github_actions_key
```

### 3-qadam: GitHub Secrets Sozlash

GitHub repository Settings → Secrets and variables → Actions ga o'ting va quyidagi secretlarni qo'shing:

#### Majburiy Secrets

| Secret Nomi | Tavsif | Misol |
|------------|--------|-------|
| `DOCKER_USERNAME` | Docker Hub username | `your_username` |
| `DOCKER_PASSWORD` | Docker Hub access token | `dckr_pat_xxxxx` |
| `SERVER_HOST` | Server IP manzili yoki domain | `123.45.67.89` |
| `SERVER_USERNAME` | SSH username | `ubuntu` |
| `SERVER_SSH_KEY` | SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH port (default: 22) | `22` |
| `SERVER_PROJECT_PATH` | Server dagi project papkasi | `/home/ubuntu/blissful-tour` |
| `SERVER_URL` | Production URL | `https://your-domain.com` |

#### Qo'shimcha Secrets (Server .env uchun)

Bu secretlar serverda `.env` faylini yaratish uchun ishlatiladi:

| Secret Nomi | Tavsif |
|------------|--------|
| `SECRET_KEY` | Django secret key |
| `POSTGRES_PASSWORD` | Database parol |
| `TRAVELPAYOUTS_TOKEN` | Travelpayouts API token |
| `RAPIDAPI_KEY` | RapidAPI key |
| `GEMINI_API_KEY` | Google Gemini API key |

### 4-qadam: Serverni Tayyorlash

```bash
# Serverga SSH orqali ulanish
ssh user@server-ip

# Docker va Docker Compose o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
sudo usermod -aG docker $USER

# Loyiha papkasini yaratish
mkdir -p ~/blissful-tour
cd ~/blissful-tour

# Git repository ni clone qilish
git clone https://github.com/your-username/blissful-tour.git .

# .env faylini yaratish
nano .env
```

`.env` faylida quyidagilar bo'lishi kerak:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
POSTGRES_DB=blissful_tour
POSTGRES_USER=blissful
POSTGRES_PASSWORD=your-secure-password

# Docker Hub
DOCKER_USERNAME=your-dockerhub-username

# API Keys
TRAVELPAYOUTS_TOKEN=your-token
RAPIDAPI_KEY=your-key
GEMINI_API_KEY=your-key
```

### 5-qadam: Birinchi Deploy (Manual)

```bash
# Serverda
cd ~/blissful-tour

# Docker Hub dan imagelerni pull qilish
docker-compose -f docker-compose.hub.yml pull

# Containerlarni ishga tushirish
docker-compose -f docker-compose.hub.yml up -d

# Migratsiyalar
docker-compose -f docker-compose.hub.yml exec backend python manage.py migrate

# Superuser yaratish
docker-compose -f docker-compose.hub.yml exec backend python manage.py createsuperuser

# Static fayllar
docker-compose -f docker-compose.hub.yml exec backend python manage.py collectstatic --noinput
```

## Ishlatish (Usage)

### Avtomatik Deployment

1. **Development** branchda ishlash:
```bash
git checkout develop
# ... o'zgarishlar ...
git add .
git commit -m "New feature"
git push origin develop
```
→ CI pipeline ishga tushadi (test, build)

2. **Production** ga chiqarish:
```bash
git checkout main
git merge develop
git push origin main
```
→ CI + CD pipelinelari ishga tushadi (test, build, deploy)

### Manual Deployment

GitHub repository → Actions → Deploy to Production → Run workflow

### Pull Request Workflow

1. Feature branch yaratish:
```bash
git checkout -b feature/new-feature
# ... o'zgarishlar ...
git push origin feature/new-feature
```

2. GitHub da Pull Request ochish
3. CI pipeline avtomatik ishga tushadi
4. Barcha testlar o'tsa, merge qilish mumkin

## Monitoring va Loglar

### GitHub Actions Loglarini Ko'rish

1. Repository → Actions
2. Workflow run ni tanlash
3. Job va steplarni ko'rish

### Server Loglarini Ko'rish

```bash
# SSH orqali serverga ulanish
ssh user@server-ip

# Loyiha papkasiga o'tish
cd ~/blissful-tour

# Container loglarini ko'rish
docker-compose -f docker-compose.hub.yml logs -f

# Faqat backend
docker-compose -f docker-compose.hub.yml logs -f backend

# Oxirgi 100 ta log
docker-compose -f docker-compose.hub.yml logs --tail=100 backend
```

## Muammolarni Hal Qilish

### Deploy Failed

**Sabab:** SSH connection xatosi
```bash
# SSH keyni tekshirish
ssh -i ~/.ssh/github_actions_key user@server-ip

# SSH keyni GitHub Secretsga to'g'ri qo'shilganligini tekshiring
```

**Sabab:** Docker pull failed
```bash
# Docker Hub login
docker login
docker pull your-username/blissful-tour-backend:latest
```

**Sabab:** Migration failed
```bash
# Database holatini tekshirish
docker-compose -f docker-compose.hub.yml exec backend python manage.py showmigrations
```

### CI Tests Failed

**Backend tests:**
```bash
# Local da testni ishlatish
cd backend
python manage.py test

# Ma'lum bir testni ishlatish
python manage.py test apps.search.tests
```

**Frontend build failed:**
```bash
# Local da build qilish
cd frontend
npm install
npm run build
```

### Docker Build Failed

```bash
# Local da Docker build qilish
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend

# Loglarni ko'rish
docker logs <container-id>
```

## Xavfsizlik

### GitHub Secrets Best Practices

1. ✅ Hech qachon secretlarni commit qilmang
2. ✅ `.env` faylini `.gitignore` ga qo'shing
3. ✅ SSH keylarni xavfsiz saqlang
4. ✅ Docker Hub tokenlarni muntazam ravishda almashtiring
5. ✅ Database parollarini kuchli qiling

### SSH Xavfsizligi

```bash
# SSH port ni o'zgartirish (default 22 o'rniga)
sudo nano /etc/ssh/sshd_config
# Port 2222 ga o'zgartiring

# SSH restart
sudo systemctl restart sshd

# GitHub Secretda SERVER_PORT ni yangilang
```

### Docker Hub Private Repository

Agar projectingiz private bo'lsa:

1. Docker Hub da repository ni private qiling
2. GitHub Secrets da DOCKER_USERNAME va DOCKER_PASSWORD ni to'g'ri sozlang

## Qo'shimcha Workflow Features

### Rollback Mechanism

Agar yangi versiya ishlamasa, eski versiyaga qaytish:

```bash
# Serverda
cd ~/blissful-tour

# Eski versiya tagini ko'rish
git log --oneline -n 5

# Ma'lum bir versiyaga qaytish
git checkout <commit-hash>

# Containerlarni qayta ishga tushirish
docker-compose -f docker-compose.hub.yml down
docker-compose -f docker-compose.hub.yml up -d
```

### Staging Environment

Staging muhit uchun alohida workflow yaratish mumkin:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [ develop ]
```

### Scheduled Backups

Database backup workflow:

```yaml
# .github/workflows/backup.yml
on:
  schedule:
    - cron: '0 2 * * *'  # Har kuni soat 2 da
```

## Yangilashlar (Updates)

### Workflow ni Yangilash

```bash
git pull origin main
# .github/workflows/ fayllarini tahrirlash
git add .github/workflows/
git commit -m "Update CI/CD workflows"
git push origin main
```

### Dependencies ni Yangilash

Backend:
```bash
cd backend
pip list --outdated
pip install --upgrade <package>
pip freeze > requirements.txt
```

Frontend:
```bash
cd frontend
npm outdated
npm update
```

## Resurslar

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)

---

**CI/CD pipeline tayyor!** Endi har bir push avtomatik ravishda test qilinadi va main branchga push production ga deploy qiladi. 🚀
