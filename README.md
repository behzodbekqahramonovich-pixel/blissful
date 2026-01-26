# Blissful Tour - Aqlli Sayohat Optimallashtirish Platformasi

[![CI Status](https://github.com/your-username/blissful-tour/workflows/CI%20-%20Test%20and%20Build/badge.svg)](https://github.com/your-username/blissful-tour/actions)
[![CD Status](https://github.com/your-username/blissful-tour/workflows/CD%20-%20Deploy%20to%20Production/badge.svg)](https://github.com/your-username/blissful-tour/actions)

Sayohatchilar uchun eng arzon va qulay yo'nalishlarni topuvchi platforma.

## Loyiha strukturasi

```
blissful-tour/
├── backend/                # Django REST API
│   ├── config/            # Django sozlamalari
│   ├── apps/
│   │   ├── destinations/  # Mamlakatlar, Shaharlar
│   │   ├── pricing/       # Parvoz va Mehmonxona narxlari
│   │   └── search/        # Qidiruv va Yo'nalish variantlari
│   ├── services/          # Route Finder algoritmi
│   └── fixtures/          # Boshlang'ich ma'lumotlar
│
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/    # React komponentlar
│   │   ├── pages/         # Sahifalar
│   │   ├── services/      # API calls
│   │   ├── store/         # Zustand state
│   │   └── hooks/         # Custom hooks
│   └── public/
│
└── docker-compose.yml     # Docker sozlamalari
```

## Ishga tushirish

### Backend (Django)

```bash
cd backend

# Virtual muhit yaratish
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Paketlarni o'rnatish
pip install -r requirements.txt

# Migratsiya
python manage.py migrate

# Boshlang'ich ma'lumotlarni yuklash
python manage.py loaddata fixtures/initial_data.json

# Serverni ishga tushirish
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend

# Paketlarni o'rnatish
npm install

# Development serverni ishga tushirish
npm run dev
```

### Docker bilan ishga tushirish

```bash
docker-compose up -d
```

## API Endpoints

### Destinations
- `GET /api/v1/destinations/cities/` - Shaharlar ro'yxati
- `GET /api/v1/destinations/cities/autocomplete/?q=` - Autocomplete
- `GET /api/v1/destinations/cities/hubs/` - Tranzit hub shaharlar
- `GET /api/v1/destinations/countries/` - Mamlakatlar

### Search
- `POST /api/v1/search/` - Yangi qidiruv
- `GET /api/v1/search/{id}/variants/` - Qidiruv variantlari
- `GET /api/v1/search/popular/` - Mashhur yo'nalishlar

### Prices
- `GET /api/v1/prices/flights/search/` - Parvoz narxlari
- `GET /api/v1/prices/hotels/search/` - Mehmonxona narxlari

## Texnologiyalar

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL / SQLite
- Redis + Celery

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Query
- Zustand
- React Leaflet

## CI/CD Pipeline

Loyiha GitHub Actions bilan avtomatik test va deploy qilinadi:

- **Continuous Integration (CI)**: Har bir pull request va push avtomatik test qilinadi
- **Continuous Deployment (CD)**: Main branchga push production serverga avtomatik deploy qilinadi

Batafsil ma'lumot uchun [CI-CD.md](CI-CD.md) faylini o'qing.

## Deployment

### Local Development

```bash
docker-compose up -d
```

### Production Deployment

```bash
# Manual deployment
docker-compose -f docker-compose.prod.yml up -d

# Docker Hub dan (CI/CD orqali)
docker-compose -f docker-compose.hub.yml up -d
```

Batafsil qo'llanma: [DEPLOYMENT.md](DEPLOYMENT.md)

## Hujjatlar

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment qo'llanmasi
- [CI-CD.md](CI-CD.md) - GitHub Actions CI/CD sozlash va ishlatish
- [FULL_TEST_REPORT.md](FULL_TEST_REPORT.md) - To'liq test hisoboti

## Muallif

Blissful Tour Development Team
