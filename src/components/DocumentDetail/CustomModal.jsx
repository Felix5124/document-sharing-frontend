const CustomModal = ({ show, onHide, title, children, footer }) => {
  if (!show) return null;

  return (
    <div className="custom-modal-overlay" onClick={onHide}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h5 className="custom-modal-title">{title}</h5>
          <button type="button" className="custom-modal-close" onClick={onHide}>
            &times;
          </button>
        </div>
        <div className="custom-modal-body">{children}</div>
        {footer && <div className="custom-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default CustomModal;
