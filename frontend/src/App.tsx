import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Navbar from "./components/Navbar";
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';

function App() {

  return (
    <Router>
      <div>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news/:id" element={<Article />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App