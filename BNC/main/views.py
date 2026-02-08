from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
import psycopg2

def home(response):
    return render(response, "home.html",{})

def news(response):
    conn = psycopg2.connect(
        dbname="news_db",
        user="hercules",
        password="",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    cur.execute("SELECT * FROM news_articles ORDER BY published_date DESC")
    rows = cur.fetchall()

    today_news = {}
    for i in rows:
        title = i[1]
        summary = i[2]
        url = i[3]
        date = i[4]

        today_news[title] = [summary, url, date]
    
    return render(response, "news.html", {"today_news":today_news})


