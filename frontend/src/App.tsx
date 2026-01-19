
// app.tsx

import { Suspense, lazy } from "react";
// import ReactGA from 'react-ga4';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Spinner from "./components/Spinner";
import DataPrefetcher from "./components/DataPrefetcher";

const Home = lazy(() => import("./pages/Home"));
const Life = lazy(() => import("./pages/Life"));
const Article = lazy(() => import("./pages/Article"));
const Sports = lazy(() => import("./pages/Sports"));

const Opinions = lazy(() => import("./pages/Opinions"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Contact = lazy(() => import("./pages/Contact"));
const News = lazy(() => import("./pages/News"));
const Entertainment = lazy(() => import("./pages/Entertainment"));
const SubmitAd = lazy(() => import("./pages/SubmitAd"));
const About = lazy(() => import("./pages/About"));


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
      <DataPrefetcher />
      <div className="App">
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Spinner />
            </div>
        }>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/life" element={<Life />} />
            <Route path="/:category/:slug" element={<Article />} />
            <Route path="/:id" element={<Article />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/news" element={<News />} />
            <Route path="/entertainment" element={<Entertainment />} />
            <Route path="/submit-ad" element={<SubmitAd />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/opinions" element={<Opinions />} />
            </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
