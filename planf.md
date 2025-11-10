Chắc chắn rồi! Dựa trên mã nguồn backend đã được cập nhật và mã nguồn frontend hiện tại của bạn, đây là kế hoạch chi tiết để triển khai chức năng duyệt bán tự động trên giao diện người dùng React.

---

# Kế hoạch Chi tiết: Triển khai Frontend cho Chức năng Duyệt Bán tự động

## 1. Mục tiêu

Tích hợp các thay đổi từ backend vào giao diện người dùng React, đảm bảo các chức năng sau hoạt động trơn tru:

1.  **Hiển thị nhãn "Chưa kiểm duyệt"** cho các tài liệu ở trạng thái `SemiApproved`.
2.  **Hiển thị cảnh báo** trên trang chi tiết của các tài liệu chưa được kiểm duyệt hoàn toàn.
3.  Cung cấp chức năng để người dùng **báo cáo (report)** các tài liệu có vấn đề.
4.  Cập nhật **giao diện Quản trị** để phản ánh và quản lý hệ thống trạng thái mới.

## 2. Phân tích Tác động trên Frontend

Dựa trên codebase hiện tại, các file và components chính cần được sửa đổi hoặc tạo mới:

*   **Hiển thị Trạng thái Duyệt:**
    *   `src/pages/Home.jsx`
    *   `src/pages/SearchResultsPage.jsx`
    *   `src/pages/DocumentDetail.jsx`
    *   `src/pages/Profile.jsx` (trong danh sách "Tài liệu đã tải lên")
*   **Chức năng Báo cáo (Mới):**
    *   `src/pages/DocumentDetail.jsx` (Thêm nút và logic để mở modal báo cáo).
    *   Tạo component mới: `src/components/ReportModal.jsx` (Popup để người dùng nhập thông tin báo cáo).
    *   `src/services/api.js` (Thêm hàm gọi API để gửi báo cáo).
*   **Giao diện Quản trị:**
    *   `src/components/DocumentManagement.jsx` (Hiển thị `ApprovalStatus` thay vì `IsApproved`).
    *   `src/components/DocumentApproval.jsx` (Đảm bảo chỉ hiển thị các tài liệu `Pending`).
    *   Tạo component mới (khuyến nghị): `src/components/ReportManagement.jsx` để admin xem các báo cáo.
*   **Styling:**
    *   Cần thêm các file CSS hoặc cập nhật các file hiện có để định dạng nhãn trạng thái, modal báo cáo, và các thành phần giao diện mới khác.

## 3. Kế hoạch Chi tiết

### Bước 1: Cập nhật API Service

Thêm các hàm cần thiết vào `src/services/api.js` để tương tác với `ReportsController` mới ở backend.

```javascript
// src/services/api.js

// ... (các hàm hiện có)

// --- API cho Báo cáo Vi phạm ---
export const createReport = (data) => apiClient.post("/reports", data);

// (Tùy chọn - Dành cho trang quản trị)
export const getAllReports = () => apiClient.get("/reports");
export const updateReportStatus = (id, status) => apiClient.put(`/reports/${id}/status`, { status });
```

### Bước 2: Hiển thị Trạng thái "Chưa kiểm duyệt"

Chúng ta sẽ thêm một nhãn trực quan để người dùng dễ dàng nhận biết các tài liệu `SemiApproved`.

#### a. Cập nhật `Home.jsx` và `SearchResultsPage.jsx`

Trong các component render card tài liệu, thêm logic để hiển thị nhãn.

```jsx
// src/pages/Home.jsx (bên trong DocumentCard)
// src/pages/SearchResultsPage.jsx (bên trong mapping documents)

<div className="document-card">
  <div className="document-card-image-container">
    <Link to={`/document/${doc.documentId}`}>
      <img src={getFullImageUrl(doc.coverImageUrl)} ... />
      {/* THÊM MỚI: Nhãn trạng thái */}
      {doc.approvalStatus === 'SemiApproved' && (
        <span className="status-label semi-approved">Chưa kiểm duyệt</span>
      )}
    </Link>
  </div>
  {/* ... phần còn lại của card ... */}
</div>
```

#### b. Cập nhật `DocumentDetail.jsx`

Hiển thị một thông báo nổi bật ở đầu trang chi tiết tài liệu.

```jsx
// src/pages/DocumentDetail.jsx

import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons'; // Thêm icon

function DocumentDetail() {
  // ... (state và effects)

  return (
    <div className="document-detail-page">
      {doc && (
        <div className="document-detail-container">
          {/* THÊM MỚI: Banner thông báo */}
          {doc.approvalStatus === 'SemiApproved' && (
            <div className="status-banner semi-approved">
              <FontAwesomeIcon icon={faCircleExclamation} />
              <span>Tài liệu này đã qua kiểm tra tự động nhưng chưa được quản trị viên xác thực hoàn toàn.</span>
            </div>
          )}

          {/* ... phần còn lại của trang chi tiết ... */}
        </div>
      )}
      {/* ... */}
    </div>
  );
}
```

#### c. Cập nhật `Profile.jsx`

Trong danh sách "Tài liệu đã tải lên", thay thế trạng thái `isApproved` bằng `approvalStatus`.

```jsx
// src/pages/Profile.jsx

// ... (bên trong hàm map của `uploads`)
<li key={upload.documentId} className="stats-item-profile" ...>
  <span>
    {/* ... */}
    Trạng thái:{' '}
    {/* THAY ĐỔI LOGIC HIỂN THỊ */}
    <span className={`status-text status-${upload.approvalStatus?.toLowerCase()}`}>
      {
        {
          'Approved': 'Đã duyệt',
          'SemiApproved': 'Chưa kiểm duyệt',
          'Pending': 'Đang chờ',
          'Rejected': 'Bị từ chối'
        }[upload.approvalStatus] || 'Không xác định'
      }
    </span>
  </span>
  {/* ... */}
</li>
```

### Bước 3: Xây dựng Chức năng Báo cáo Vi phạm (Report)

#### a. Tạo Component `ReportModal.jsx` (File mới)

Component này sẽ là một popup để người dùng nhập lý do báo cáo.

```jsx
// src/components/ReportModal.jsx (Tạo file mới)

import { useState } from 'react';
import { toast } from 'react-toastify';
import { createReport } from '../services/api';
import '../styles/components/ReportModal.css'; // Tạo file CSS mới

function ReportModal({ show, onHide, documentId, userId }) {
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
      onHide(); // Tự động đóng modal sau khi gửi thành công
      setReason(''); // Reset form
      setDetails('');
    } catch (error) {
      toast.error('Gửi báo cáo thất bại. Vui lòng thử lại.');
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
```

#### b. Tích hợp `ReportModal.jsx` vào `DocumentDetail.jsx`

Thêm nút "Báo cáo" và quản lý trạng thái hiển thị của modal.

```jsx
// src/pages/DocumentDetail.jsx

import { faFlag } from '@fortawesome/free-solid-svg-icons';
import ReportModal from '../components/ReportModal'; // Import component mới

function DocumentDetail() {
  // ...
  const [showReportModal, setShowReportModal] = useState(false);
  // ...

  return (
    <div className="document-detail-page">
      {/* ... */}
      <div className="document-detail-container">
        {/* ... */}
        {/* Thêm nút báo cáo ở đâu đó hợp lý, ví dụ dưới phần mô tả */}
        {user && (
          <div className="report-section">
            <button className="report-button" onClick={() => setShowReportModal(true)}>
              <FontAwesomeIcon icon={faFlag} /> Báo cáo vi phạm
            </button>
          </div>
        )}
      </div>

      {/* Render Modal */}
      {doc && user && (
        <ReportModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          documentId={doc.documentId}
          userId={user.userId}
        />
      )}
    </div>
  );
}
```

### Bước 4: Cập nhật Giao diện Quản trị

#### a. Cập nhật `DocumentManagement.jsx`

Thay đổi cột "Trạng thái" để hiển thị `approvalStatus`.

```jsx
// src/components/DocumentManagement.jsx

// ... (bên trong DocumentRow)
<td>
  <span className={`status-badge status-${doc.approvalStatus?.toLowerCase()}`}>
    {
      {
        'Approved': 'Đã duyệt',
        'SemiApproved': 'Chưa kiểm duyệt',
        'Pending': 'Đang chờ',
        'Rejected': 'Bị từ chối'
      }[doc.approvalStatus] || 'Không xác định'
    }
  </span>
</td>
// ...
```

#### b. Cập nhật `DocumentApproval.jsx`

Đảm bảo component này chỉ lấy và hiển thị các tài liệu có `ApprovalStatus === 'Pending'`. Backend của bạn đã làm điều này, nên chỉ cần đảm bảo frontend hiển thị đúng. Giao diện hiện tại đã ổn.

#### c. (Khuyến nghị) Tạo `ReportManagement.jsx` cho Admin

Tạo một tab mới trong `AdminDashboard.jsx` và một component mới để quản lý các báo cáo.
*   **`AdminDashboard.jsx`:** Thêm một nút mới vào `admin-nav`.
*   **`ReportManagement.jsx` (File mới):** Component này sẽ gọi `getAllReports()`, hiển thị danh sách báo cáo trong bảng, cho phép admin xem chi tiết và cập nhật trạng thái (gọi `updateReportStatus`).

### Bước 5: Thêm CSS Styling

Tạo file `src/styles/components/ReportModal.css` và cập nhật các file CSS khác.

```css
/* src/styles/pages/DocumentDetail.css */
.status-label.semi-approved {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(245, 159, 11, 0.85); /* Màu cam */
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  backdrop-filter: blur(2px);
}

.status-banner.semi-approved {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.report-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}
.report-button {
  background: none; border: 1px solid #d1d5db; color: #6b7280; padding: 6px 12px;
  border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
}
.report-button:hover { background-color: #f3f4f6; color: #111827; }

/* Thêm file mới: src/styles/components/ReportModal.css */
.modal-overlay { /* ... style cho lớp phủ ... */ }
.modal-content { /* ... style cho popup ... */ }
.modal-content h4 { /* ... */ }
.modal-content .form-group { margin-bottom: 1rem; }
.modal-content label { display: block; margin-bottom: 0.5rem; }
.modal-content select, .modal-content textarea { width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }

/* Cập nhật src/styles/pages/Profile.css */
.status-text.approved { color: #059669; font-weight: bold; }
.status-text.semi-approved { color: #d97706; font-weight: bold; }
.status-text.pending { color: #6b7280; }
.status-text.rejected { color: #dc2626; font-weight: bold; }
```

Với kế hoạch này, bạn có thể triển khai từng bước một để tích hợp hoàn chỉnh chức năng duyệt bán tự động vào giao diện người dùng, mang lại trải nghiệm liền mạch và rõ ràng cho cả người dùng cuối và quản trị viên.