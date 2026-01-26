"""
Mamlakatlarni bazaga import qilish skripti
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.destinations.models import Country

# Mamlakatlar ro'yxati
countries_data = [
    # Markaziy Osiyo
    {"code": "KZ", "name": "Kazakhstan", "name_uz": "Qozog'iston", "flag": "🇰🇿", "currency": "KZT", "visa": False},
    {"code": "KG", "name": "Kyrgyzstan", "name_uz": "Qirg'iziston", "flag": "🇰🇬", "currency": "KGS", "visa": False},
    {"code": "TJ", "name": "Tajikistan", "name_uz": "Tojikiston", "flag": "🇹🇯", "currency": "TJS", "visa": False},
    {"code": "TM", "name": "Turkmenistan", "name_uz": "Turkmaniston", "flag": "🇹🇲", "currency": "TMT", "visa": True},

    # Rossiya va MDH
    {"code": "RU", "name": "Russia", "name_uz": "Rossiya", "flag": "🇷🇺", "currency": "RUB", "visa": False},
    {"code": "BY", "name": "Belarus", "name_uz": "Belarus", "flag": "🇧🇾", "currency": "BYN", "visa": False},
    {"code": "UA", "name": "Ukraine", "name_uz": "Ukraina", "flag": "🇺🇦", "currency": "UAH", "visa": False},
    {"code": "MD", "name": "Moldova", "name_uz": "Moldova", "flag": "🇲🇩", "currency": "MDL", "visa": False},

    # Yevropa
    {"code": "AT", "name": "Austria", "name_uz": "Avstriya", "flag": "🇦🇹", "currency": "EUR", "visa": True},
    {"code": "BE", "name": "Belgium", "name_uz": "Belgiya", "flag": "🇧🇪", "currency": "EUR", "visa": True},
    {"code": "CH", "name": "Switzerland", "name_uz": "Shveytsariya", "flag": "🇨🇭", "currency": "CHF", "visa": True},
    {"code": "CZ", "name": "Czech Republic", "name_uz": "Chexiya", "flag": "🇨🇿", "currency": "CZK", "visa": True},
    {"code": "DK", "name": "Denmark", "name_uz": "Daniya", "flag": "🇩🇰", "currency": "DKK", "visa": True},
    {"code": "FI", "name": "Finland", "name_uz": "Finlandiya", "flag": "🇫🇮", "currency": "EUR", "visa": True},
    {"code": "GR", "name": "Greece", "name_uz": "Gretsiya", "flag": "🇬🇷", "currency": "EUR", "visa": True},
    {"code": "HU", "name": "Hungary", "name_uz": "Vengriya", "flag": "🇭🇺", "currency": "HUF", "visa": True},
    {"code": "NO", "name": "Norway", "name_uz": "Norvegiya", "flag": "🇳🇴", "currency": "NOK", "visa": True},
    {"code": "PL", "name": "Poland", "name_uz": "Polsha", "flag": "🇵🇱", "currency": "PLN", "visa": True},
    {"code": "PT", "name": "Portugal", "name_uz": "Portugaliya", "flag": "🇵🇹", "currency": "EUR", "visa": True},
    {"code": "SE", "name": "Sweden", "name_uz": "Shvetsiya", "flag": "🇸🇪", "currency": "SEK", "visa": True},

    # Osiyo
    {"code": "IN", "name": "India", "name_uz": "Hindiston", "flag": "🇮🇳", "currency": "INR", "visa": True},
    {"code": "PK", "name": "Pakistan", "name_uz": "Pokiston", "flag": "🇵🇰", "currency": "PKR", "visa": True},
    {"code": "BD", "name": "Bangladesh", "name_uz": "Bangladesh", "flag": "🇧🇩", "currency": "BDT", "visa": True},
    {"code": "LK", "name": "Sri Lanka", "name_uz": "Shri-Lanka", "flag": "🇱🇰", "currency": "LKR", "visa": True},
    {"code": "NP", "name": "Nepal", "name_uz": "Nepal", "flag": "🇳🇵", "currency": "NPR", "visa": True},
    {"code": "VN", "name": "Vietnam", "name_uz": "Vyetnam", "flag": "🇻🇳", "currency": "VND", "visa": True},
    {"code": "KH", "name": "Cambodia", "name_uz": "Kambodja", "flag": "🇰🇭", "currency": "KHR", "visa": True},
    {"code": "MM", "name": "Myanmar", "name_uz": "Myanma", "flag": "🇲🇲", "currency": "MMK", "visa": True},
    {"code": "PH", "name": "Philippines", "name_uz": "Filippin", "flag": "🇵🇭", "currency": "PHP", "visa": False},
    {"code": "ID", "name": "Indonesia", "name_uz": "Indoneziya", "flag": "🇮🇩", "currency": "IDR", "visa": True},
    {"code": "TW", "name": "Taiwan", "name_uz": "Tayvan", "flag": "🇹🇼", "currency": "TWD", "visa": True},

    # Kavkaz
    {"code": "AZ", "name": "Azerbaijan", "name_uz": "Ozarbayjon", "flag": "🇦🇿", "currency": "AZN", "visa": False},
    {"code": "GE", "name": "Georgia", "name_uz": "Gruziya", "flag": "🇬🇪", "currency": "GEL", "visa": False},
    {"code": "AM", "name": "Armenia", "name_uz": "Armaniston", "flag": "🇦🇲", "currency": "AMD", "visa": False},

    # O'rta Sharq
    {"code": "IR", "name": "Iran", "name_uz": "Eron", "flag": "🇮🇷", "currency": "IRR", "visa": True},
    {"code": "IQ", "name": "Iraq", "name_uz": "Iroq", "flag": "🇮🇶", "currency": "IQD", "visa": True},
    {"code": "SA", "name": "Saudi Arabia", "name_uz": "Saudiya Arabistoni", "flag": "🇸🇦", "currency": "SAR", "visa": True},
    {"code": "IL", "name": "Israel", "name_uz": "Isroil", "flag": "🇮🇱", "currency": "ILS", "visa": True},
    {"code": "JO", "name": "Jordan", "name_uz": "Iordaniya", "flag": "🇯🇴", "currency": "JOD", "visa": True},
    {"code": "LB", "name": "Lebanon", "name_uz": "Livan", "flag": "🇱🇧", "currency": "LBP", "visa": True},
    {"code": "KW", "name": "Kuwait", "name_uz": "Quvayt", "flag": "🇰🇼", "currency": "KWD", "visa": True},
    {"code": "OM", "name": "Oman", "name_uz": "Ummon", "flag": "🇴🇲", "currency": "OMR", "visa": True},
    {"code": "BH", "name": "Bahrain", "name_uz": "Bahrayn", "flag": "🇧🇭", "currency": "BHD", "visa": True},

    # Afrika
    {"code": "ZA", "name": "South Africa", "name_uz": "Janubiy Afrika", "flag": "🇿🇦", "currency": "ZAR", "visa": True},
    {"code": "KE", "name": "Kenya", "name_uz": "Keniya", "flag": "🇰🇪", "currency": "KES", "visa": True},
    {"code": "ET", "name": "Ethiopia", "name_uz": "Efiopiya", "flag": "🇪🇹", "currency": "ETB", "visa": True},
    {"code": "MA", "name": "Morocco", "name_uz": "Marokash", "flag": "🇲🇦", "currency": "MAD", "visa": False},
    {"code": "NG", "name": "Nigeria", "name_uz": "Nigeriya", "flag": "🇳🇬", "currency": "NGN", "visa": True},
    {"code": "DZ", "name": "Algeria", "name_uz": "Jazoir", "flag": "🇩🇿", "currency": "DZD", "visa": True},
    {"code": "TN", "name": "Tunisia", "name_uz": "Tunis", "flag": "🇹🇳", "currency": "TND", "visa": False},

    # Janubiy Amerika
    {"code": "BR", "name": "Brazil", "name_uz": "Braziliya", "flag": "🇧🇷", "currency": "BRL", "visa": True},
    {"code": "AR", "name": "Argentina", "name_uz": "Argentina", "flag": "🇦🇷", "currency": "ARS", "visa": True},
    {"code": "PE", "name": "Peru", "name_uz": "Peru", "flag": "🇵🇪", "currency": "PEN", "visa": True},
    {"code": "CL", "name": "Chile", "name_uz": "Chili", "flag": "🇨🇱", "currency": "CLP", "visa": True},
    {"code": "CO", "name": "Colombia", "name_uz": "Kolumbiya", "flag": "🇨🇴", "currency": "COP", "visa": False},

    # Okeaniya
    {"code": "NZ", "name": "New Zealand", "name_uz": "Yangi Zelandiya", "flag": "🇳🇿", "currency": "NZD", "visa": True},
]


def import_countries():
    """Mamlakatlarni import qilish"""
    added = 0
    skipped = 0

    print(f"\nMamlakatlarni import qilish boshlandi...")
    print(f"Jami: {len(countries_data)} ta mamlakat\n")

    for country in countries_data:
        try:
            # Mamlakat mavjudmi?
            if Country.objects.filter(code=country['code']).exists():
                print(f"SKIP {country['code']} - {country['name_uz']} (mavjud)")
                skipped += 1
                continue

            # Mamlakatni yaratish
            Country.objects.create(
                name=country['name'],
                name_uz=country['name_uz'],
                code=country['code'],
                flag_emoji=country['flag'],
                currency=country['currency'],
                visa_required_for_uz=country['visa']
            )

            print(f"OK   {country['code']} - {country['name_uz']}")
            added += 1

        except Exception as e:
            print(f"ERR  {country.get('code', 'UNKNOWN')} - Xatolik: {str(e)}")

    print(f"\n{'='*60}")
    print(f"Qo'shildi: {added} ta")
    print(f"O'tkazildi: {skipped} ta")
    print(f"Jami mamlakatlar: {Country.objects.count()} ta")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    import_countries()
