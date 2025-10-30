const CustomForm = ({ onSubmit, className = '', children }) => {
  return (
    <form onSubmit={onSubmit} className={`custom-form ${className}`}>
      {children}
    </form>
  );
};

export const FormGroup = ({ className = '', children }) => {
  return <div className={`form-group ${className}`}>{children}</div>;
};

export const FormLabel = ({ htmlFor, children }) => {
  return (
    <label className="form-label form-max" htmlFor={htmlFor}>
      {children}
    </label>
  );
};

export const FormControl = ({ as, id, value, onChange, placeholder, rows }) => {
  if (as === 'textarea') {
    return (
      <textarea
        className="form-control"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 3}
      />
    );
  }
  return <input className="form-control" id={id} value={value} onChange={onChange} placeholder={placeholder} />;
};

export default CustomForm;
