"""
RSS Feed Service - Sayohat yangiliklari uchun
"""
import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import threading
import time
import re
import html


class RSSFeedService:
    """RSS feed'lardan yangiliklar olish"""

    # Sayohatga oid RSS manbalar
    RSS_FEEDS = [
        {'url': 'https://kun.uz/news/rss', 'name': 'Kun.uz'},
        {'url': 'https://daryo.uz/rss', 'name': 'Daryo.uz'},
        {'url': 'https://www.gazeta.uz/uz/rss', 'name': 'Gazeta.uz'},
        {'url': 'https://www.spot.uz/uz/rss/', 'name': 'Spot.uz'},
    ]

    # Sayohatga tegishli kalit so'zlar (og'irlik bilan)
    TRAVEL_KEYWORDS = {
        # Aviatsiya - yuqori og'irlik (3 ball)
        'samolyot': 3, 'parvoz': 3, 'aviakompaniya': 3, 'aviareys': 3,
        'aeroport': 3, 'uchish': 3, 'qo\'nish': 3, 'reys': 3,
        'uzbekistan airways': 3, 'air': 3, 'airways': 3, 'airline': 3,
        'boeing': 3, 'airbus': 3, 'terminal': 3,

        # Turizm - yuqori og'irlik (3 ball)
        'sayohat': 3, 'turizm': 3, 'turist': 3, 'turistik': 3,
        'dam olish': 3, 'kurort': 3, 'plyaj': 3, 'beach': 3,

        # Mehmonxonalar - yuqori og'irlik (3 ball)
        'mehmonxona': 3, 'hotel': 3, 'hostel': 3, 'resort': 3,
        'hilton': 3, 'hyatt': 3, 'marriott': 3, 'radisson': 3,
        'sheraton': 3, 'intercontinental': 3, 'wyndham': 3,
        'booking': 3, 'airbnb': 3, 'xona': 2, 'suit': 2,
        'yulduzli': 2, '5 yulduz': 3, '4 yulduz': 3, '3 yulduz': 2,
        'lyuks': 2, 'standart xona': 2, 'bron': 2, 'rezerv': 2,

        # Viza/chegara - yuqori og'irlik (3 ball)
        'viza': 3, 'vizasiz': 3, 'pasport': 3, 'passport': 3,

        # Mamlakatlar/shaharlar - o'rta og'irlik (2 ball)
        'dubai': 2, 'dubay': 2, 'istanbul': 2, 'antalya': 2,
        'turkiya': 2, 'turkey': 2, 'tailand': 2, 'thailand': 2,
        'malayziya': 2, 'singapore': 2, 'koreya': 2, 'yaponiya': 2,
        'misr': 2, 'sharm': 2, 'maldiv': 2, 'bali': 2,
        'yevro': 2, 'parizh': 2, 'london': 2, 'moskva': 2,
        'samarqand': 2, 'buxoro': 2, 'xiva': 2, 'toshkent': 2,
        'farg\'ona': 2, 'andijon': 2, 'namangan': 2, 'qarshi': 2,
        'nukus': 2, 'urganch': 2, 'termiz': 2, 'jizzax': 2,

        # Transport - o'rta og'irlik (2 ball)
        'yo\'lovchi': 2, 'chipta': 2, 'bilet': 2, 'aviachipta': 2,
        'tezyurar': 2, 'poezd': 2, 'temir yo\'l': 2,

        # Past og'irlik (1 ball)
        'sayohatchi': 1, 'safar': 1, 'yo\'l': 1, 'restoran': 1,
    }

    # Istisno so'zlar - bu so'zlar bo'lsa yangilik sayohatga tegishli emas
    EXCLUDE_KEYWORDS = [
        'urush', 'harbiy', 'qurolli', 'mudofaa', 'armiya', 'askar',
        'jinoyat', 'sud', 'qamoq', 'tergovchi', 'jinoiy',
        'o\'ldirish', 'halokat', 'fojia', 'portlash', 'hujum',
        'prezident', 'saylov', 'parlament', 'deputat', 'siyosat',
        'dollar kursi', 'inflyatsiya', 'bank', 'kredit', 'moliya',
        'kasallik', 'virus', 'epidemiya', 'shifoxona', 'davolash',
        'sport', 'futbol', 'chempionat', 'olimpiada', 'medal',
    ]

    # Kategoriyalarni aniqlash uchun kalit so'zlar
    CATEGORY_KEYWORDS = {
        'Viza': ['viza', 'vizasiz', 'pasport', 'passport', 'chegara', 'bojxona'],
        'Transport': ['samolyot', 'parvoz', 'reys', 'aeroport', 'aviakompaniya', 'aviachipta', 'tezyurar', 'poezd', 'uchish'],
        'Aksiya': ['aksiya', 'chegirma', 'skidka', 'arzon', 'maxsus narx', 'sale', 'promo'],
        'Mehmonxona': ['mehmonxona', 'hotel', 'hostel', 'resort', 'villa'],
        'Reyting': ['reyting', 'top', 'eng yaxshi', 'best', 'ro\'yxat'],
        'Yangilik': []  # Default
    }

    # Minimal ball - bu balldan past bo'lsa yangilik o'tkazilmaydi
    MIN_RELEVANCE_SCORE = 3

    def __init__(self, cache_duration_minutes: int = 10):
        self._cache: List[Dict] = []
        self._cache_time: Optional[datetime] = None
        self._cache_duration = timedelta(minutes=cache_duration_minutes)
        self._lock = threading.Lock()
        self._fallback_news = self._get_fallback_news()

    def _get_fallback_news(self) -> List[Dict]:
        """Zaxira yangiliklar (RSS da kam yangilik bo'lsa)"""
        today = datetime.now().strftime("%Y-%m-%d")
        return [
            {
                'id': 101,
                'title': "Dubai 2025 yilda yangi turistik zonani ochadi",
                'description': "Dubai Creek Harbour'da yangi dam olish maskani ochildi. 500 dan ortiq mehmonxona va restoranlar.",
                'image': "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop",
                'date': today,
                'category': "Yangilik",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 102,
                'title': "Turkiyaga vizasiz sayohat muddati uzaytirildi",
                'description': "O'zbekiston fuqarolari uchun Turkiyaga 90 kunlik vizasiz rejim 2026 yilgacha uzaytirildi.",
                'image': "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=250&fit=crop",
                'date': today,
                'category': "Viza",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 103,
                'title': "Toshkent-Istanbul $99 dan boshlanadi",
                'description': "Qishki mavsumda Toshkent-Istanbul yo'nalishida maxsus aksiya. Chiptalar cheklangan.",
                'image': "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop",
                'date': today,
                'category': "Aksiya",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 104,
                'title': "Samarqand - eng yaxshi turistik shaharlar ro'yxatida",
                'description': "Lonely Planet nashri Samarqandni 2025 yilning top-10 turistik shaharlari ro'yxatiga kiritdi.",
                'image': "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&h=250&fit=crop",
                'date': today,
                'category': "Reyting",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 105,
                'title': "Malayziyaga vizasiz kirish joriy etildi",
                'description': "O'zbekiston fuqarolari uchun Malayziyaga 30 kunlik vizasiz kirish imkoniyati yaratildi.",
                'image': "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=250&fit=crop",
                'date': today,
                'category': "Viza",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 106,
                'title': "Toshkent-Dubay yo'nalishida yangi reyslar",
                'description': "Uzbekistan Airways Toshkent-Dubay yo'nalishida kundalik reyslarni boshladi.",
                'image': "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=250&fit=crop",
                'date': today,
                'category': "Transport",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 107,
                'title': "Antalya mehmonxonalarida 30% chegirma",
                'description': "Qishki mavsumda Antalya kurortlarida maxsus chegirma aksiyasi boshlandi.",
                'image': "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
                'date': today,
                'category': "Aksiya",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 108,
                'title': "Tailand vizasiz rejimni uzaytirdi",
                'description': "Tailand O'zbekiston fuqarolari uchun 30 kunlik vizasiz rejimni 2026 yilgacha uzaytirdi.",
                'image': "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=250&fit=crop",
                'date': today,
                'category': "Viza",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 109,
                'title': "Toshkentda yangi Hilton mehmonxonasi ochildi",
                'description': "Hilton Garden Inn Toshkent shahar markazida o'z eshiklarini ochdi. 200 ta zamonaviy xona.",
                'image': "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
                'date': today,
                'category': "Mehmonxona",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 110,
                'title': "Booking.com O'zbekiston bo'yicha eng yaxshi mehmonxonalarni e'lon qildi",
                'description': "2025 yil uchun Traveller Review Awards g'oliblari aniqlandi. Samarqand va Buxoro yetakchi.",
                'image': "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop",
                'date': today,
                'category': "Reyting",
                'source': "Blissful Tour",
                'url': None
            },
            {
                'id': 111,
                'title': "Buxoroda yangi 5 yulduzli resort ochildi",
                'description': "Buxoro Old City Resort 5 yulduzli mehmonxona sifatida faoliyatini boshladi. Spa va basseyn mavjud.",
                'image': "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=250&fit=crop",
                'date': today,
                'category': "Mehmonxona",
                'source': "Blissful Tour",
                'url': None
            },
        ]

    def _clean_html(self, text: str) -> str:
        """HTML teglarni tozalash"""
        if not text:
            return ""
        # HTML entities decode
        text = html.unescape(text)
        # HTML teglarni olib tashlash
        clean = re.sub(r'<[^>]+>', '', text)
        # Ko'p bo'shliqlarni bitta qilish
        clean = re.sub(r'\s+', ' ', clean).strip()
        return clean[:300] if len(clean) > 300 else clean

    def _detect_category(self, title: str, description: str) -> str:
        """Yangilik kategoriyasini aniqlash"""
        text = f"{title} {description}".lower()

        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                return category

        return "Yangilik"

    def _get_image_for_category(self, category: str, title: str) -> str:
        """Kategoriyaga mos rasm URL"""
        images = {
            'Viza': "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
            'Transport': "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=250&fit=crop",
            'Aksiya': "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=250&fit=crop",
            'Reyting': "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop",
            'Yangilik': "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&h=250&fit=crop",
        }

        # Maxsus kalit so'zlar uchun rasmlar
        title_lower = title.lower()
        if any(word in title_lower for word in ['dubai', 'dubay']):
            return "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop"
        if any(word in title_lower for word in ['istanbul', 'turkiya', 'turkey']):
            return "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=250&fit=crop"
        if any(word in title_lower for word in ['tailand', 'thailand', 'bangkok']):
            return "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=250&fit=crop"
        if any(word in title_lower for word in ['samarqand', 'buxoro', 'xiva']):
            return "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&h=250&fit=crop"

        return images.get(category, images['Yangilik'])

    def _calculate_relevance_score(self, title: str, description: str) -> int:
        """Yangilik sayohatga qanchalik tegishli ekanini hisoblash"""
        text = f"{title} {description}".lower()

        # Istisno so'zlar tekshirish - agar bor bo'lsa 0 qaytarish
        for exclude_word in self.EXCLUDE_KEYWORDS:
            if exclude_word in text:
                return 0

        # Ball hisoblash
        score = 0
        for keyword, weight in self.TRAVEL_KEYWORDS.items():
            if keyword in text:
                score += weight

        return score

    def _is_travel_related(self, title: str, description: str) -> bool:
        """Yangilik sayohatga tegishlimi tekshirish"""
        score = self._calculate_relevance_score(title, description)
        return score >= self.MIN_RELEVANCE_SCORE

    def _parse_date(self, entry) -> str:
        """RSS entry dan sanani olish"""
        try:
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                dt = datetime(*entry.published_parsed[:6])
                return dt.strftime("%Y-%m-%d")
            if hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                dt = datetime(*entry.updated_parsed[:6])
                return dt.strftime("%Y-%m-%d")
        except:
            pass
        return datetime.now().strftime("%Y-%m-%d")

    def _fetch_feed(self, feed_config: Dict) -> List[Dict]:
        """Bitta RSS feed dan yangiliklar olish"""
        news = []
        try:
            # Timeout bilan so'rov (redirect ruxsat berilgan)
            response = requests.get(
                feed_config['url'],
                timeout=15,
                allow_redirects=True,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                }
            )
            feed = feedparser.parse(response.content)

            for entry in feed.entries[:30]:  # Har bir feed dan max 30 ta tekshirish
                title = self._clean_html(entry.get('title', ''))
                description = self._clean_html(
                    entry.get('summary', '') or entry.get('description', '')
                )

                # Sayohatga tegishli yangilikni filtrlaymiz
                if not self._is_travel_related(title, description):
                    continue

                category = self._detect_category(title, description)
                score = self._calculate_relevance_score(title, description)

                news.append({
                    'title': title,
                    'description': description,
                    'date': self._parse_date(entry),
                    'category': category,
                    'source': feed_config['name'],
                    'url': entry.get('link'),
                    'image': self._get_image_for_category(category, title),
                    'relevance_score': score  # Debugging uchun
                })

        except Exception as e:
            print(f"RSS xatolik ({feed_config['name']}): {e}")

        return news

    def get_news(self, limit: int = 10, force_refresh: bool = False) -> List[Dict]:
        """
        Yangiliklar olish (kesh bilan)

        Args:
            limit: Maksimal yangiliklar soni
            force_refresh: Keshni yangilash

        Returns:
            Yangiliklar ro'yxati
        """
        with self._lock:
            # Keshni tekshirish
            if not force_refresh and self._cache and self._cache_time:
                if datetime.now() - self._cache_time < self._cache_duration:
                    return self._cache[:limit]

            # Barcha feed'lardan yangiliklar olish
            all_news = []
            for feed_config in self.RSS_FEEDS:
                all_news.extend(self._fetch_feed(feed_config))

            # Agar yangilik kam bo'lsa, zaxira yangiliklar qo'shish
            if len(all_news) < 5:
                fallback = self._fallback_news.copy()
                for item in fallback:
                    item['relevance_score'] = 5  # Zaxira yangiliklar uchun
                all_news.extend(fallback)

            # Relevantlik va sanaga ko'ra tartiblash
            all_news.sort(key=lambda x: (x.get('relevance_score', 0), x['date']), reverse=True)

            # Dublikatlarni olib tashlash (sarlavha bo'yicha)
            seen_titles = set()
            unique_news = []
            for item in all_news:
                title_key = item['title'][:50].lower()
                if title_key not in seen_titles:
                    seen_titles.add(title_key)
                    item['id'] = len(unique_news) + 1
                    unique_news.append(item)

            # Keshga saqlash
            self._cache = unique_news
            self._cache_time = datetime.now()

            return unique_news[:limit]

    def get_cache_status(self) -> Dict:
        """Kesh holati"""
        return {
            'cached': bool(self._cache),
            'cache_time': self._cache_time.isoformat() if self._cache_time else None,
            'news_count': len(self._cache),
            'sources': [f['name'] for f in self.RSS_FEEDS]
        }


# Global instance
rss_feed_service = RSSFeedService(cache_duration_minutes=5)
