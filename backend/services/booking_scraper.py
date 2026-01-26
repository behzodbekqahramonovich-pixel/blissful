"""
Booking.com Scraper - Mehmonxona narxlari va ma'lumotlarini olish

DIQQAT: Bu scraper educational maqsadlarda. Production da foydalanishdan oldin
Booking.com Terms of Service ni o'qing va RapidAPI dan foydalaning.
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time
import random
import logging

logger = logging.getLogger(__name__)


class BookingScraper:
    """Booking.com dan mehmonxona ma'lumotlarini olish"""

    BASE_URL = "https://www.booking.com"
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ]

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def _get_headers(self) -> Dict:
        """Random User-Agent bilan headers"""
        return {
            **self.session.headers,
            'User-Agent': random.choice(self.USER_AGENTS)
        }

    def _delay(self):
        """Request'lar orasida tasodifiy delay"""
        time.sleep(random.uniform(1, 3))

    def search_hotels(
        self,
        city: str,
        checkin: datetime,
        checkout: datetime,
        adults: int = 2,
        rooms: int = 1,
        max_results: int = 20
    ) -> List[Dict]:
        """
        Booking.com dan mehmonxonalar qidirish

        Args:
            city: Shahar nomi
            checkin: Kirish sanasi
            checkout: Chiqish sanasi
            adults: Kattalar soni
            rooms: Xonalar soni
            max_results: Maksimal natijalar

        Returns:
            Mehmonxonalar ro'yxati
        """
        try:
            # Search URL yaratish
            checkin_str = checkin.strftime('%Y-%m-%d')
            checkout_str = checkout.strftime('%Y-%m-%d')

            search_url = f"{self.BASE_URL}/searchresults.html"
            params = {
                'ss': city,
                'checkin': checkin_str,
                'checkout': checkout_str,
                'group_adults': adults,
                'no_rooms': rooms,
                'selected_currency': 'USD'
            }

            logger.info(f"Searching hotels in {city} ({checkin_str} - {checkout_str})")

            response = self.session.get(
                search_url,
                params=params,
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()

            return self._parse_search_results(response.text, max_results)

        except Exception as e:
            logger.error(f"Booking.com scraping error: {e}")
            return []

    def _parse_search_results(self, html: str, max_results: int) -> List[Dict]:
        """HTML dan mehmonxonalar ma'lumotini parse qilish"""
        soup = BeautifulSoup(html, 'html.parser')
        hotels = []

        # Booking.com HTML strukturasi tez-tez o'zgaradi
        # Bu selector'lar 2024 yil holatiga mos
        hotel_cards = soup.find_all('div', {'data-testid': 'property-card'})

        if not hotel_cards:
            # Fallback selector
            hotel_cards = soup.find_all('div', class_=lambda x: x and 'sr_property_block' in x)

        for card in hotel_cards[:max_results]:
            try:
                hotel_data = self._parse_hotel_card(card)
                if hotel_data:
                    hotels.append(hotel_data)
            except Exception as e:
                logger.warning(f"Failed to parse hotel card: {e}")
                continue

        return hotels

    def _parse_hotel_card(self, card) -> Optional[Dict]:
        """Bitta hotel card dan ma'lumot olish"""
        try:
            # Hotel nomi
            name_elem = card.find('div', {'data-testid': 'title'})
            if not name_elem:
                name_elem = card.find('span', class_='sr-hotel__name')

            if not name_elem:
                return None

            name = name_elem.get_text(strip=True)

            # Narx
            price_elem = card.find('span', {'data-testid': 'price-and-discounted-price'})
            if not price_elem:
                price_elem = card.find('div', class_='bui-price-display__value')

            price = None
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                # "$150" -> 150.0
                price = float(''.join(filter(str.isdigit, price_text))) if price_text else None

            # Reyting
            score_elem = card.find('div', {'data-testid': 'review-score'})
            if not score_elem:
                score_elem = card.find('div', class_='bui-review-score__badge')

            score = None
            if score_elem:
                score_text = score_elem.get_text(strip=True)
                try:
                    score = float(score_text)
                except:
                    pass

            # Rasm
            img_elem = card.find('img', {'data-testid': 'image'})
            if not img_elem:
                img_elem = card.find('img', class_='hotel_image')

            image = img_elem.get('src') if img_elem else None

            # Link
            link_elem = card.find('a', {'data-testid': 'title-link'})
            if not link_elem:
                link_elem = card.find('a', class_='hotel_name_link')

            link = link_elem.get('href') if link_elem else None
            if link and not link.startswith('http'):
                link = f"{self.BASE_URL}{link}"

            # Joylashuv
            location_elem = card.find('span', {'data-testid': 'address'})
            if not location_elem:
                location_elem = card.find('span', class_='sr-hotel__address')

            location = location_elem.get_text(strip=True) if location_elem else None

            # Yulduzlar
            stars_elem = card.find('span', {'data-testid': 'rating-stars'})
            stars = None
            if stars_elem:
                stars_icons = stars_elem.find_all('span', class_='bui-icon')
                stars = len(stars_icons)

            return {
                'name': name,
                'price_per_night': price,
                'rating': score,
                'stars': stars,
                'location': location,
                'image': image,
                'url': link,
                'source': 'booking.com'
            }

        except Exception as e:
            logger.warning(f"Error parsing hotel card: {e}")
            return None

    def get_hotel_details(self, hotel_url: str) -> Optional[Dict]:
        """Mehmonxona tafsilotlari"""
        try:
            response = self.session.get(
                hotel_url,
                headers=self._get_headers(),
                timeout=30
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Qo'shimcha ma'lumotlar
            details = {}

            # Amenities
            facilities_section = soup.find('div', {'data-testid': 'property-most-popular-facilities'})
            if facilities_section:
                facilities = [
                    f.get_text(strip=True)
                    for f in facilities_section.find_all('div', class_='important_facility')
                ]
                details['amenities'] = facilities[:10]

            # Description
            desc_elem = soup.find('div', {'data-testid': 'property-description'})
            if desc_elem:
                details['description'] = desc_elem.get_text(strip=True)[:500]

            # Images
            gallery = soup.find_all('img', class_='hotel_photo_main')
            if gallery:
                details['images'] = [img.get('src') for img in gallery[:5]]

            return details

        except Exception as e:
            logger.error(f"Failed to get hotel details: {e}")
            return None


class SimpleBookingScraper:
    """Oddiy va tez Booking.com scraper"""

    @staticmethod
    def get_sample_hotels(city: str, count: int = 10) -> List[Dict]:
        """
        Sample hotels - real scraping o'rniga test uchun

        Production da bu funksiyani BookingScraper.search_hotels bilan
        almashtirish kerak
        """
        import random

        sample_hotels = [
            {
                'name': f'Grand Hotel {city}',
                'price_per_night': random.randint(50, 200),
                'rating': round(random.uniform(7.5, 9.5), 1),
                'stars': random.randint(3, 5),
                'location': f'City Center, {city}',
                'image': f'https://images.unsplash.com/photo-{random.randint(1000000, 9999999)}?w=400',
                'amenities': ['WiFi', 'Parking', 'Restaurant', 'Pool'],
                'source': 'booking.com'
            }
            for i in range(count)
        ]

        return sample_hotels


# Global instance
booking_scraper = BookingScraper()
