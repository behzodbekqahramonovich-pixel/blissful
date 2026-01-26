# Blissful Tour - Production Deployment Qo'llanmasi

Bu qo'llanma Blissful Tour loyihasini production serverga qanday joylashtirish bo'yicha to'liq ko'rsatmalar beradi.

## Talab qilinadigan narsalar

- VPS/Cloud server (Ubuntu 20.04 yoki 22.04 tavsiya etiladi)
- Kamida 2GB RAM
- 20GB disk maydoni
- Domain name (ixtiyoriy, lekin tavsiya etiladi)
- SSH access

## 1-qadam: Serverni tayyorlash

### Serverni yangilash

```bash
sudo apt update && sudo apt upgrade -y
```

### Docker va Docker Compose o'rnatish

```bash
# Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose o'rnatish
sudo apt install docker-compose -y

# Foydalanuvchini docker guruhiga qo'shish
sudo usermod -aG docker $USER

# Tizimni qayta yuklash (yoki foydalanuvchini qayta login qilish)
newgrp docker
```

### Firewall sozlash

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 2-qadam: Loyihani serverga yuklash

### Git orqali

```bash
# Git o'rnatish (agar o'rnatilmagan bo'lsa)
sudo apt install git -y

# Loyihani clone qilish
cd /home/$USER
git clone <repository-url> blissful-tour
cd blissful-tour
```

### Yoki SFTP/SCP orqali upload qilish

```bash
# Lokal kompyuterdan
scp -r blissful-tour user@server-ip:/home/user/
```

## 3-qadam: Environment o'zgaruvchilarini sozlash

```bash
# .env faylini yaratish
cp .env.production .env

# Faylni tahrirlash
nano .env
```

### Majburiy o'zgaruvchilar

1. **SECRET_KEY** - Yangi secret key generatsiya qiling:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

2. **ALLOWED_HOSTS** - Domain yoki IP manzilni kiriting:
```env
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,123.45.67.89
```

3. **POSTGRES_PASSWORD** - Kuchli parol o'rnating:
```env
POSTGRES_PASSWORD=VeryStr0ngP@ssw0rd123!
```

4. **API Keys** - O'z API kalitlaringizni kiriting:
```env
TRAVELPAYOUTS_TOKEN=your_token
RAPIDAPI_KEY=your_key
GEMINI_API_KEY=your_key
```

## 4-qadam: Docker containerlarni ishga tushirish

```bash
# Production rejimida build qilish
docker-compose -f docker-compose.prod.yml build

# Containerlarni ishga tushirish
docker-compose -f docker-compose.prod.yml up -d

# Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs -f
```

## 5-qadam: Database migratsiyalari va sozlamalar

```bash
# Database migratsiyalarni bajarish
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Superuser yaratish (admin panel uchun)
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Static fayllarni yig'ish (agar kerak bo'lsa)
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## 6-qadam: SSL Sertifikat o'rnatish (HTTPS)

### Certbot o'rnatish

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Nginx konfiguratsiyasini o'zgartirish

Avval frontend containerdan nginx konfiguratsiyani host mashinaga ko'chirish kerak:

```bash
# nginx.conf faylini yaratish
sudo nano /etc/nginx/sites-available/blissful-tour
```

Quyidagi konfiguratsiyani qo'shing:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Konfiguratsiyani yoqish:

```bash
sudo ln -s /etc/nginx/sites-available/blissful-tour /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL sertifikat olish

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 7-qadam: Tekshirish

1. **Brauzerda ochish**: http://your-domain.com
2. **Backend API**: http://your-domain.com/api/
3. **Admin panel**: http://your-domain.com/admin/

## Muammolarni hal qilish

### Containerlar ishlamayotgan bo'lsa

```bash
# Container statusini ko'rish
docker-compose -f docker-compose.prod.yml ps

# Loglarni ko'rish
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Containerlarni qayta ishga tushirish
docker-compose -f docker-compose.prod.yml restart
```

### Database xatosi

```bash
# Database containerga kirish
docker-compose -f docker-compose.prod.yml exec db psql -U blissful_user -d blissful_tour

# Database ni tiklash (backup dan)
docker-compose -f docker-compose.prod.yml exec -T db psql -U blissful_user -d blissful_tour < backup.sql
```

### Static fayllar yuklanmayotgan bo'lsa

```bash
# Static fayllarni qayta yig'ish
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput --clear
```

## Yangilashlar (Updates)

```bash
# Yangi versiyani pull qilish
git pull origin main

# Containerlarni qayta build qilish
docker-compose -f docker-compose.prod.yml build

# Containerlarni qayta ishga tushirish
docker-compose -f docker-compose.prod.yml up -d

# Migratsiyalarni bajarish
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## Backup va Restore

### Database backup

```bash
# Backup yaratish
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U blissful_user blissful_tour > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup ni tiklash
docker-compose -f docker-compose.prod.yml exec -T db psql -U blissful_user -d blissful_tour < backup.sql
```

### Volume backup

```bash
# Volume backup
docker run --rm -v blissful-tour_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data
```

## Monitoring va Loglar

```bash
# Barcha containerlar logini ko'rish
docker-compose -f docker-compose.prod.yml logs -f

# Faqat backend logini ko'rish
docker-compose -f docker-compose.prod.yml logs -f backend

# Resource usage
docker stats
```

## Xavfsizlik Tavsiyalari

1. ✅ SECRET_KEY ni hech qachon ommaga ko'rsatmang
2. ✅ DEBUG=False production da
3. ✅ Kuchli database parollarini ishlating
4. ✅ SSH port ni o'zgartiring (default 22 o'rniga)
5. ✅ Fail2ban o'rnating SSH himoyasi uchun
6. ✅ Muntazam backup oling
7. ✅ SSL sertifikat ishlating (HTTPS)
8. ✅ Firewall ni to'g'ri sozlang

## Qo'shimcha Sozlamalar

### Auto-restart containerlar

Docker containerlari server qayta yuklanganda avtomatik ishga tushishi uchun `docker-compose.prod.yml` da `restart: unless-stopped` sozlangan.

### Cron job uchun backup

```bash
# Crontab ochish
crontab -e

# Har kuni soat 2 da backup olish
0 2 * * * cd /home/$USER/blissful-tour && docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U blissful_user blissful_tour > backup_$(date +\%Y\%m\%d).sql
```

## Yordam

Agar muammolar yuzaga kelsa:
1. Loglarni diqqat bilan o'qing
2. Environment variablelarni tekshiring
3. Docker va container statuslarini ko'ring
4. GitHub Issues ga murojaat qiling

---

**Muvaffaqiyatli deployment!** 🚀
