// app.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Life from "./pages/Life";
import Article from "./pages/Article";
import AdminPage from './pages/AdminPage';
import Sports from "./pages/Sports";
import Settings from "./pages/dashboard/Settings";

import SearchPage from "./pages/SearchPage"
import Contact from "./pages/Contact";
import News from "./pages/News";
import Entertainment from "./pages/Entertainment";
import SubmitAd from "./pages/SubmitAd";
import About from "./pages/About";
import EditArticle from "./pages/dashboard/EditArticle";
import ProtectedRoute from "./components/DashboardRoute";
import DashboardHome from "./pages/dashboard/DashboardHome";
import AllPosts from "./pages/dashboard/AllPosts";
import Categories from "./pages/dashboard/Categories";
import Tags from "./pages/dashboard/Tags";
import AddNewAuthor from "./pages/dashboard/AddNewUser";
import Profile from "./pages/dashboard/Profile";
import UserRoleEditor from "./pages/dashboard/UserRoleEditor";
import Library from "./pages/dashboard/Library";
import AddNewMediaFile from "./pages/dashboard/AddNewMediaFile";
import Subscribers from "./pages/dashboard/Subscribers";
import Staff from "./pages/dashboard/Staff";
import Settings from "./pages/dashboard/Settings";


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
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/all-posts" element={<AllPosts />} />
              <Route path="/dashboard/edit-article" element={<EditArticle />} />
              <Route path="/dashboard/categories" element={<Categories />} />
              <Route path="/dashboard/tags" element={<Tags />} />
              <Route path="/dashboard/subscribers" element={<Subscribers />} />
              <Route path="/dashboard/staff" element={<Staff />} />
              <Route path="/dashboard/add-new-user" element={<AddNewAuthor />} />
              <Route path="/dashboard/profile" element={<Profile />} />
              <Route path="/dashboard/user-role-editor" element={<UserRoleEditor />} />
              <Route path="/dashboard/library" element={<Library />} />
              <Route path="/dashboard/add-new-media-file" element={<AddNewMediaFile />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>
            <Route path="/sports" element={<Sports />} />

            <Route path="/search" element={<SearchPage />} />

            <Route path="/news" element={<News />} />
            <Route path="/entertainment" element={<Entertainment />}/>
            <Route path="/submit-ad" element={<SubmitAd />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App