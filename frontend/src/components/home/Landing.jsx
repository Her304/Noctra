export default function Landing() {
    return(
        <>
        <section className="hero-section">
            <span className="hero-eyebrow">✦ Powered by CNBC &amp; AI Analysis</span>

            <h1 className="hero-title">
                <span>Real News. Real Analysis.</span><br />Real Fast.
            </h1>

            <p className="hero-subtitle">
                Bridge the gap between the classroom and the boardroom. Get today's most important business headlines instantly
                analysed through PESTEL, Porter's Five Forces, SWOT, and more.
            </p>

            <a href="/news" className="hero-cta">
                Explore Today's News &nbsp;→
            </a>
        </section>

        {/* features */}
        <section className="features-section">
            <span className="section-label">Why Noctra</span>
            <h2 className="section-title">Strategy meets the real world</h2>

            <div className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">📰</div>
                    <h3>Live News Feed</h3>
                    <p>Top 10 business stories pulled directly from CNBC.com — updated daily, quality over quantity.</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🎓</div>
                    <h3>Academic Frameworks</h3>
                    <p>Every story is broken down through PESTEL, SWOT, Porter's Five Forces, Diamond-E, and More.</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Instant AI Analysis</h3>
                    <p>Our AI translates complex market shifts into clear, structured, professor-approved strategy language.</p>
                </div>
            </div>
        </section>

        {/* about */}
        <section className="about-section">
            <div className="about-inner">
                <span className="section-label">About the platform</span>
                <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>What is Noctra?</h2>

                <p>
                    In today's fast-moving business world, staying informed is only half the battle. The real challenge lies in
                    making sense of the news through the strategic frameworks you're studying in class — PESTEL, SWOT, Porter's
                    Diamond, VRIO, Five Forces, or the Diamond-E framework. These powerful tools often feel disconnected from
                    the headlines you read every day. That's where Noctra changes the game.
                </p>

                <p>
                    We bridge the gap between the classroom and the boardroom by delivering the day's most important business
                    news straight from CNBC.com and immediately applying a "Professor's Lens" to every story. No more scrambling
                    to manually connect real-world events to academic models. Our platform automatically breaks down each
                    article using the exact strategic frameworks you need to master for assignments, case studies, exams, and
                    future careers.
                </p>

                <p>
                    Imagine opening the site and finding the latest merger, tariff announcement, supply chain disruption, or
                    tech regulation already dissected through PESTEL factors. See how a new competitive move fits into Porter's
                    Five Forces. Understand a company's strategic positioning through SWOT or Diamond-E integration — all in
                    clear, structured, professor-approved format.
                </p>

                <p>
                    Powered by reliable, up-to-the-minute data from CNBC.com, every insight is grounded in credible reporting.
                    Whether you're an undergraduate wrestling with your first PESTEL assignment, an MBA student tackling complex
                    case competitions, or a professional looking to sharpen your strategic lens — Noctra empowers
                    you to move beyond passive reading.
                </p>


                <span className="coming-soon-banner">🚀 &nbsp;More features coming soon!</span>
            </div>
        </section>
        </>
    );
}