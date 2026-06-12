import './App.css';
import Landing from "./components/home/Landing";
import Footer from "./components/home/Footer";
import Apercu from "./components/apercu/Apercu"
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {

  return (
    <>
    <BrowserRouter>
      {/*============  NAVBAR  ============ --*/}
      <nav className="navbar navbar-expand-lg" id="main-nav">
          <a className="navbar-brand" href="/">
              <h3 className="google-sans-flex-title mb-0">Noctra</h3>
          </a>

          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ml-auto align-items-center">
                  <li className="nav-item">
                      <a className="nav-link nav-link-item outfit-bar" href="/Apercu">Apercu</a>
                  </li>
              </ul>
          </div>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <Landing />
            }>
        </Route>
        <Route
          path="/Apercu"
          element={
            <Apercu />
            }>
        </Route>
      </Routes>
      {/* footer */}
      <div className="footer-section">
        <Footer />
      </div>
    </BrowserRouter>
    </>
  )
}

export default App
