import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Life from "./pages/Life";
import Article from "./pages/Article";
import AdminPage from './pages/AdminPage';
import Sports from "./pages/Sports";
import SearchPage from "./pages/SearchPage";
import Contact from "./pages/Contact";
import News from "./pages/News";
import Entertainment from "./pages/Entertainment";
import SubmitAd from "./pages/SubmitAd";
import About from "./pages/About";

// Dashboard components
import DashboardBaseLayout from "./components/DashboardBaseLayout";
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
import EditArticle from "./pages/dashboard/EditArticle";

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


          {/* Dashboard routes with BaseLayout */}
          <Route path="/dashboard" element={
            <DashboardBaseLayout>
              <DashboardHome />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/all-posts" element={
            <DashboardBaseLayout>
              <AllPosts />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/edit-article" element={
            <DashboardBaseLayout>
              <EditArticle />
            </DashboardBaseLayout>
          } />
          {/* Add all other dashboard routes in the same pattern */}
          <Route path="/dashboard/categories" element={
            <DashboardBaseLayout>
              <Categories />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/tags" element={
            <DashboardBaseLayout>
              <Tags />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/subscribers" element={
            <DashboardBaseLayout>
              <Subscribers />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/staff" element={
            <DashboardBaseLayout>
              <Staff />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/add-new-user" element={
            <DashboardBaseLayout>
              <AddNewAuthor />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/profile" element={
            <DashboardBaseLayout>
              <Profile />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/user-role-editor" element={
            <DashboardBaseLayout>
              <UserRoleEditor />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/library" element={
            <DashboardBaseLayout>
              <Library />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/add-new-media-file" element={
            <DashboardBaseLayout>
              <AddNewMediaFile />
            </DashboardBaseLayout>
          } />
          <Route path="/dashboard/settings" element={
            <DashboardBaseLayout>
              <Settings />
            </DashboardBaseLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;