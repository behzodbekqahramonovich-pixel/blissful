# Multimodal marshrut optimallashtirish — dizayn

Maqsad: Samolyot + Poyezd + Avtomobil (taksi/karsharing) + mehmonxona tunlarini bitta grafda birlashtirib, Farg'ona → Kapadokya kabi "uydan uygacha" marshrutni narx yoki vaqt bo'yicha optimallashtirish.

Hozirgi kod (`services/route_optimizer.py`) shahar → shahar parvoz grafida Dijkstra ishlatadi va 1-bosqichda aeroportsiz manzil uchun bitta transfer segmentini qo'shadi. Bu hujjat o'sha asosni kengaytiradi, yangidan yozmaydi.

## 0. Uchta qaror (nimani qilmaymiz)

1. **Tugun = shahar, aeroport/vokzal emas.** Aeroport va vokzal alohida tugun bo'lsa, graf 3 barobar kattalashadi, lekin foydalanuvchi "Toshkent vokzali → Toshkent aeroporti" ni yo'l deb o'ylamaydi. Shu almashinuv vaqtini qirra ustidagi **transfer jadvali** sifatida hisoblaymiz (3-bo'lim). Keyin kerak bo'lsa, tugunni (shahar, terminal) juftligiga bo'lish mumkin, algoritm o'zgarmaydi.
2. **Jadval (timetable) emas, chastota.** Poyezd va avtobus uchun bizda jonli jadval yo'q va yaqin orada bo'lmaydi. Har qirrada `headway_min` (ikki reys orasidagi vaqt) saqlanadi, kutilgan kutish = `headway/2`. Parvozlar uchun esa aniq sana bor (`FlightPrice.departure_date` va API). Bu "time-dependent" grafni soddalashtiradi: holat = (shahar, kun), soat emas.
3. **TSP emas, ikki marta qisqa yo'l.** Manzil bitta va ma'lum. Sayohat = `borish yo'li + manzildagi tunlar + qaytish yo'li`. Oraliq shaharda qolish (Istanbulda 2 kun) grafda "qolish" qirrasi sifatida ifodalanadi, TSP kerak emas. Agar foydalanuvchi 3+ majburiy shaharni bersa, tartib foydalanuvchi bergan tartibda bo'ladi.

## 1. Data model va graf

### 1.1 Django modellar

`City` tugun bo'lib qoladi (1-bosqichdagi `iata_code` null, `nearest_airport` saqlanadi). Yangi model — barcha yer transporti va taxminiy aviaqirralar uchun bitta jadval:

```python
class TransportLeg(models.Model):
    """Graf qirrasi: bir shahardan ikkinchisiga bitta transport turi bilan"""
    MODES = [('plane', 'Samolyot'), ('train', 'Poyezd'), ('bus', 'Avtobus'),
             ('car', 'Avtomobil/Taksi')]
    from_city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='legs_out')
    to_city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='legs_in')
    mode = models.CharField(max_length=10, choices=MODES)
    duration_min = models.IntegerField()
    price_usd = models.DecimalField(max_digits=10, decimal_places=2)
    headway_min = models.IntegerField(default=0)     # 0 = istalgan vaqtda (taksi)
    first_departure = models.TimeField(null=True)     # ixtiyoriy: kunlik birinchi reys
    last_departure = models.TimeField(null=True)
    is_bidirectional = models.BooleanField(default=True)
    source = models.CharField(max_length=20, default='admin')  # admin | api | estimate
    link = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['from_city', 'to_city', 'mode']
```

Mavjud `FlightPrice` (sanali, jonli) o'zgarmaydi. Grafni qurishda ikkalasi birlashtiriladi: bir yo'nalish uchun parvoz ham `FlightPrice`da, ham `TransportLeg`da bo'lsa, sanali `FlightPrice` ustun.

1-bosqichdagi `City.nearest_airport/transfer_*` maydonlari aslida `TransportLeg(mode='car')` ning qisqa yozuvi. Ikkinchi bosqichda ular `TransportLeg`ga migratsiya qilinadi va modeldan olib tashlanadi (data migration, ~15 qator).

`HotelPrice` o'zgarmaydi: shahar + yulduz bo'yicha kechalik narx — bu "qolish" qirrasining narxi.

### 1.2 Graf

```
G = (V, E)
V = shaharlar (City)
E = { (u, v, mode) }  har qirra: price, duration_min, headway_min, source
```

Grafning xotiradagi shakli (hozirgi `self.graph` ning kengaytmasi):

```python
Edge = namedtuple('Edge', 'to mode price duration headway source link')
graph: dict[str, list[Edge]]        # key = city.id yoki iata
```

Hozirgi kodda `self.graph[origin] = [(dest, price, duration, airline)]` — `mode='plane'` bilan `Edge`ga o'tkaziladi, qolgan kod o'zgarmaydi.

### 1.3 Qolish (stay) — qirra sifatida

Mehmonxonada N tun qolish — tugun og'irligi emas, **o'ziga qaytuvchi qirra**:

```
(city) --stay(n)--> (city)   narx = hotel_price(city, stars) * n,  vaqt = n * 24 soat
```

Nega qirra, nega tugun og'irligi emas: Dijkstra holatida vaqt bor (qaysi kunda shu shahardamiz), va qolish sana jadvaliga ta'sir qiladi — ertangi parvoz narxi boshqa. Qirra deb qarasak, algoritm o'zgarmaydi: `stay` ham oddiy qirra, faqat `to == from`.

Qolish qirralari grafga **faqat kerakli joylarda** qo'shiladi:

- manzilda: majburiy, `nights = request.nights` (bitta qirra);
- foydalanuvchi bergan oraliq shaharlarda (`stopovers`): `nights` foydalanuvchidan;
- hub shaharlarda avtomatik: `nights ∈ {0, 1}` — 0 = shu kuni ulanish, 1 = tunab qolish (kechki parvozlar uchun). Undan ko'p variant graf portlashiga olib keladi, foydasi yo'q.

### 1.4 Transfer (o'tish va kutish) vaqti

Ikki ketma-ket qirra orasida o'tish vaqti **mode juftligi**ga bog'liq, shaharga emas (3-bosqichda shaharga xos qiymat `City`ga qo'shilishi mumkin):

```python
TRANSFER_MIN = {
    ('plane', 'plane'): 120,   # bir aeroport ichida
    ('plane', 'train'): 150,   # aeroport → vokzal
    ('plane', 'car'):    45,
    ('train', 'plane'): 180,   # ro'yxatdan o'tish bilan
    ('train', 'train'):  40,
    ('car',   'plane'): 150,
    ('car',   'train'):  40,
    ('bus',   'plane'): 150,
}
DEFAULT_TRANSFER_MIN = 60
```

Kutilgan kutish: `headway_min / 2` (headway 0 bo'lsa 0). Bir qirraning to'liq vaqti:

```
leg_time = transfer(prev_mode, mode) + headway/2 + duration
```

## 2. Algoritm

### 2.1 Holat va narx

Holat: `(city, day, prev_mode)`. `day` — jo'nash sanasidan boshlab butun kun (0, 1, 2 …). Bitta kunda bir nechta qirra bo'lishi mumkin; kunlik soatlar `hours_used` sifatida holatda emas, yo'l narxida saqlanadi (quyida). Qirra vaqti 16 soatdan oshsa (kun tugadi), `day += 1`.

Optimallashtirish funksiyasi — narx va vaqtning vaznli yig'indisi:

```
score = price_total + λ * hours_total
λ = 0      → eng arzon (cheapest)
λ = 50     → muvozanatli (1 soat = $50)
λ = 500    → eng tez (fastest)
```

Uch λ bilan uch marta Dijkstra = uch xil variant. Bu hozirgi `optimal_cheap / optimal_fast / balanced` ga to'g'ri keladi va Pareto frontni taxminan beradi (k-shortest yo'l algoritmi kerak emas).

### 2.2 Python (hozirgi `RouteOptimizer` ichiga qo'shiladigan metod)

```python
import heapq
from dataclasses import dataclass, field
from datetime import timedelta

MAX_LEGS = 5            # borish yo'lida qirralar soni (qolishlar bilan)
DAY_HOURS = 16          # bir kunda sayohatga ketadigan maksimal soat

@dataclass(order=True)
class State:
    score: float
    city: str = field(compare=False)
    day: int = field(compare=False)
    prev_mode: str = field(compare=False)      # '' = boshlanish
    hours_today: float = field(compare=False)
    price: float = field(compare=False)
    hours: float = field(compare=False)
    legs: list = field(compare=False)          # [(edge, day, nights)]

def shortest_chain(self, start: str, goal: str, start_day: int, lam: float,
                   stopovers: dict[str, int], allowed_modes: set[str]) -> list | None:
    """
    Vaznli Dijkstra: score = price + lam * hours.
    stopovers = {city: nights} — majburiy qolishlar (manzil o'zi bundan tashqari).
    Qaytadi: legs ro'yxati yoki None.
    """
    must_visit = set(stopovers)
    heap = [State(0.0, start, start_day, '', 0.0, 0.0, 0.0, [])]
    best = {}   # (city, day, prev_mode, visited_frozenset) -> score

    while heap:
        s = heapq.heappop(heap)
        visited = frozenset(l[0].to for l in s.legs if l[2] > 0)   # tunab qolingan shaharlar
        key = (s.city, s.day, s.prev_mode, visited)
        if key in best and best[key] <= s.score:
            continue
        best[key] = s.score

        if s.city == goal and must_visit <= visited:
            return s.legs
        if len(s.legs) >= MAX_LEGS:
            continue

        # 1) Tunab qolish qirrasi (manzildan tashqari, chunki manzildagi tunlar alohida)
        if s.city != goal and s.city != start:
            for nights in self._stay_options(s.city, stopovers):
                hotel = float(self._get_hotel_cost(s.city, nights))
                leg = Edge(to=s.city, mode='stay', price=hotel, duration=nights * 24 * 60,
                           headway=0, source='hotel', link='')
                heapq.heappush(heap, State(
                    score=s.score + hotel + lam * 0,          # qolish vaqti jarima emas
                    city=s.city, day=s.day + nights, prev_mode='',
                    hours_today=0.0, price=s.price + hotel, hours=s.hours,
                    legs=s.legs + [(leg, s.day, nights)]))

        # 2) Transport qirralari
        for e in self.graph.get(s.city, []):
            if e.mode not in allowed_modes:
                continue
            price = self._price_on_day(e, s.day)           # FlightPrice sanali bo'lsa shu kun narxi
            if price is None:
                continue
            transfer = TRANSFER_MIN.get((s.prev_mode, e.mode), DEFAULT_TRANSFER_MIN) if s.prev_mode else 0
            wait = e.headway / 2
            leg_hours = (transfer + wait + e.duration) / 60
            hours_today = s.hours_today + leg_hours
            day = s.day
            if hours_today > DAY_HOURS:                       # kun tugadi, ertaga davom
                day += 1
                hours_today = leg_hours
            total_price = s.price + price * self.travelers
            total_hours = s.hours + leg_hours
            heapq.heappush(heap, State(
                score=total_price + lam * total_hours,
                city=e.to, day=day, prev_mode=e.mode,
                hours_today=hours_today, price=total_price, hours=total_hours,
                legs=s.legs + [(e, s.day, 0)]))
    return None

def _stay_options(self, city: str, stopovers: dict) -> list[int]:
    if city in stopovers:
        return [stopovers[city]]           # majburiy: aynan shuncha tun
    if self.cities[city].is_hub:
        return [1]                         # hubda tunab o'tish varianti
    return []

def _price_on_day(self, e, day: int):
    """Sanali parvoz bo'lsa shu kunning narxi, yo'q bo'lsa qirraning doimiy narxi"""
    if e.mode != 'plane':
        return e.price
    date = self.departure_date + timedelta(days=day)
    return self._flight_price_for_date(e, date) or e.price
```

To'liq sayohat:

```python
def find_optimal_trip(self, req):
    variants = []
    for name, lam in (('cheapest', 0), ('balanced', 50), ('fastest', 500)):
        out = self.shortest_chain(req.origin, req.destination, 0, lam,
                                  req.stopovers_out, req.modes)
        if not out:
            continue
        arrive_day = out[-1][1] + 1 if out else 0
        stay_day = arrive_day + req.nights
        back = self.shortest_chain(req.destination, req.origin, stay_day, lam,
                                   req.stopovers_back, req.modes)
        if not back:
            continue
        hotel = float(self._get_hotel_cost(req.destination, req.nights))
        variants.append(self._assemble(name, out, req.nights, hotel, back))
    return self._dedupe_and_score(variants)
```

### 2.3 Murakkablik va chegaralar

- Holatlar soni ≈ |V| × kunlar × modlar × 2^|stopovers|. 150 shahar, 14 kun, 4 mod, 2 stopover → ~34 ming holat, Dijkstra millisekundlarda. `MAX_LEGS=5` portlashni to'xtatadi.
- Jonli narx olish (Travelpayouts) qirra ichida chaqirilmaydi — hozirgidek `_prefetch_flight_prices_parallel` oldindan oladi, graf faqat xotiradan o'qiydi.
- Qaytish yo'li alohida Dijkstra, shuning uchun "boshqa transport kombinatsiyasi" o'zi chiqadi.

### 2.4 Misol: Farg'ona → Kapadokya

Kerakli ma'lumot (admin kiritadi, 5 qator):

| from | to | mode | min | $ | headway |
|---|---|---|---|---|---|
| FEG (Farg'ona) | TAS | train | 270 | 8 | 360 |
| FEG | TAS | car | 300 | 25 | 0 |
| IST | ASR (Kayseri) | plane | 80 | 45 | (FlightPrice/API) |
| IST | Kapadokya | bus | 660 | 20 | 120 |
| ASR | Kapadokya (Göreme) | car | 75 | 30 | 0 |

`cheapest` (λ=0): FEG→TAS poyezd $8 · TAS→IST parvoz · IST→Kapadokya avtobus $20 · 4 tun · qaytish teskari.
`fastest` (λ=500): FEG→TAS taksi · TAS→IST · IST→ASR parvoz · ASR→Göreme taksi.

## 3. API

### 3.1 So'rov — `POST /api/v1/search/`

Mavjud endpoint kengayadi, eski maydonlar ishlayveradi:

```json
{
  "origin": "FEG",
  "destination": "goreme",
  "departure_date": "2026-05-10",
  "return_date": "2026-05-17",
  "travelers": 2,
  "hotel_stars": 3,
  "optimization_mode": "balanced",
  "modes": ["plane", "train", "car", "bus"],
  "stopovers": {
    "outbound": [{"city": "IST", "nights": 2}],
    "return": []
  },
  "budget_max": 1500,
  "max_legs": 5
}
```

- `origin`/`destination`: IATA kodi yoki shahar `slug`/`id` (aeroportsiz shaharlar uchun).
- `modes`: ruxsat etilgan transport turlari; bo'lmasa hammasi.
- `stopovers`: majburiy oraliq qolishlar, tartib foydalanuvchiniki.
- `return_date` − `departure_date` − barcha stopover tunlari = manzildagi tunlar; manfiy chiqsa 400.

### 3.2 Javob

```json
{
  "search_id": 158,
  "variants": [
    {
      "id": 641,
      "kind": "balanced",
      "is_recommended": true,
      "totals": {
        "price_usd": 1312.00,
        "transport_usd": 862.00,
        "hotel_usd": 450.00,
        "travel_hours": 19.5,
        "trip_days": 7,
        "legs": 7,
        "transfers": 3
      },
      "outbound": [
        {"type": "transport", "mode": "train", "from": "FEG", "from_name": "Farg'ona",
         "to": "TAS", "to_name": "Toshkent", "day": 0, "duration_min": 270,
         "wait_min": 180, "transfer_min": 0, "price_usd": 16.00, "source": "admin", "link": ""},
        {"type": "transport", "mode": "plane", "from": "TAS", "to": "IST", "day": 0,
         "duration_min": 270, "wait_min": 0, "transfer_min": 180, "price_usd": 460.00,
         "airline": "Turkish Airlines", "source": "travelpayouts_api",
         "link": "https://www.aviasales.uz/search/TAS1005IST2"},
        {"type": "stay", "city": "IST", "city_name": "Istanbul", "day": 1, "nights": 2,
         "stars": 3, "price_per_night_usd": 55.00, "price_usd": 110.00},
        {"type": "transport", "mode": "bus", "from": "IST", "to": "goreme", "day": 3,
         "duration_min": 660, "wait_min": 60, "transfer_min": 150, "price_usd": 40.00}
      ],
      "stay": {"city": "goreme", "city_name": "Göreme (Kapadokya)", "nights": 4,
               "stars": 3, "price_usd": 340.00},
      "return": [
        {"type": "transport", "mode": "car", "from": "goreme", "to": "ASR", "day": 7, "...": "..."},
        {"type": "transport", "mode": "plane", "from": "ASR", "to": "IST", "day": 7, "...": "..."},
        {"type": "transport", "mode": "plane", "from": "IST", "to": "TAS", "day": 7, "...": "..."},
        {"type": "transport", "mode": "car", "from": "TAS", "to": "FEG", "day": 8, "...": "..."}
      ],
      "warnings": ["IST→goreme avtobus narxi taxminiy (admin kiritgan), jonli emas"]
    }
  ],
  "recommended_id": 641
}
```

Hozirgi `details.segments` o'rniga `outbound / stay / return` uch qism; `type: "stay"` elementlari ro'yxat ichida, shuning uchun frontend bitta ro'yxatni ketma-ket chizadi. `day` — jo'nash kunidan nisbiy; aniq soat yo'q, chunki jadval yo'q (0-bo'lim, 2-qaror).

## 4. Bosqichlar

| # | Ish | Hajm |
|---|---|---|
| 1 (bajarildi) | Aeroportsiz manzil, bitta transfer | — |
| 2 (bajarildi) | `TransportLeg` modeli + admin CRUD; 1-bosqich maydonlarini unga ko'chirish (migratsiya 0004–0005, admin: `/api/v1/admin/transport/`, panel: Transport) | — |
| 3 (bajarildi) | `shortest_chain` + `_build_trip`; eski `_dijkstra_*`, `_find_direct/_transit/_multi_city`, `_get_flight_info`, `_add_ground_transfer` o'chirildi (1470 → 1031 qator). Tranzit va multi-city endi majburiy `stopovers` bilan, to'g'ridan-to'g'ri — `max_flights=1` bilan shu algoritmdan chiqadi; yangi `balanced` turi (λ=50) | — |
| 4 | So'rov/javob formati, frontend `stay` kartasi, `modes` filtri | ~150 qator |
| 5 | Hub shaharlarda avtomatik tunab o'tish, shaharga xos transfer vaqti | ~50 qator |

3-bosqich tugaganda hozirgi 1500 qatorlik `route_optimizer.py` ~900 qatorga tushadi, chunki to'rt xil "variant yasovchi" funksiya bitta Dijkstra bilan almashadi.
