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

from main.models import NewsArticle

def fetch_gdelt_events(query, limit, max_retries=3):
    # The DOC API returns articles matching your keywords
    api_url = "https://api.gdeltproject.org/api/v2/doc/doc"
    params = {
        "query": query,
        "mode": "artlist",
        "format": "json",
        "maxrecords": limit,
        "timespan": "48h",
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.get(api_url, params=params, headers=headers, timeout=15)
            
            if response.status_code == 429:
                wait_time = (attempt + 1) * 5  # Wait 5s, 10s, 15s...
                print(f"Rate limited (429). Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
                
            response.raise_for_status()
            
            # Check if response actually has content
            if not response.text.strip():
                print("GDELT API returned an empty response. This may be due to rate limiting or no results.")
                return []
                
            data = response.json()
            return data.get('articles', [])
            
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e}")
            if response.status_code != 429: # Only break if it's not a rate limit error
                break
        except requests.exceptions.JSONDecodeError:
            print("Error: Received non-JSON response from GDELT. The service might be down or returning an error page.")
            break
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            break
            
    return []

query = "(business OR market) (domain:cnbc.com OR domain:reuters.com) sourcelang:english"
limit = 20
events = fetch_gdelt_events(query, limit)

if events:
    print(f"Successfully fetched {len(events)} events.")
    
    if len(events) > 0:
        print(f"Top headline: {events[0].get('title')}")
        
    for event in events:
        try:
            # Parse Date (GDELT format: YYYYMMDDHHMMSS or YYYYMMDDTHHMMSSZ)
            raw_date = event.get('seendate')
            pub_date = None
            if raw_date:
                raw_date_str = str(raw_date)
                for fmt in ("%Y%m%d%H%M%S", "%Y%m%dT%H%M%SZ"):
                    try:
                        pub_date = datetime.strptime(raw_date_str, fmt)
                        # Make the datetime timezone-aware (UTC)
                        pub_date = timezone.make_aware(pub_date)
                        break
                    except ValueError:
                        continue
                if not pub_date:
                    print(f"Warning: Could not parse date {raw_date}")

            NewsArticle.objects.get_or_create(
                title=event.get('title'),
                defaults={
                    'url': event.get('url'),
                    'date': pub_date,
                    'domain': event.get('domain') # Saving string directly
                }
            )
        except Exception as e:
            print(f"Error saving article '{event.get('title')}': {e}")

        
    print("Articles processed successfully.")

else:
    print("No events found or error occurred.")
    