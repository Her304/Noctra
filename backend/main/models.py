from django.db import models


class NewsArticle(models.Model):
    title = models.TextField(unique=True)
    url = models.URLField(max_length=1000, blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    domain = models.TextField(blank=True, null=True) # Matches your new column

    class Meta:
        db_table = '"news"."apercu"'

    def __str__(self):
        return self.title
