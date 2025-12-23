from django.contrib import admin
from .models import Person

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    # columns displayed in list view
    list_display = ('person_name', 'age', 'created_date', 'get_hobbies')
    
    # search bar configuration
    search_fields = ('person_name',)
    
    # sidebar filters
    list_filter = ('created_date',)
    
    # default ordering (newest first)
    ordering = ('-created_date',)

    # custom formatter for hobbies array
    def get_hobbies(self, obj):
        if obj.hobbies:
            return ", ".join(obj.hobbies)
        return "-"
    get_hobbies.short_description = 'Hobbies'