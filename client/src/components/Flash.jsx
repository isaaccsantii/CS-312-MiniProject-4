import { useAuth } from "../AuthContext.jsx";

// One-time success/error banner shown at the top of the page.
export default function Flash() {
  const { flash, clearFlash } = useAuth();
  if (!flash) return null;
  return (
    <div className={`flash flash-${flash.type}`} role="status" key={flash.id}>
      <span>{flash.message}</span>
      <button type="button" className="flash-close" onClick={clearFlash} aria-label="Dismiss">×</button>
    </div>
  );
}
