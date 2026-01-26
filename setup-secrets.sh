#!/bin/bash

# GitHub Secrets sozlash uchun yordamchi script
# Bu script sizga kerakli secretlarni ro'yxatini ko'rsatadi va ularga qiymat berishda yordam beradi

echo "================================================"
echo "  Blissful Tour - GitHub Secrets Setup Helper"
echo "================================================"
echo ""
echo "Bu script GitHub Secrets sozlashda yordam beradi."
echo "Secretlarni GitHub repository Settings -> Secrets and variables -> Actions ga qo'shishingiz kerak."
echo ""

# Function to display secret template
show_secret() {
    local name=$1
    local description=$2
    local example=$3

    echo "Secret: $name"
    echo "Tavsif: $description"
    if [ -n "$example" ]; then
        echo "Misol: $example"
    fi
    echo ""
}

echo "=== 1. Docker Hub Secrets ==="
echo ""
show_secret "DOCKER_USERNAME" "Docker Hub username" "john_doe"
show_secret "DOCKER_PASSWORD" "Docker Hub access token (NOT password!)" "dckr_pat_xxxxxxxxxxxxx"

echo "=== 2. Server SSH Secrets ==="
echo ""
show_secret "SERVER_HOST" "Server IP manzili yoki domain" "123.45.67.89"
show_secret "SERVER_USERNAME" "SSH username" "ubuntu"
show_secret "SERVER_SSH_KEY" "SSH private key (cat ~/.ssh/id_rsa)" "-----BEGIN OPENSSH PRIVATE KEY-----..."
show_secret "SERVER_PORT" "SSH port" "22"
show_secret "SERVER_PROJECT_PATH" "Server dagi loyiha papkasi" "/home/ubuntu/blissful-tour"
show_secret "SERVER_URL" "Production URL" "https://your-domain.com"

echo "=== 3. Application Secrets ==="
echo ""
show_secret "SECRET_KEY" "Django secret key" ""
show_secret "POSTGRES_PASSWORD" "Database parol" "VeryStr0ng_P@ssw0rd"
show_secret "TRAVELPAYOUTS_TOKEN" "Travelpayouts API token" ""
show_secret "RAPIDAPI_KEY" "RapidAPI key" ""
show_secret "GEMINI_API_KEY" "Google Gemini API key" ""

echo ""
echo "=== Django SECRET_KEY generatsiya qilish ==="
echo ""
echo "Django SECRET_KEY yaratish uchun quyidagi buyruqni ishlatishingiz mumkin:"
echo ""
echo "python3 -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
echo ""

echo "=== SSH Key yaratish ==="
echo ""
echo "Yangi SSH key yaratish:"
echo "ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/github_actions_key"
echo ""
echo "Public keyni serverga qo'shish:"
echo "ssh-copy-id -i ~/.ssh/github_actions_key.pub user@server-ip"
echo ""
echo "Private keyni ko'rish (GitHub Secret uchun):"
echo "cat ~/.ssh/github_actions_key"
echo ""

echo "=== Docker Hub Access Token ==="
echo ""
echo "1. https://hub.docker.com/ ga kiring"
echo "2. Account Settings -> Security -> New Access Token"
echo "3. Token nomini kiriting (masalan: github-actions)"
echo "4. Read, Write, Delete ruxsatlarini bering"
echo "5. Token ni nusxalab DOCKER_PASSWORD secretiga qo'shing"
echo ""

echo "=== GitHub Secrets qo'shish ==="
echo ""
echo "1. GitHub repository ga o'ting"
echo "2. Settings -> Secrets and variables -> Actions"
echo "3. 'New repository secret' tugmasini bosing"
echo "4. Secret nomini va qiymatini kiriting"
echo "5. 'Add secret' tugmasini bosing"
echo ""
echo "Barcha secretlarni yuqoridagi ro'yxatdan qo'shing!"
echo ""

echo "================================================"
echo "Qo'shimcha ma'lumot uchun CI-CD.md faylini o'qing"
echo "================================================"
