import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { getAdminPaymentsList, confirmPayment, cancelPayment } from "../services/api";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFilter,
  faRotateRight,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import "../styles/AdminPayments.css";
// Import CSS dùng chung cho thanh filter (như trong AccountManagement)
import '../styles/components/DocumentManagement.css';

// Import React Datepicker và CSS của nó
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Import ngôn ngữ tiếng Việt cho lịch
import { registerLocale } from  "react-datepicker";
import { vi } from 'date-fns/locale/vi';
registerLocale('vi', vi);

function AdminPayments() {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE MỚI CHO PHÂN TRANG & BỘ LỌC ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // Mặc định: tất cả
  // Thay đổi state ban đầu thành null (thay vì chuỗi rỗng) để tương thích với DatePicker
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // Toggle bộ lọc nâng cao

  // --- STATE CŨ CHO MODAL ---
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // Hàm tải dữ liệu 
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      // Chuẩn hóa ngày tháng trước khi gửi lên API (chuyển về YYYY-MM-DD)
      // Lưu ý: toISOString() có thể bị lệch múi giờ, dùng toLocaleDateString hoặc format thủ công là an toàn nhất cho filter ngày
      const formatDateForApi = (date) => {
        if (!date) return undefined;
        // Trả về định dạng YYYY-MM-DD mà backend C# dễ dàng parse
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };

      const params = {
        page,
        pageSize: 10, // Số lượng card mỗi trang
        keyword: searchTerm,
        status: statusFilter,
        fromDate: formatDateForApi(fromDate),
        toDate: formatDateForApi(toDate)
      };

      const res = await getAdminPaymentsList(params);
      setPayments(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thanh toán:", error);
      toast.error("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, fromDate, toDate]);

  // Thêm hàm này để xử lý việc tự động thêm dấu / khi nhập tay
  const handleDateChangeRaw = (e) => {
      // 1. Kiểm tra an toàn: nếu không có event hoặc target thì dừng
      if (!e || !e.target) return;

      // 2. Lấy giá trị hiện tại, nếu undefined/null thì gán là chuỗi rỗng
      let val = e.target.value || '';

      // 3. Xử lý logic thay thế
      let value = val.replace(/\D/g, ''); // Xóa hết ký tự không phải số
      if (value.length > 8) value = value.slice(0, 8); // Giới hạn 8 số (ddmmyyyy)

      // Tự động chèn dấu /
      if (value.length >= 5) {
          value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
      } else if (value.length >= 3) {
          value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }

      // 4. Gán lại giá trị cho input
      e.target.value = value;
  };

    useEffect(() => {
    if (user?.isAdmin) {
      loadPayments();
    }
  }, [user, page, searchTerm, statusFilter, fromDate, toDate, loadPayments]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setFromDate(null); // Reset về null
    setToDate(null);   // Reset về null
    setPage(1);
  };

  const handleConfirmClick = (payment) => {
    setSelectedPayment(payment);
    setNote("");
    setShowConfirmModal(true);
  };

  const handleCancelClick = (payment) => {
    setSelectedPayment(payment);
    setNote("");
    setShowCancelModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !user) return;
    setProcessing(true);
    try {
      const data = {
        paymentId: selectedPayment.paymentId,
        adminId: user.userId,
        note: note || "Đã xác nhận thanh toán"
      };
      await confirmPayment(data);
      toast.success("Đã xác nhận thanh toán thành công!");
      setShowConfirmModal(false);
      loadPayments(); // Reload
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xác nhận thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!selectedPayment || !user) return;
    if (!note.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }
    setProcessing(true);
    try {
      const data = { adminId: user.userId, note: note };
      await cancelPayment(selectedPayment.paymentId, data);
      toast.success("Đã hủy đơn thanh toán!");
      setShowCancelModal(false);
      loadPayments(); // Reload
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getTimeRemaining = (expiredAt) => {
    const now = new Date();
    const expiry = new Date(expiredAt);
    const diff = expiry - now;
    if (diff <= 0) return "Đã hết hạn";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="all-container">
      <div className="all-container-card admin-payments-container">
        <div className="upload-title">
          <h4>Quản lý thanh toán Premium</h4>
        </div>

        {/* --- KHU VỰC BỘ LỌC VÀ TÌM KIẾM (MỚI) --- */}
        <div className="admin-filter-bar">
            {/* Hàng 1: Search + Toggle */}
            <div className="filter-top-row">
                <div className="search-wrapper">
                    <div className="search-group">
                        <FontAwesomeIcon icon={faMagnifyingGlass} className="icon-search" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm: Mã đơn, Email, Tên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                    className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} 
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FontAwesomeIcon icon={faFilter} /> {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                </button>
            </div>

            {/* Hàng 2: Filters (Luôn hiện trạng thái, các cái khác ẩn hiện) */}
            <div className={`filter-options-container ${showFilters ? 'open' : ''}`} style={{display: showFilters ? 'block' : 'none', marginTop: '15px'}}>
                <div className="filter-grid">
                    {/* Trạng thái */}
                    <div className="filter-item">
                        <label>Trạng thái đơn</label>
                        <select
                            className="select-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Pending">⏳ Chờ xử lý</option>
                            <option value="Completed">✅ Đã hoàn thành</option>
                            <option value="Cancelled">❌ Đã hủy</option>
                            <option value="Expired">⚠️ Đã hết hạn</option>
                            <option value="All">📁 Tất cả</option>
                        </select>
                    </div>

                    {/* Từ ngày */}
                    <div className="filter-item">
                        <label>Từ ngày</label>
                        <div className="date-picker-wrapper">
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                onChangeRaw={handleDateChangeRaw} // <--- Thêm dòng này để auto format
                                dateFormat="dd/MM/yyyy"
                                placeholderText="dd/mm/yyyy"
                                className="select-filter date-input-custom" // Thêm class custom
                                locale="vi"
                                isClearable
                                maxDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                todayButton="Hôm nay" // Nút chọn nhanh hôm nay
                                popperClassName="custom-datepicker-popper" // Class để style popup
                                portalId="root" // Giúp lịch hiển thị nổi lên trên cùng, không bị che
                            />
                            <FontAwesomeIcon icon={faCalendarAlt} className="calendar-icon" />
                        </div>
                    </div>

                    {/* Đến ngày */}
                    <div className="filter-item">
                        <label>Đến ngày</label>
                        <div className="date-picker-wrapper">
                             <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                onChangeRaw={handleDateChangeRaw} // <--- Thêm dòng này
                                dateFormat="dd/MM/yyyy"
                                placeholderText="dd/mm/yyyy"
                                className="select-filter date-input-custom"
                                locale="vi"
                                isClearable
                                minDate={fromDate}
                                maxDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                todayButton="Hôm nay"
                                popperClassName="custom-datepicker-popper"
                                portalId="root"
                            />
                            <FontAwesomeIcon icon={faCalendarAlt} className="calendar-icon" />
                        </div>
                    </div>

                     {/* Nút Reset */}
                    <div className="filter-item filter-actions">
                        <label className="invisible-label">Tác vụ</label>
                        <button className="reset-filter-btn" onClick={handleResetFilters}>
                            <FontAwesomeIcon icon={faRotateRight} /> Đặt lại
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- DANH SÁCH PAYMENTS (GIỮ GIAO DIỆN CARD CŨ) --- */}
        {loading ? (
          <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Đang tải dữ liệu...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="no-payments">
            <p>📭 Không tìm thấy đơn thanh toán nào phù hợp</p>
          </div>
        ) : (
          <div className="payments-list">
            <p className="payments-count">
              Tìm thấy <strong>{totalCount}</strong> đơn thanh toán.
            </p>
            
            {payments.map((payment) => (
              <div key={payment.paymentId} className="payment-card">
                <div className="payment-header-row">
                  <div className="payment-code">
                    <strong>#{payment.orderCode}</strong>
                    <button onClick={() => copyToClipboard(payment.orderCode)} className="copy-icon-btn" title="Sao chép">📋</button>
                  </div>
                  <div className="payment-amount">
                    {payment.amount.toLocaleString()}đ
                  </div>
                </div>

                <div className="payment-info">
                  <div className="info-row">
                    <span className="label">Người dùng:</span>
                    <span className="value">{payment.userFullName} ({payment.userEmail})</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Gói VIP:</span>
                    <span className="value">{payment.subscriptionType === 'Monthly' ? 'Tháng' : payment.subscriptionType === 'Quarterly' ? '3 Tháng' : 'Năm'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Trạng thái:</span>
                    <span className={`value status-${payment.status?.toLowerCase()}`}>
                        {payment.status === 'Pending' ? 'Chờ thanh toán' : 
                         payment.status === 'Completed' ? 'Đã hoàn thành' :
                         payment.status === 'Cancelled' ? 'Đã hủy' : 'Hết hạn'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Nội dung CK:</span>
                    <span className="value transfer-content">
                      <code>{payment.transferContent}</code>
                      <button onClick={() => copyToClipboard(payment.transferContent)} className="copy-icon-btn">📋</button>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Thông tin NH:</span>
                    <span className="value">{payment.bankName} - {payment.bankAccountNumber}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Ngày tạo:</span>
                    <span className="value">{formatDate(payment.createdAt)}</span>
                  </div>
                  
                  {/* Chỉ hiện thời gian còn lại nếu đang Pending */}
                  {payment.status === 'Pending' && (
                      <div className="info-row">
                        <span className="label">Còn lại:</span>
                        <span className="value expiry-time">{getTimeRemaining(payment.expiredAt)}</span>
                      </div>
                  )}
                  {payment.completedAt && (
                      <div className="info-row">
                        <span className="label">Hoàn thành lúc:</span>
                        <span className="value">{formatDate(payment.completedAt)}</span>
                      </div>
                  )}
                   {payment.note && (
                      <div className="info-row">
                        <span className="label">Ghi chú:</span>
                        <span className="value" style={{fontStyle: 'italic'}}>{payment.note}</span>
                      </div>
                  )}
                </div>

                {/* Chỉ hiện nút hành động nếu đang Pending */}
                {payment.status === 'Pending' && (
                    <div className="payment-actions">
                    <button onClick={() => handleConfirmClick(payment)} className="btn-confirm">
                        ✅ Xác nhận thanh toán
                    </button>
                    <button onClick={() => handleCancelClick(payment)} className="btn-cancel">
                        ❌ Hủy đơn
                    </button>
                    </div>
                )}
              </div>
            ))}

            {/* --- PHÂN TRANG (MỚI) --- */}
            <div className="pagination-section">
                <button
                className="btn-page"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                >
                ‹ Trang trước
                </button>
                <span className="pagination-info">Trang {page} / {totalPages}</span>
                <button
                className="btn-page"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                >
                Trang tiếp ›
                </button>
            </div>
          </div>
        )}

        {/* GIỮ NGUYÊN CÁC MODAL CONFIRM VÀ CANCEL NHƯ CŨ */}
        {showConfirmModal && selectedPayment && (
            // ... (Code Modal Confirm giữ nguyên như cũ)
            <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Xác nhận thanh toán</h3>
                <p>Bạn có chắc chắn muốn xác nhận thanh toán cho đơn hàng <strong>{selectedPayment.orderCode}</strong>?</p>
                <div className="form-group">
                <label>Ghi chú (tùy chọn):</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
                </div>
                <div className="modal-actions">
                <button onClick={handleConfirmPayment} disabled={processing} className="btn-primary">
                    {processing ? "Đang xử lý..." : "Xác nhận"}
                </button>
                <button onClick={() => setShowConfirmModal(false)} disabled={processing} className="btn-secondary">Hủy</button>
                </div>
            </div>
            </div>
        )}

        {showCancelModal && selectedPayment && (
             // ... (Code Modal Cancel giữ nguyên như cũ)
             <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                 <h3>Hủy đơn thanh toán</h3>
                 <p>Bạn có chắc chắn muốn hủy đơn hàng <strong>{selectedPayment.orderCode}</strong>?</p>
                 <div className="form-group">
                 <label>Lý do hủy <span className="required">*</span>:</label>
                 <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} required />
                 </div>
                 <div className="modal-actions">
                 <button onClick={handleCancelPayment} disabled={processing || !note.trim()} className="btn-danger">
                     {processing ? "Đang xử lý..." : "Xác nhận hủy"}
                 </button>
                 <button onClick={() => setShowCancelModal(false)} disabled={processing} className="btn-secondary">Đóng</button>
                 </div>
             </div>
             </div>
        )}
      </div>
    </div>
  );
}

export default AdminPayments;
