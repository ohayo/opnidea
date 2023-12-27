import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages";
import Privacy from "./pages/privacy";
import Terms from "./pages/terms";
import Copyright from "./pages/copyright";
import Login from "./pages/login";
import Register from "./pages/register";
import Explore from "./pages/explore";
import Logout from "./pages/logout";
import Publish from "./pages/publish";
import Post from "./pages/post";
import Category from "./pages/category";
import Trending from "./pages/trending";
import Profile from "./pages/profile";
import MyCollections from "./pages/mycollections";
import Collection from "./pages/collection";
import Results from "./pages/results";
import Settings from "./pages/settings";
import Followers from "./pages/followers";
import Following from "./pages/following";
import Changelog from "./pages/changelog";
import Admin from './pages/admin';
import Statistics from './pages/adminstatistics';
import Users from './pages/adminusers';
import AdminPosts from './pages/adminposts';
import EmailVerification from "./pages/emailverification";
import ForgotPassword from "./pages/forgotpassword";
import Messages from "./pages/messages";
import Conversation from "./pages/conversation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={ <Index />} />
          <Route path="/privacy" element={ <Privacy />} />
          <Route path="/tos" element={ <Terms />} />
          <Route path="/copyright" element={ <Copyright />} />
          <Route path="/login" element={ <Login />} />
          <Route path="/logout" element={ <Logout />} />
          <Route path="/publish" element={ <Publish />} />
          <Route path="/register" element={ <Register />} />
          <Route path="/explore" element={ <Explore />} />
          <Route path="/category/:categoryName" element={ <Category />} />
          <Route path="/posts/:postId" element={ <Post />} />
          <Route path="/collections/:collectionId" element={ <Collection />} />
          <Route path="/trending" element={ <Trending />} />
          <Route path="/trending/:hashtag" element={ <Trending />} />
          <Route path="/messages/:userid" element={<Conversation/>}/>
          <Route path="/profiles/:userid" element={<Profile/>}/>
          <Route path="/profiles/:userId/following" element={<Following/>}/>
          <Route path="/profiles/:userId/followers" element={<Followers/>}/>
          <Route path="/mycollections" element={<MyCollections/>}/>
          <Route path="/messages" element={<Messages/>}/>
          <Route path="/changelog" element={<Changelog/>}/>
          <Route path="/admin" element={<Admin/>}/>
          <Route path="/admin/statistics" element={<Statistics/>}/>
          <Route path="/admin/users" element={<Users/>}/>
          <Route path="/admin/posts" element={<AdminPosts/>}/>
          <Route path="/results" element={<Results/>}/>
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
          <Route path="/settings" element={<Settings/>}/>
          <Route path="/email-verification" element={<EmailVerification/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
