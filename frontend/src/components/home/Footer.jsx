export default function Footer() {
    return(
        <>
        <div class="container text-center">

            <div class="footer-logo mb-2">
                <a href="/">
                    <h2 class="google-sans-flex-title">Noctra</h2>
                </a>
                <p class="footer-tagline">Real News. Real Analysis. Real Fast.</p>
            </div>

            <hr class="footer-divider" />

            <ul class="footer-links list-inline mb-3">
                <li class="list-inline-item"><a href="/">Home</a></li>
                <li class="list-inline-item"><a href="/news">News Analysis</a></li>
                <li class="list-inline-item"><a href="https://buymeacoffee.com/hercules21" target="_blank"
                        rel="noopener">Buy me a coffee ☕</a></li>
            </ul>

            <div class="footer-social mb-3">
                <p class="social-title mb-2">Stay in touch</p>
                <div class="footer-social-icons">
                    <a href="https://github.com/Her304" target="_blank" rel="noopener" title="GitHub">
                        <i class="fa-brands fa-github"></i>
                    </a>
                    <a href="https://www.linkedin.com/in/chin-wong-24681b392" target="_blank" rel="noopener"
                        title="LinkedIn">
                        <i class="fa-brands fa-linkedin-in"></i>
                    </a>
                </div>
            </div>

        </div>
        </>
    )
}