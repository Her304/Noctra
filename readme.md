# Noctra

**Noctra** is a web application designed to help users efficiently discover, collect, and analyze the latest business news headlines. By integrating real-time news aggregation with AI-powered analysis (SWOT, PEST, etc.), it transforms raw news data into concise, actionable intelligence using Django and OpenAI.

## Features
- **AI-powered Analysis** — Automatically analyzes business headlines using OpenAI's models to provide SWOT, PEST, and Diamond-E analyses.
- **Real-time News Aggregation** — Fetches the latest business headlines via Google News RSS for specific sources like CNBC.
- **Clean Interface** — Simple and responsive web interface built with Django to browse and view analyzed news.
- **Dockerized Setup** — Easy deployment using Docker and Docker Compose.

## Technology Stack

| Layer          | Technology              | Purpose                              |
|----------------|-------------------------|--------------------------------------|
| **Backend**    | Python 3.12             | Core logic and data processing       |
| **Web Framework**| Django 6.0              | Web interface and ORM                 |
| **Database**   | PostgreSQL 15           | Persistent storage for articles      |
| **News Collection**| Feedparser, BeautifulSoup4 | Fetching and parsing RSS feeds    |
| **AI Analysis**| OpenAI API              | Generating business model insights    |
| **Deployment** | Docker & Docker Compose | Containerization and orchestration   |

## Project Structure

- `BNC/`: The main Django project directory.
    - `BNC/`: Project configuration (settings, URLs).
    - `main/`: Primary app containing views, models, and templates.
- `News-catch.py`: The standalone crawler script that fetches news and runs AI analysis.
- `Dockerfile` & `docker-compose.yml`: Configuration for containerized deployment.
- `requirements.txt`: Python package dependencies.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- OpenAI API Key

### Running with Docker (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Her304/noctra.git
    cd noctra
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_openai_api_key_here
    ```

3.  **Start the services:**
    ```bash
    docker compose up --build
    ```
    This will start the PostgreSQL database, the Django web server (at `http://localhost:8000`), and run the news crawler.

### Manual Installation (Development)

1.  **Set up a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

2.  **Set Environment Variables:**
    Ensure `DATABASE_URL` and `OPENAI_API_KEY` are set in your environment or `.env` file.

3.  **Run Migrations & Server:**
    ```bash
    python BNC/manage.py migrate
    python BNC/manage.py runserver
    ```

4.  **Run the Crawler:**
    ```bash
    python News-catch.py
    ```

## Acknowledgments
- **Google News RSS** — Reliable tool for providing news feeds.
- **CNBC** — Reliable source for news feeds.
- **OpenAI** — For providing powerful language models.
- **Django** — For the robust web framework.

# Websites Link:
https://noc-tra.cc/
