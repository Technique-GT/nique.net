
// app.tsx

import { Suspense, lazy } from "react";
// import ReactGA from 'react-ga4';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Spinner from "./components/Spinner";
import DataPrefetcher from "./components/DataPrefetcher";
import Footer from "./components/Footer";
import Seo from "./components/Seo";

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

function RouteSeo() {
  const location = useLocation();
  const path = location.pathname;

  const routeMeta: Record<string, { title: string; description: string }> = {
    "/": {
      title: "The South's Liveliest College Newspaper",
      description:
        "Technique is Georgia Tech's independent student newspaper covering campus news, life, sports, entertainment, and opinion.",
    },
    "/news": {
      title: "News",
      description: "Campus and local coverage from Georgia Tech's student newspaper.",
    },
    "/life": {
      title: "Life",
      description: "Life at Georgia Tech: events, organizations, features, and student stories.",
    },
    "/opinions": {
      title: "Opinions",
      description: "Editorials, op-eds, and letters from the Georgia Tech community.",
    },
    "/entertainment": {
      title: "Entertainment",
      description: "Music, film, arts, and entertainment coverage from Technique.",
    },
    "/sports": {
      title: "Sports",
      description: "Georgia Tech and Atlanta sports coverage from Technique.",
    },
    "/about": {
      title: "About",
      description: "Learn about Technique, Georgia Tech's independent student newspaper since 1911.",
    },
    "/contact": {
      title: "Contact",
      description: "Contact editors and staff at Technique.",
    },
    "/submit-ad": {
      title: "Submit an Ad",
      description: "Advertising information and media kit for Technique.",
    },
    "/search": {
      title: "Search",
      description: "Search Technique articles by keyword.",
    },
  };

  const meta = routeMeta[path];
  if (!meta) {
    return null;
  }

  return (
    <Seo
      title={meta.title}
      description={meta.description}
      canonicalPath={path}
      noindex={path === "/search"}
    />
  );
}


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
      <RouteSeo />
      <DataPrefetcher />
      <div className="App min-h-screen flex flex-col">
        <div className="flex-1">
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
        <Footer />
      </div>
    </Router>
  );
}

export default App;
