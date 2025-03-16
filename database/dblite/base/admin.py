from django.contrib import admin

# Register your models here.

from .models import Exam, Component, QuestionBank, BankPage, Material, Question

admin.site.register(Exam)
admin.site.register(Component)
admin.site.register(QuestionBank)
admin.site.register(BankPage)
admin.site.register(Material)
admin.site.register(Question)