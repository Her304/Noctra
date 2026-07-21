export default function Footer() {
    return(
        <>
        <div className="container text-center">

            <div className="footer-logo mb-2">
                <a href="/">
                    <h2 className="google-sans-flex-title">Noctra</h2>
                </a>
                <p className="footer-tagline">Real News. Real Analysis. Real Fast.</p>
            </div>

            <hr className="footer-divider" />

            <ul className="footer-links list-inline mb-3">
                <li className="list-inline-item"><a href="/">Home</a></li>
                <li className="list-inline-item"><a href="/Apercu">Apercu</a></li>
                <li className="list-inline-item"><a href="https://buymeacoffee.com/hercules21" target="_blank"
                        rel="noopener">Buy me a coffee ☕</a></li>
            </ul>

            <div className="footer-social mb-3">
                <p className="social-title mb-2">Stay in touch</p>
                <div className="footer-social-icons">
                    <a href="https://github.com/Her304" target="_blank" rel="noopener" title="GitHub">
                        <i className="fa-brands fa-github"></i>
                    </a>
                    <a href="https://www.linkedin.com/in/chin-wong-24681b392" target="_blank" rel="noopener"
                        title="LinkedIn">
                        <i className="fa-brands fa-linkedin-in"></i>
                    </a>
                </div>
            </div>

        </div>
        </>
    )
}