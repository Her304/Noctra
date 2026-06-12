import psycopg2
from datetime import datetime
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests
import time
import django
from django.utils import timezone
from django.db.models import Q
from bs4 import BeautifulSoup
import trafilatura
from openai import OpenAI
from django.utils import timezone

date = timezone.now()

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

sources = {}

def News_sources():
    # Articles from the last 24 hours
    last_24_hours = timezone.now() - timedelta(hours=24)
    articles = NewsArticle.objects.filter(date__gte=last_24_hours)
    
    print(f"Found {articles.count()} articles from the last 24 hours.")
    for article in articles:
        # If content already exists, store it; otherwise store the URL as a placeholder
        sources[article.title] = article.content if article.content else article.url

def fetch_html():
    # Process articles from the last 24 hours where content OR summary is missing
    last_24_hours = timezone.now() - timedelta(hours=24)
    articles = NewsArticle.objects.filter(date__gte=last_24_hours).filter(
        Q(content__isnull=True) | Q(content="") | Q(summary__isnull=True) | Q(summary="")
    )
    
    if not articles.exists():
        print("No new articles to process.")
        return

    print(f"Processing {articles.count()} articles for content extraction or AI analysis...")
    
    for article in articles:
        print(f"Processing: {article.title}")
        try:
            content = article.content
            
            # 1. Fetch content if missing
            if not content:
                print(f"  Fetching HTML for: {article.url}")
                downloaded = trafilatura.fetch_url(article.url)
                if downloaded:
                    content = trafilatura.extract(downloaded)
                    if content:
                        article.content = content
                        article.save()
                        print(f"  [SUCCESS] Content saved.")
                    else:
                        print(f"  [WARNING] Could not extract content from {article.url}")
                else:
                    print(f"  [ERROR] Failed to download {article.url}")

            # 2. Generate analysis if summary is missing and content is available
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
                if analysis:
                    article.summary = analysis
                    article.save()
                    print(f"  [SUCCESS] Analysis saved.")
                else:
                    print(f"  [ERROR] Empty AI response for {article.title}")
                    
        except Exception as e:
            print(f"  [CRITICAL ERROR] Failed to process {article.title}: {e}")
                    
        except Exception as e:
            print(f"  [CRITICAL ERROR] Failed to process {article.url}: {e}")



News_sources()
fetch_html()


