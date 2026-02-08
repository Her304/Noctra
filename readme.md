# Business News Miner (BNM)

**Business News Miner** is a web application designed to help users efficiently discover, collect, and analyze the latest business news headlines. By integrating real-time news aggregation with AI-powered summarization and insight generation, it transforms raw news data into concise, actionable intelligence.

The project demonstrates practical skills in API integration, data mining, full-stack web development, and leveraging large language models for content analysis.

## Features
- **AI-powered analysis** — Sends headlines to OpenAI's API for summarization, sentiment analysis, trend detection, and key insight extraction
- **Clean & intuitive interface** — Simple web frontend for browsing and viewing analyzed news
- **Modular architecture** — Easy to extend with additional news sources, analysis prompts, or visualization tools

## Technology Stack

| Layer          | Technology              | Purpose                              |
|----------------|-------------------------|--------------------------------------|
| Backend        | Python                  | Core logic, data processing & API integration |
| Web Framework  | Django                  | Robust MVC architecture, ORM, admin interface |
| Database       | PostgreSQL              | Reliable storage for news articles and analysis results |
| Frontend       | HTML, CSS               | Clean, responsive user interface     |
| News Collection| Newscatcher             | Python library for fetching normalized news from RSS feeds |
| AI Analysis    | OpenAI API              | Natural language processing & insight generation |

## Architecture Overview

1. **News Collection**  
   A background process (or on-demand query) uses the [Newscatcher](https://github.com/kotartemiy/newscatcher) library to gather fresh business headlines from a wide range of trusted sources.

2. **Data Processing**  
   Collected headlines are cleaned, filtered (business-focused), and prepared for analysis.

3. **AI Enrichment**  
   Headlines and summaries are sent to OpenAI's API using carefully designed prompts to generate summaries, identify key business implications, detect sentiment, or spot emerging trends.

4. **Presentation**  
   Processed insights are stored and displayed through a straightforward Django-powered web interface.

## Project Goals & Learning Outcomes

This project was built to deepen understanding in the following areas:

- Integrating third-party APIs (OpenAI + news sources)
- Building full-stack applications with Django
- Working with relational databases (PostgreSQL) in production-like settings
- Designing effective prompts for large language models
- Creating maintainable data pipelines for real-time content aggregation
- Bridging unstructured web data with structured analysis & storage

## Getting Started

### Prerequisites

- Python 3.10+
- PostgreSQL
- OpenAI API key

### Installation
# Clone the repository
git clone https://github.com/Her304/bnca.git
cd bnca

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or use .env file)
export OPENAI_API_KEY='sk-...'
export DATABASE_URL='postgresql://...'

# Apply migrations
python manage.py migrate

# Run the development server
python manage.py runserver


## Future Improvements
User authentication & personalized news feeds
Keyword/topic filtering and alerts
Visualization of trends (charts, word clouds)
Support for multiple LLMs
Caching layer for news & analysis results

### Acknowledgments
Newscatcher — Excellent Python library for news collection
OpenAI — For providing powerful language models
Django community — For a mature and reliable web framework