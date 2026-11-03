import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Header() {
  const { user, signOut, showFlash } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    showFlash("You have been signed out.");
    navigate("/signin");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">My<span>Blog</span></Link>
        <nav>
          <NavLink to="/" end>Feed</NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className="nav-user" title="My Profile">
                <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                <span className="nav-label">{user.name}</span>
              </NavLink>
              <button type="button" className="btn btn-small btn-outline" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/signin">Sign in</NavLink>
              <Link to="/signup" className="btn btn-small">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
