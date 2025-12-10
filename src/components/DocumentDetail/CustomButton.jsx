const CustomButton = ({ variant = 'primary', size, onClick, disabled, type, children, className = '', title }) => {
  const btnClass = `custom-btn btn-${variant}${size ? ` btn-${size}` : ''} ${className}`;
  return (
    <button className={btnClass} onClick={onClick} disabled={disabled} type={type || 'button'} title={title}>
      {children}
    </button>
  );
};

export default CustomButton;
