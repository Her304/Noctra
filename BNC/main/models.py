from django.db import models


class NewsArticle(models.Model):
    title = models.TextField(unique=True)
    summary = models.TextField(blank=True, null=True)
    url = models.URLField(max_length=1000, blank=True, null=True)
    published_date = models.DateTimeField(blank=True, null=True)
    analysis = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "news_articles"  # matches the raw table name used in views.py and News-catch.py

    def __str__(self):
        return self.title
