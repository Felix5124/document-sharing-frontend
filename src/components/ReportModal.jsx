import { useState } from 'react';
import { toast } from 'react-toastify';
import { createReport } from '../services/api';
import '../styles/components/ReportModal.css';

function ReportModal({ show, onHide, documentId, userId, onReportSuccess }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Vui lòng chọn lý do báo cáo.');
      return;
    }
    setLoading(true);
    try {
      await createReport({
        documentId,
        reporterUserId: userId,
        reason,
        details,
      });
      toast.success('Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét sớm nhất có thể.');
      
      // --- GỌI HÀM CALLBACK SAU KHI THÀNH CÔNG ---
      if (onReportSuccess) {
        onReportSuccess();
      }
      
      onHide(); // Đóng modal
      setReason(''); // Reset form
      setDetails('');
    } catch (error) { // --- SỬA LẠI LOGIC BẮT LỖI 409 ---
      if (error.response && error.response.status === 409) {
        toast.error('Bạn đã báo cáo tài liệu này rồi.');
        // Cũng gọi callback để đảm bảo UI đồng bộ
        if (onReportSuccess) {
          onReportSuccess();
        }
      } else {
        toast.error('Gửi báo cáo thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onHide}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h4>Báo cáo vi phạm</h4>
        <p>Bạn đang báo cáo tài liệu này. Vui lòng cho chúng tôi biết lý do.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reason">Lý do chính</label>
            <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
              <option value="">-- Chọn lý do --</option>
              <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
              <option value="Spam hoặc quảng cáo">Spam hoặc quảng cáo</option>
              <option value="Vi phạm bản quyền">Vi phạm bản quyền</option>
              <option value="Chứa mã độc/virus">Chứa mã độc/virus</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="details">Chi tiết (nếu có)</label>
            <textarea
              id="details"
              rows="4"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onHide} className="btn-cancel">Hủy</button>
            <button type="submit" className="btn-submit-report" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi Báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;