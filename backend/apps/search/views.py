from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from datetime import datetime, date, timedelta
from .models import TravelSearch, RouteVariant
from .serializers import (
    TravelSearchSerializer,
    TravelSearchCreateSerializer,
    RouteVariantSerializer,
    SearchResultSerializer
)
from apps.destinations.models import City
from services.route_finder import RouteFinder
from services.route_optimizer import RouteOptimizer
from services.external_apis import travelpayouts_api, booking_api
from services.popular_routes_scraper import popular_routes_scraper


class TravelSearchViewSet(viewsets.ModelViewSet):
    """Sayohat qidiruvi API"""
    queryset = TravelSearch.objects.prefetch_related('variants').all()
    serializer_class = TravelSearchSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return TravelSearchCreateSerializer
        return TravelSearchSerializer

    def create(self, request, *args, **kwargs):
        """Yangi qidiruv yaratish va variantlarni topish"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Shaharlarni topish
        origin = get_object_or_404(City, iata_code=data['origin'])
        destination = get_object_or_404(City, iata_code=data['destination'])

        # Qidiruvni yaratish
        search = TravelSearch.objects.create(
            origin=origin,
            destination=destination,
            departure_date=data['departure_date'],
            return_date=data['return_date'],
            travelers=data.get('travelers', 1),
            include_transit=data.get('include_transit', True),
            hotel_stars=data.get('hotel_stars', 3),
            budget_max_usd=data.get('budget_max')
        )

        # Optimallashtirish rejimini olish
        optimization_mode = request.data.get('optimization_mode', 'balanced')
        use_optimizer = request.data.get('use_optimizer', True)

        if use_optimizer:
            # Yangi ilg'or optimizer ishlatish
            optimizer = RouteOptimizer(search)
            variants = optimizer.find_optimal_route(mode=optimization_mode)
            saved_variants = optimizer.save_variants(variants)
        else:
            # Eski finder ishlatish
            finder = RouteFinder(search)
            variants = finder.find_all_routes()
            saved_variants = finder.save_variants(variants)

        # Tavsiya qilingan variant
        recommended = next(
            (v for v in saved_variants if v.is_recommended),
            saved_variants[0] if saved_variants else None
        )

        result = {
            'search': TravelSearchSerializer(search).data,
            'variants': RouteVariantSerializer(saved_variants, many=True).data,
            'recommended': RouteVariantSerializer(recommended).data if recommended else None,
            'optimization': {
                'mode': optimization_mode,
                'available_modes': ['cheapest', 'fastest', 'balanced', 'comfort']
            }
        }

        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def variants(self, request, pk=None):
        """Qidiruv variantlari"""
        search = self.get_object()
        variants = search.variants.all()
        serializer = RouteVariantSerializer(variants, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Mashhur yo'nalishlar - avtomatik tavsiya"""
        origin = request.query_params.get('origin', 'TAS')
        limit = int(request.query_params.get('limit', 6))

        # Scraper orqali tavsiyalarni olish
        recommendations = popular_routes_scraper.get_recommendations(
            origin=origin,
            limit=limit
        )

        return Response(recommendations)


class RouteVariantViewSet(viewsets.ReadOnlyModelViewSet):
    """Yo'nalish varianti API"""
    queryset = RouteVariant.objects.select_related('search').all()
    serializer_class = RouteVariantSerializer


class LiveFlightPricesView(APIView):
    """
    Aviasales.uz dan real vaqtda parvoz narxlarini olish

    GET /api/flights/live/?origin=TAS&destination=IST&date=2024-03-15

    Bu API Aviasales.uz (Travelpayouts) dan real vaqtda narxlarni oladi.
    Narxlar 5 daqiqa keshlanadi.
    """

    def get(self, request):
        origin = request.query_params.get('origin', '').upper()
        destination = request.query_params.get('destination', '').upper()
        departure_date_str = request.query_params.get('date')
        return_date_str = request.query_params.get('return_date')
        direct_only = request.query_params.get('direct', 'false').lower() == 'true'
        currency = request.query_params.get('currency', 'usd').lower()
        refresh = request.query_params.get('refresh', 'false').lower() == 'true'

        # Validatsiya
        if not origin or not destination:
            return Response(
                {'error': 'origin va destination parametrlari majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(origin) != 3 or len(destination) != 3:
            return Response(
                {'error': 'IATA kodlari 3 ta belgidan iborat bo\'lishi kerak (masalan: TAS, IST)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Sanani parse qilish
        try:
            if departure_date_str:
                departure_date = datetime.strptime(departure_date_str, '%Y-%m-%d').date()
            else:
                departure_date = date.today()

            return_date = None
            if return_date_str:
                return_date = datetime.strptime(return_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Sana formati noto\'g\'ri. To\'g\'ri format: YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Real vaqtda narxlarni olish
        flights = travelpayouts_api.search_flights(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            direct=direct_only,
            currency=currency,
            use_cache=not refresh  # refresh=true bo'lsa, keshni o'tkazib yuborish
        )

        # API holati
        api_status = travelpayouts_api.get_api_status()

        # Eng arzon narxni topish
        cheapest = min(flights, key=lambda x: x['price']) if flights else None

        return Response({
            'success': True,
            'origin': origin,
            'destination': destination,
            'departure_date': departure_date.isoformat(),
            'return_date': return_date.isoformat() if return_date else None,
            'currency': currency,
            'flights_count': len(flights),
            'cheapest_price': cheapest['price'] if cheapest else None,
            'flights': flights,
            'data_source': flights[0]['data_source'] if flights else 'none',
            'api_configured': api_status['configured'],
            'aviasales_link': f"https://www.aviasales.uz/search/{origin}{departure_date.strftime('%d%m')}{destination}1"
        })


class FlightPriceCalendarView(APIView):
    """
    Oylik narxlar kalendarini olish

    GET /api/flights/calendar/?origin=TAS&destination=IST&month=2024-03

    Bu API Aviasales.uz dan butun oy uchun eng arzon narxlarni oladi.
    """

    def get(self, request):
        origin = request.query_params.get('origin', '').upper()
        destination = request.query_params.get('destination', '').upper()
        month = request.query_params.get('month')  # Format: YYYY-MM

        if not origin or not destination:
            return Response(
                {'error': 'origin va destination parametrlari majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not month:
            # Joriy oy
            month = date.today().strftime('%Y-%m')

        # Kalendar narxlarini olish
        prices = travelpayouts_api.get_prices_calendar(origin, destination, month)

        return Response({
            'success': True,
            'origin': origin,
            'destination': destination,
            'month': month,
            'prices': prices,
            'cheapest_date': min(prices.items(), key=lambda x: x[1])[0] if prices else None,
            'cheapest_price': min(prices.values()) if prices else None,
        })


class LiveHotelPricesView(APIView):
    """
    Booking.com dan real vaqtda mehmonxona narxlarini olish

    GET /api/hotels/live/?city=Istanbul&checkin=2025-01-15&checkout=2025-01-22&stars=3
    """

    def get(self, request):
        city = request.query_params.get('city', '')
        checkin_str = request.query_params.get('checkin')
        checkout_str = request.query_params.get('checkout')
        stars = int(request.query_params.get('stars', 3))
        refresh = request.query_params.get('refresh', 'false').lower() == 'true'

        if not city:
            return Response(
                {'error': 'city parametri majburiy'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Sanalarni parse qilish
        try:
            if checkin_str:
                checkin_date = datetime.strptime(checkin_str, '%Y-%m-%d').date()
            else:
                checkin_date = date.today() + timedelta(days=7)

            if checkout_str:
                checkout_date = datetime.strptime(checkout_str, '%Y-%m-%d').date()
            else:
                checkout_date = checkin_date + timedelta(days=7)
        except ValueError:
            return Response(
                {'error': 'Sana formati noto\'g\'ri. To\'g\'ri format: YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mehmonxona narxlarini olish
        hotels = booking_api.search_hotels(
            city_name=city,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            min_stars=stars,
            use_cache=not refresh
        )

        # API holati
        api_status = booking_api.get_api_status()

        # Eng arzon mehmonxonani topish
        cheapest = min(hotels, key=lambda x: x['price_per_night']) if hotels else None
        nights = (checkout_date - checkin_date).days

        return Response({
            'success': True,
            'city': city,
            'checkin_date': checkin_date.isoformat(),
            'checkout_date': checkout_date.isoformat(),
            'nights': nights,
            'stars': stars,
            'hotels_count': len(hotels),
            'cheapest_per_night': cheapest['price_per_night'] if cheapest else None,
            'cheapest_total': cheapest['price_per_night'] * nights if cheapest else None,
            'hotels': hotels[:10],  # Top 10
            'api_configured': api_status['configured'],
            'booking_link': f"https://www.booking.com/searchresults.html?ss={city}&checkin={checkin_date}&checkout={checkout_date}"
        })


class APIStatusView(APIView):
    """
    API integratsiyasi holatini tekshirish

    GET /api/status/

    Bu API Travelpayouts va Booking.com integratsiyasi holatini ko'rsatadi.
    """

    def get(self, request):
        aviasales_status = travelpayouts_api.get_api_status()
        booking_status = booking_api.get_api_status()

        return Response({
            'aviasales': {
                **aviasales_status,
                'description': 'Aviasales.uz / Travelpayouts API - Parvoz narxlari',
                'register_url': 'https://www.travelpayouts.com/',
                'env_var': 'TRAVELPAYOUTS_TOKEN',
            },
            'booking': {
                **booking_status,
                'description': 'Booking.com API - Mehmonxona narxlari',
                'register_url': 'https://rapidapi.com/apidojo/api/booking-com',
                'env_var': 'RAPIDAPI_KEY',
            },
            'instructions': {
                'uz': 'API larni ishga tushirish uchun .env fayliga tokenlarni qo\'shing',
                'steps': [
                    '1. Aviasales: https://www.travelpayouts.com/ - TRAVELPAYOUTS_TOKEN',
                    '2. Booking: https://rapidapi.com/apidojo/api/booking-com - RAPIDAPI_KEY',
                    '3. backend/.env fayliga tokenlarni qo\'shing',
                    '4. Serverni qayta ishga tushiring'
                ]
            }
        })
