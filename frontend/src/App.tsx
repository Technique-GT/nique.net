// app.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Life from "./pages/Life";
import Article from "./pages/Article";
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';
import Sports from "./pages/Sports";

import SearchPage from "./pages/SearchPage"

import News from "./pages/News";
import Entertainment from "./pages/Entertainment";
import SubmitAd from "./pages/SubmitAd";
import About from "./pages/About";


function App() {

  return (
    <Router>
      <div>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/life" element={<Life />} />
            <Route path="/:id" element={<Article />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sports" element={<Sports />} />

            <Route path="/search" element={<SearchPage />} />

            <Route path="/news" element={<News />} />
            <Route path="/entertainment" element={<Entertainment />}/>
            <Route path="/submit-ad" element={<SubmitAd />} />
            <Route path="/about" element={<About />} />
            {/* <Route path="/contact" element={<Contact />} /> */}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App