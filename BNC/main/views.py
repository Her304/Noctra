from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
import psycopg2
import markdown


def home(response):
    return render(response, "home.html",{})

def news(response):
    #connect to the database
    import os
    db_url = os.environ.get("DATABASE_URL", "")
    # Parse DATABASE_URL (postgres://user:pass@host:port/dbname)
    import urllib.parse
    url = urllib.parse.urlparse(db_url)
    conn = psycopg2.connect(
        dbname=url.path.lstrip("/"),
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port or 5432,
    )
    cur = conn.cursor()

    #get all th info from database
    cur.execute("SELECT title, url, published_date, analysis FROM news_articles ORDER BY published_date DESC")
    rows = cur.fetchall()

    today_news = {}
    for i in rows:
        title = i[0]
        url = i[1]
        date = i[2]
        analysis_text = i[3]

        #change the markdown text into html text
        if analysis_text:
            html_analysis = markdown.markdown(analysis_text)
        else:
            html_analysis = "We apologise for missing the analysis"

        today_news[title] = [url, date, html_analysis]
    
    cur.close()
    conn.close()
    
    return render(response, "news.html", {"today_news":today_news})

def error_404(request, exception):
    return render(request, "404.html", status=404)



