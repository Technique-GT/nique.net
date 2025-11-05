
// app.tsx

// import React, { useEffect } from "react";
// import ReactGA from 'react-ga4';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Life from "./pages/Life";
import Article from "./pages/Article";
import AdminPage from "./pages/AdminPage";
import Sports from "./pages/Sports";

import Opinions from "./pages/Opinions";
import SearchPage from "./pages/SearchPage";
import Contact from "./pages/Contact";
import News from "./pages/News";
import Entertainment from "./pages/Entertainment";
import SubmitAd from "./pages/SubmitAd";
import About from "./pages/About";


// const PROD_TRACKING_ID = "G-Q3NL210D85"; // replace with Technique staff tracking ID. probably want to put in .env file
// const DEV_TRACKING_ID = "G-Q3NL210D85"; // replace with personal tracking ID to not mess with real user data

// function PageTracker() {
//   const location = useLocation();

//   useEffect(() => {
//     ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
//   }, [location]);

//   return null;
// }



function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/life" element={<Life />} />
          <Route path="/:id" element={<Article />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/news" element={<News />} />
          <Route path="/entertainment" element={<Entertainment />} />
          <Route path="/submit-ad" element={<SubmitAd />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/opinions" element={<Opinions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
