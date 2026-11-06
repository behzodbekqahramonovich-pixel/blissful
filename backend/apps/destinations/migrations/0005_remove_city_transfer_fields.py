from django.db import migrations


class Migration(migrations.Migration):
    """Transfer ma'lumoti endi TransportLeg'da (0004), City maydonlari kerak emas.
    Alohida migratsiya: PostgreSQL'da bitta tranzaksiyada data + ALTER TABLE muammo beradi."""

    dependencies = [
        ('destinations', '0004_transportleg'),
    ]

    operations = [
        migrations.RemoveField(model_name='city', name='nearest_airport'),
        migrations.RemoveField(model_name='city', name='transfer_minutes'),
        migrations.RemoveField(model_name='city', name='transfer_mode'),
        migrations.RemoveField(model_name='city', name='transfer_price_usd'),
    ]
