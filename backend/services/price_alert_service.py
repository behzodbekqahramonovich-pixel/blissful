"""
Narx Alert Service - Foydalanuvchilarga narx tushganda xabar berish
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

logger = logging.getLogger(__name__)


class PriceAlertService:
    """Narx alertlarini boshqarish va yuborish"""

    def __init__(self):
        self.email_enabled = hasattr(settings, 'EMAIL_HOST')

    def create_alert(
        self,
        user_email: str,
        origin_iata: str,
        destination_iata: str,
        target_price: Decimal,
        departure_date: Optional[datetime] = None
    ) -> Dict:
        """
        Yangi narx alert yaratish

        Args:
            user_email: Foydalanuvchi emaili
            origin_iata: Boshlang'ich shahar IATA kodi
            destination_iata: Manzil shahar IATA kodi
            target_price: Maqsadli narx (USD)
            departure_date: Jo'nash sanasi (optional)

        Returns:
            Alert ma'lumotlari
        """
        from apps.pricing.models import PriceAlert
        from apps.destinations.models import City

        try:
            origin = City.objects.get(iata_code=origin_iata)
            destination = City.objects.get(iata_code=destination_iata)

            alert = PriceAlert.objects.create(
                email=user_email,
                origin=origin,
                destination=destination,
                target_price=target_price,
                departure_date=departure_date,
                is_active=True,
                created_at=datetime.now()
            )

            logger.info(
                f"Price alert created: {user_email} - "
                f"{origin_iata} → {destination_iata} @ ${target_price}"
            )

            # Tasdiqlash emaili yuborish
            self._send_confirmation_email(alert)

            return {
                'id': alert.id,
                'origin': origin.name,
                'destination': destination.name,
                'target_price': float(target_price),
                'created': True
            }

        except Exception as e:
            logger.error(f"Failed to create price alert: {e}")
            raise

    def check_alerts(self) -> int:
        """
        Barcha active alertlarni tekshirish va zarur bo'lsa email yuborish

        Returns:
            Yuborilgan emaillar soni
        """
        from apps.pricing.models import PriceAlert
        from services.external_apis import travelpayouts_api

        active_alerts = PriceAlert.objects.filter(
            is_active=True,
            last_checked__lt=datetime.now() - timedelta(hours=6)
        )

        sent_count = 0

        for alert in active_alerts:
            try:
                # Hozirgi narxni tekshirish
                current_price = self._get_current_price(
                    alert.origin.iata_code,
                    alert.destination.iata_code,
                    alert.departure_date
                )

                # Alert holatini yangilash
                alert.last_checked = datetime.now()
                alert.last_price = current_price
                alert.save()

                # Agar narx maqsadga yetsa
                if current_price and current_price <= alert.target_price:
                    self._send_alert_email(alert, current_price)
                    sent_count += 1

                    # Alert ni inactive qilish (bir marta xabar)
                    alert.is_active = False
                    alert.triggered_at = datetime.now()
                    alert.save()

            except Exception as e:
                logger.error(f"Failed to check alert {alert.id}: {e}")
                continue

        return sent_count

    def _get_current_price(
        self,
        origin: str,
        destination: str,
        date: Optional[datetime]
    ) -> Optional[Decimal]:
        """Hozirgi narxni olish"""
        from services.external_apis import travelpayouts_api

        try:
            if date:
                # Aniq sana uchun
                prices = travelpayouts_api.get_prices_for_dates(
                    origin=origin,
                    destination=destination,
                    departure_date=date.strftime('%Y-%m-%d'),
                    return_date=(date + timedelta(days=7)).strftime('%Y-%m-%d')
                )
            else:
                # Eng arzon narx
                prices = travelpayouts_api.get_cheapest_prices(
                    origin=origin,
                    destination=destination
                )

            if prices and len(prices) > 0:
                return Decimal(str(prices[0].get('value', 0)))

            return None

        except Exception as e:
            logger.error(f"Failed to get current price: {e}")
            return None

    def _send_confirmation_email(self, alert) -> bool:
        """Alert yaratilgani haqida email yuborish"""
        if not self.email_enabled:
            logger.warning("Email not configured")
            return False

        try:
            subject = f"✅ Narx alert yaratildi: {alert.origin.name} → {alert.destination.name}"
            message = f"""
Assalomu alaykum!

Sizning narx alertingiz muvaffaqiyatli yaratildi:

📍 Marshsrut: {alert.origin.name} ({alert.origin.iata_code}) → {alert.destination.name} ({alert.destination.iata_code})
💰 Maqsadli narx: ${alert.target_price}
📅 Sana: {alert.departure_date.strftime('%d.%m.%Y') if alert.departure_date else 'Istalgan'}

Narx ${alert.target_price} dan pastga tushganda sizga email yuboramiz.

Hurmat bilan,
Blissful Tour jamoasi
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alert.email],
                fail_silently=False,
            )

            return True

        except Exception as e:
            logger.error(f"Failed to send confirmation email: {e}")
            return False

    def _send_alert_email(self, alert, current_price: Decimal) -> bool:
        """Narx tushgani haqida email yuborish"""
        if not self.email_enabled:
            logger.warning("Email not configured")
            return False

        try:
            discount = alert.target_price - current_price
            discount_percent = (discount / alert.target_price) * 100

            subject = f"🔥 Narx tushdi! {alert.origin.name} → {alert.destination.name}"
            message = f"""
Assalomu alaykum!

Yaxshi xabar! Siz kutgan narx tushdi! 🎉

📍 Marshsrut: {alert.origin.name} → {alert.destination.name}
💰 Sizning maqsadingiz: ${alert.target_price}
🔥 Hozirgi narx: ${current_price}
💵 Tejash: ${discount} ({discount_percent:.1f}%)

Bu narx tez o'zgarishi mumkin, shuning uchun tezroq bron qilishni tavsiya qilamiz!

🔗 Qidiruv sahifasiga o'tish:
https://blissfultour.uz/search?from={alert.origin.iata_code}&to={alert.destination.iata_code}

Hurmat bilan,
Blissful Tour jamoasi

---
Agar keyingi alertlar kerak bo'lmasa, bu emaildagi linkdan unsubscribe qiling.
            """

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[alert.email],
                fail_silently=False,
            )

            logger.info(f"Alert email sent to {alert.email}: ${current_price}")
            return True

        except Exception as e:
            logger.error(f"Failed to send alert email: {e}")
            return False

    def get_user_alerts(self, email: str) -> List[Dict]:
        """Foydalanuvchining barcha alertlarini olish"""
        from apps.pricing.models import PriceAlert

        alerts = PriceAlert.objects.filter(email=email).order_by('-created_at')

        return [
            {
                'id': alert.id,
                'origin': {
                    'name': alert.origin.name,
                    'code': alert.origin.iata_code
                },
                'destination': {
                    'name': alert.destination.name,
                    'code': alert.destination.iata_code
                },
                'target_price': float(alert.target_price),
                'last_price': float(alert.last_price) if alert.last_price else None,
                'is_active': alert.is_active,
                'created_at': alert.created_at.isoformat(),
                'triggered_at': alert.triggered_at.isoformat() if alert.triggered_at else None
            }
            for alert in alerts
        ]

    def delete_alert(self, alert_id: int, email: str) -> bool:
        """Alert ni o'chirish"""
        from apps.pricing.models import PriceAlert

        try:
            alert = PriceAlert.objects.get(id=alert_id, email=email)
            alert.delete()
            logger.info(f"Alert {alert_id} deleted by {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete alert {alert_id}: {e}")
            return False


# Global instance
price_alert_service = PriceAlertService()
