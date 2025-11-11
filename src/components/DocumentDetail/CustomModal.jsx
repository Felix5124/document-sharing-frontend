const CustomModal = ({ show, onHide, title, children, footer, fullscreen = false, modalClassName = '', bodyClassName = '' }) => {
  if (!show) return null;

  return (
    <div className="custom-modal-overlay" onClick={onHide}>
      <div
        className={`custom-modal${fullscreen ? ' fullscreen' : ''} ${modalClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {fullscreen ? (
          <>
            <button type="button" className="custom-modal-close floating" onClick={onHide} aria-label="Đóng xem trước">
              &times;
            </button>
            <div
              className="custom-modal-body fullscreen-body"
              onClick={(e) => {
                // Close when clicking on empty space around the content
                if (e.target === e.currentTarget) onHide?.();
              }}
            >
              {children}
            </div>
          </>
        ) : (
          <>
            <div className="custom-modal-header">
              <h5 className="custom-modal-title">{title}</h5>
              <button type="button" className="custom-modal-close" onClick={onHide}>
                &times;
              </button>
            </div>
            <div className={`custom-modal-body ${bodyClassName}`.trim()}>{children}</div>
            {footer && <div className="custom-modal-footer">{footer}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomModal;
