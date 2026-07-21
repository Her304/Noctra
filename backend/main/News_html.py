
from zoneinfo import ZoneInfo
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import django
import trafilatura
from openai import OpenAI



# Add the project root and backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))

#load the api keys from .env
load_dotenv()
client = OpenAI()

# Override Django database environment variables with Crawler-specific credentials
if os.environ.get("CRAWLER_DB_USER"):
    db_user = os.environ.get("CRAWLER_DB_USER")
    db_pass = os.environ.get("CRAWLER_DB_PASS")
    db_host = os.environ.get("CRAWLER_DB_HOST") or "localhost"
    db_name = os.environ.get("CRAWLER_DB_NAME")
    
    os.environ["DB_USER"] = db_user
    os.environ["DB_PASS"] = db_pass
    os.environ["DB_HOST"] = db_host
    os.environ["DB_NAME"] = db_name
    # Set DATABASE_URL to suppress dj-database-url warning
    os.environ["DATABASE_URL"] = f"postgres://{db_user}:{db_pass}@{db_host}:5432/{db_name}"

# Set up Django environment using the overridden credentials
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BNC.settings')
django.setup()

from main.models import NewsArticle
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q

temp = timezone.now()
date = temp.astimezone(ZoneInfo("America/Toronto"))
last_24_hours = date - timedelta(hours=24)

# 2. Generate analysis if summary is missing and content is available
def ai_analysis(content, article):
    if content and (not article.summary):
        print(f"  Running AI analysis for: {article.title}")
        query = f"""
                    Analyze the following news article and provide a structured business analysis as the senior business analyst at Goldman Sachs and J.P. Morgan.

                    ARTICLE TITLE: {article.title}
                    ARTICLE CONTENT: {content}

                    Please provide the following analysis in valid JSON format:
                    1. SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats.
                    2. PEST Analysis: Political, Economic, Social, and Technological factors.
                    3. Diamond-E Analysis: Strategy, Resources, Management Preferences, Organization, and Environment.
                    4. Executive Summary: A 2-sentence summary of why this news matters.

                    Output strictly in JSON format.
                    """
                    
        # Using standard chat completions API
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=[
                        {"role": "system", "content": "You are a senior business analyst."},
                        {"role": "user", "content": query}
                    ],
                    response_format={ "type": "json_object" }
            )
        analysis = response.choices[0].message.content
    return analysis

def fetch_html(last_24_hours):
    # Process articles from the last 24 hours where content OR summary is missing
    articles = NewsArticle.objects.filter(date__gte=last_24_hours).filter(
        Q(content__isnull=True) | Q(content="") | Q(summary__isnull=True) | Q(summary="")
    )
    count = articles.count()
    if not count:
        print("No new articles to process.")
        return

    print(f"Processing {count} articles for content extraction or AI analysis...")
    
    for article in articles:
        print(f"Processing: {article.title}")
        try:
            content = article.content
            new_content = None
            analysis = None
            limit = 5
            
            # 1. Fetch content if missing
            if not content:
                print(f"  Fetching HTML for: {article.url}")
                downloaded = trafilatura.fetch_url(article.url)
                if downloaded:
                    new_content = trafilatura.extract(downloaded)                    
                else:
                    print(f"  [ERROR] Failed to download {article.url}")

            final_content = new_content or content

            while limit > 0 and (analysis is None and final_content):
                analysis = ai_analysis(final_content, article)
                limit-=1
   
            if final_content and analysis:
                article.summary = analysis
                article.content = final_content
                article.save(update_fields=["summary", "content"])
                print(f"  [SUCCESS] Analysis saved.")
                print(f"  [SUCCESS] Content saved.")
            else:
                print(f"  error on save the content or analysis on  {article.url}")
            
            
        except Exception as e:
            print(f"  [CRITICAL ERROR] Failed to process {article.title}: {e}")


if __name__ == "__main__":
    fetch_html(last_24_hours)


