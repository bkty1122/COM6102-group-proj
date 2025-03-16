from django.db import models

# Create your models here.

class Exam(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=50)
    language = models.CharField(max_length=10)
    metadata = models.JSONField(blank=True)    #blank=True; i.e. can be empty
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Component(models.Model):
    id = models.UUIDField(primary_key=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)  #blank=False (default)
    total_questions = models.IntegerField() #blank=False (default)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class QuestionBank(models.Model):
    id = models.UUIDField(primary_key=True)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    code = models.CharField(max_length=50, unique=True)
    total_questions = models.IntegerField() #blank=False (default)

    def __str__(self):
        return self.code

class BankPage(models.Model):
    id = models.UUIDField(primary_key=True)
    question_bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE)
    page_index = models.IntegerField() #blank=False (default)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.page_index)    

class Material(models.Model):
    id = models.UUIDField(primary_key=True)
    bank_page = models.ForeignKey(BankPage, on_delete=models.CASCADE, blank=True) #blank=True; i.e. can be empty
    question = models.ForeignKey('Question', on_delete=models.CASCADE, blank=True) #blank=True; i.e. can be empty
    type = models.CharField(max_length=50)
    value = models.TextField()
    description = models.TextField(blank=True) #blank=True; i.e. can be empty
    metadata = models.JSONField(blank=True) #blank=True; i.e. can be empty
    display_order = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.type

class Question(models.Model):
    id = models.UUIDField(primary_key=True)
    bank_page = models.ForeignKey(BankPage, on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    question_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    display_order = models.IntegerField()

    def __str__(self):
        return self.type

class QuestionOption(models.Model):
    id = models.UUIDField(primary_key=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    option_label = models.CharField(max_length=10, blank=True) #blank=True; i.e. can be empty
    option_value = models.TextField()
    match_target = models.TextField(blank=True) #blank=True; i.e. can be empty
    metadata = models.JSONField(blank=True) #blank=True; i.e. can be empty

    def __str__(self):
        return self.option_value

class Answer(models.Model):
    id = models.UUIDField(primary_key=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    type = models.CharField(max_length=50)
    correct_answer = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Answer for: {self.question}'