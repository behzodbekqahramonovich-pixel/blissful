import django.db.models.deletion
from django.db import migrations, models

# 1-bosqichdagi City.transfer_mode -> TransportLeg.mode
MODE_MAP = {'taxi': 'car', 'bus': 'bus', 'train': 'train'}


def copy_city_transfers(apps, schema_editor):
    """City.nearest_airport/transfer_* -> TransportLeg(aeroport ↔ shahar)"""
    City = apps.get_model('destinations', 'City')
    TransportLeg = apps.get_model('destinations', 'TransportLeg')
    for city in City.objects.filter(nearest_airport__isnull=False):
        TransportLeg.objects.get_or_create(
            from_city_id=city.nearest_airport_id, to_city=city,
            mode=MODE_MAP.get(city.transfer_mode, 'car'),
            defaults={'duration_min': city.transfer_minutes,
                      'price_usd': city.transfer_price_usd, 'is_bidirectional': True},
        )


def restore_city_transfers(apps, schema_editor):
    """Orqaga: aeroport -> aeroportsiz shahar qirrasini City maydonlariga qaytarish"""
    City = apps.get_model('destinations', 'City')
    TransportLeg = apps.get_model('destinations', 'TransportLeg')
    back = {v: k for k, v in MODE_MAP.items()}
    for leg in TransportLeg.objects.filter(to_city__iata_code__isnull=True, from_city__iata_code__isnull=False).exclude(mode='plane'):
        City.objects.filter(pk=leg.to_city_id).update(
            nearest_airport_id=leg.from_city_id, transfer_mode=back[leg.mode],
            transfer_minutes=leg.duration_min, transfer_price_usd=leg.price_usd)


class Migration(migrations.Migration):

    dependencies = [
        ('destinations', '0003_city_ground_transfer'),
    ]

    operations = [
        migrations.CreateModel(
            name='TransportLeg',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mode', models.CharField(choices=[('plane', 'Samolyot'), ('train', 'Poyezd'), ('bus', 'Avtobus'), ('car', 'Avtomobil/Taksi')], max_length=10, verbose_name='Transport turi')),
                ('duration_min', models.PositiveIntegerField(verbose_name='Davomiylik (daqiqa)')),
                ('price_usd', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Narx (USD, 1 kishi)')),
                ('headway_min', models.PositiveIntegerField(default=0, verbose_name="Reyslar oralig'i (daqiqa)")),
                ('first_departure', models.TimeField(blank=True, null=True, verbose_name='Birinchi reys')),
                ('last_departure', models.TimeField(blank=True, null=True, verbose_name='Oxirgi reys')),
                ('is_bidirectional', models.BooleanField(default=True, verbose_name='Ikki tomonga')),
                ('source', models.CharField(default='admin', max_length=20, verbose_name='Manba')),
                ('link', models.URLField(blank=True, verbose_name='Havola')),
                ('is_active', models.BooleanField(default=True, verbose_name='Faol')),
                ('from_city', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='legs_out', to='destinations.city', verbose_name='Qayerdan')),
                ('to_city', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='legs_in', to='destinations.city', verbose_name='Qayerga')),
            ],
            options={
                'verbose_name': 'Transport qirrasi',
                'verbose_name_plural': 'Transport qirralari',
                'ordering': ['from_city__name_uz', 'to_city__name_uz', 'mode'],
                'unique_together': {('from_city', 'to_city', 'mode')},
            },
        ),
        migrations.RunPython(copy_city_transfers, restore_city_transfers),
    ]
