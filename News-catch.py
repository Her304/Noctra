import psycopg2
from newscatcher import Newscatcher
from datetime import datetime

#connect to database
conn = psycopg2.connect(
    dbname="news_db",
    user="hercules",
    password="",
    host="localhost",
    port="5432"
)

cur = conn.cursor()

#catch the news
nc = Newscatcher(website = 'cnbc.com', topic = "business")
results = nc.get_news()

# results.keys()
# 'url', 'topic', 'language', 'country', 'articles'

# Get the articles
articles = results['articles']

today_news = {}

for i in range(0,10):
    p_date = articles[i].get('published_parsed')
    if p_date:
        p_date= datetime(*p_date[:6])
    else:
        p_date= None
    today_news[f"{articles[i]['title']}"] = [f"{articles[i]['summary']}", f"{articles[i]['link']}", p_date]

#title : [summary, full url, date]

p_news = today_news.items()

for i in p_news:
    title = i[0]
    summary= i[1][0]
    url=i[1][1]
    date=i[1][2]

    cur.execute("""INSERT INTO news_articles (title, summary, url, published_date) VALUES (%s, %s, %s, %s)""", (title, summary, url, date))
    print(f"saved:{title}")

conn.commit()
cur.close()
conn.close()

print("News articles saved to database successfully")


