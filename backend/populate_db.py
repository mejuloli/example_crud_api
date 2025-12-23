import os
import random
import django
from datetime import timedelta
from django.utils import timezone

# setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') 
django.setup()

from django.apps import apps

# retrieve model dynamically
try:
    Person = apps.get_model('app', 'Person') 
except LookupError:
    try:
        Person = apps.get_model('api', 'Person')
    except LookupError:
        print("ERROR: Model 'Person' not found. Check app label.")
        exit()

print(f"Using model: {Person}")

# clean realistic names
names = [
    "Carlos Silva", "Ana Souza", "Roberto Oliveira", 
    "Julia Santos", "Marcos Pereira", "Fernanda Lima", 
    "Lucas Costa", "Beatriz Almeida"
]

hobbies_list = ["reading", "soccer", "chess", "gardening", "cooking", "gaming", "music"]

print("Generating clean mock data...")

for i in range(5):
    days_ago = random.randint(30, 365) 
    
    # create record with clean name
    chosen_name = random.choice(names)
    
    p = Person.objects.create(
        person_name=chosen_name,
        age=random.randint(20, 80),
        hobbies=[random.choice(hobbies_list)]
    )
    
    # set past date
    old_date = timezone.now() - timedelta(days=days_ago)
    Person.objects.filter(id=p.id).update(created_date=old_date)
    
    print(f" -> Created: {p.person_name} | Date: {old_date.strftime('%d/%m/%Y')}")

print("✅ Success! Mock data inserted.")