// React version of views/partials/post-form-fields.ejs.
// It does not hold any state itself: the parent form passes in the current
// values and the onChange handler, so the inputs stay "controlled".
export const CATEGORIES = ["Tech", "Lifestyle", "Education", "Travel", "Other"];

export default function PostFormFields({ title, body, category, onChange, idPrefix = "new" }) {
  return (
    <>
      <div className="field-row">
        <div className="field grow">
          <label htmlFor={`${idPrefix}-title`}>Title</label>
          <input
            type="text"
            id={`${idPrefix}-title`}
            name="title"
            maxLength={255}
            required
            value={title}
            onChange={onChange}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-category`}>Category</label>
          <select id={`${idPrefix}-category`} name="category" value={category} onChange={onChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-body`}>Post</label>
        <textarea id={`${idPrefix}-body`} name="body" rows={7} required value={body} onChange={onChange} />
      </div>
    </>
  );
}
