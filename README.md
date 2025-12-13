# Blissful Tour - Aqlli Sayohat Optimallashtirish Platformasi

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

## Muallif

Blissful Tour Development Team
