from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import feedparser
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import django


# Add the project root and backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))

#load the api keys from .env
load_dotenv()

# Override Django database environment variables with Crawler-specific credentials
if os.environ.get("CRAWLER_DB_USER"):
    os.environ["DB_USER"] = os.environ.get("CRAWLER_DB_USER")
    os.environ["DB_PASS"] = os.environ.get("CRAWLER_DB_PASS")
    os.environ["DB_HOST"] = os.environ.get("CRAWLER_DB_HOST", "localhost")
    os.environ["DB_NAME"] = os.environ.get("CRAWLER_DB_NAME")

# Set up Django environment using the overridden credentials
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BNC.settings')
django.setup()



rss_url = "https://www.cnbc.com/id/10001147/device/rss/rss.html"
feed = feedparser.parse(rss_url)

# Get the articles
articles = feed.entries
#dictionary for today news, for storing top 15 business news from all the news
today_news = {}

from main.models import NewsArticle

for i in articles[:15]:
    p_date = i.published_parsed
    if p_date:
        temp = datetime(*p_date[:6], tzinfo=timezone.utc)
        p_date = temp.astimezone(ZoneInfo("America/Toronto"))
    else:
        p_date = None
    
    today_news[f"{i.title}"] = [f"{i.link}", p_date]
    print(i.title, i.link)
            
for keys, value in today_news.items():
    NewsArticle.objects.create(
        title = f'{keys}',
        url = f'{value[0]}',
        date = value[1] 
    )
