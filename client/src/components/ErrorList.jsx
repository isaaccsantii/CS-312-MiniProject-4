// React version of views/partials/errors.ejs
export default function ErrorList({ errors }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="alert" role="alert">
      <ul>
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
