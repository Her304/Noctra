import psycopg2
import feedparser
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

#load the api keys from .env
load_dotenv()
client = OpenAI()


#connect to database
conn = psycopg2.connect(
        dbname=os.environ.get("DB_NAME", "news_db"),
        user=os.environ.get("DB_USER", "hercules"),
        password=os.environ.get("DB_PASS", ""),
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432")
    )


cur = conn.cursor()

#catch the news via Google News RSS (same source newscatcher used internally)
rss_url = "https://news.google.com/rss/search?q=site:cnbc.com+business&hl=en-US&gl=US&ceid=US:en"
feed = feedparser.parse(rss_url)

# Get the articles
articles = feed.entries

#dictionary for today news, for storing top 10 business news from all the news
today_news = {}

for i in articles[:10]:
    #format the date
    p_date = i.published_parsed
    if p_date:
        p_date= datetime(*p_date[:6])
    else:
        p_date= None
    today_news[f"{i.title}"] = [f"{i.link}", p_date]

    #title : [summary, full url, date]

p_news = today_news.items()

#save all the news into database
for i in p_news:
    title = i[0]
    url=i[1][0]
    date=i[1][1]
    
    analysis_text = None
    retries = 0
    max_retries = 4

    #ask ai to gen summary and save it
    while analysis_text is None and retries < max_retries:
        #ask ai to generate the summary
        ai_response = client.responses.create(
                    model="gpt-4.1-nano",
                    input= f"Analyze this news as a business professor: {title}. Please apply as more business model as you can, including but not limited on: SWOT, key success factors, PEST, diamond-E etc. limited your each business model analysis within 300 words and divide different part of model, no any greeting words, thanks for help "
                )
        
        #abstract the text from all the data
        analysis_text = ai_response.output_text
        retries += 1
        if not analysis_text:
            print(f"analysis is not working, trying the {retries+1} times")


    #save all the info into db    
    cur.execute("""INSERT INTO news_articles (title, url, published_date, analysis) VALUES (%s, %s, %s, %s) ON CONFLICT (title) DO NOTHING""", (title, url, date, analysis_text))
    if analysis_text:
        print(f"saved:{title}")
    else:
        print(f"fail to anaylsis{title}")
        

conn.commit()
cur.close()
conn.close()

print("News articles saved to database successfully")


