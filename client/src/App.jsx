import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Flash from "./components/Flash.jsx";
import HomePage from "./pages/HomePage.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

// Only signed-in users may see these pages (like requireLogin in Mini Project 3).
function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <p className="empty">Loading…</p>;
  return user ? children : <Navigate to="/signin" replace state={{ needSignIn: true }} />;
}

// Signed-in users skip the sign-in / sign-up pages (like redirectIfLoggedIn).
function GuestOnly({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <p className="empty">Loading…</p>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Flash />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<GuestOnly><SignIn /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><SignUp /></GuestOnly>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
