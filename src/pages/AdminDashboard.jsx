import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DocumentApproval from '../components/DocumentApproval';
import AccountManagement from '../components/AccountManagement';
import CategoryManagement from '../components/CategoryManagement';
import DocumentManagement from '../components/DocumentManagement';
import AdminStatistics from '../components/AdminStatistics';
import SchoolManagement from '../components/SchoolManagement';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('document-approval');

  console.log(
    '%c[AdminDashboard] Component Rendered/Mounting. User from context:',
    'color: purple; font-weight: bold;',
    user ? { userId: user.userId, isAdmin: user.isAdmin, email: user.email } : null
  );

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'document-approval':
        return 'Duyệt Tài Liệu';
      case 'account-management':
        return 'Quản Lý Tài Khoản';
      case 'category-management':
        return 'Quản Lý Thể Loại';
      case 'document-management':
        return 'Quản Lý Tài Liệu';
      case 'statistics':
        return 'Thống Kê Hệ Thống';
      case 'school-management':
        return 'Quản Lý Trường Học';
      default:
        return '';
    }
  };

  if (!user || !user.isAdmin) {
    console.warn(
      "AdminDashboard: User is not admin or user is null, rendering null. This shouldn't happen if PrivateRoute is working."
    );
    return null;
  }
  console.log('[AdminDashboard] User is admin. Rendering dashboard content.');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">
          <i className="bi bi-gear me-2"></i> Bảng điều khiển quản trị
        </h2>
      </div>

      <div className="admin-nav">
        <button
          className={`nav-button ${activeSection === 'document-approval' ? 'active' : ''}`}
          onClick={() => setActiveSection('document-approval')}
        >
          <i className="bi bi-file-earmark-check me-2"></i> Duyệt tài liệu
        </button>
        <button
          className={`nav-button ${activeSection === 'account-management' ? 'active' : ''}`}
          onClick={() => setActiveSection('account-management')}
        >
          <i className="bi bi-people me-2"></i> Quản lý tài khoản
        </button>
        <button
          className={`nav-button ${activeSection === 'category-management' ? 'active' : ''}`}
          onClick={() => setActiveSection('category-management')}
        >
          <i className="bi bi-tags me-2"></i> Quản lý thể loại
        </button>
        <button
          className={`nav-button ${activeSection === 'document-management' ? 'active' : ''}`}
          onClick={() => setActiveSection('document-management')}
        >
          <i className="bi bi-file-earmark-lock me-2"></i> Quản lý tài liệu
        </button>
        <button
          className={`nav-button ${activeSection === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveSection('statistics')}
        >
          <i className="bi bi-bar-chart-line me-2"></i> Thống kê
        </button>
        <button
          className={`nav-button ${activeSection === 'school-management' ? 'active' : ''}`}
          onClick={() => setActiveSection('school-management')}
        >
          <i className="bi bi-building me-2"></i> Quản lý trường học
        </button>
      </div>

      <div className="admin-content fade-in">
        <div className="section-header">
          <h3 className="section-action-title">{getSectionTitle()}</h3>
        </div>
        <div className="section-body">
          {activeSection === 'document-approval' && <DocumentApproval />}
          {activeSection === 'account-management' && <AccountManagement />}
          {activeSection === 'category-management' && <CategoryManagement />}
          {activeSection === 'document-management' && <DocumentManagement />}
          {activeSection === 'statistics' && <AdminStatistics />}
          {activeSection === 'school-management' && <SchoolManagement />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;