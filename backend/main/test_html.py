import os
import sys
import json
import django
from pathlib import Path
from dotenv import load_dotenv

# Add the project root and backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))

# Load environment variables
load_dotenv()

# Override Django database environment variables with Crawler-specific credentials
if os.environ.get("CRAWLER_DB_USER"):
    os.environ["DB_USER"] = os.environ.get("CRAWLER_DB_USER")
    os.environ["DB_PASS"] = os.environ.get("CRAWLER_DB_PASS")
    os.environ["DB_HOST"] = os.environ.get("CRAWLER_DB_HOST", "localhost")
    os.environ["DB_NAME"] = os.environ.get("CRAWLER_DB_NAME")

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BNC.settings')
django.setup()

from main.models import NewsArticle

def export_articles_to_json():
    """
    Fetches processed articles from PostgreSQL and prints them in JSON format.
    """
    # Fetch articles that have content extracted
    articles = NewsArticle.objects.filter(content__isnull=False).order_by('-date')
    
    article_list = []
    for article in articles:
        article_list.append({
            "title": article.title,
            "url": article.url,
            "date": article.date.isoformat() if article.date else None,
            "domain": article.domain,
            "content": article.content,
            "summary": article.summary
        })
    
    # Print the result in pretty JSON format
    print(json.dumps(article_list, indent=4))

if __name__ == "__main__":
    export_articles_to_json()
