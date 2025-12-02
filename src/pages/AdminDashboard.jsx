import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AccountManagement from '../components/AccountManagement';
import CategoryManagement from '../components/CategoryManagement';
import DocumentManagement from '../components/DocumentManagement';
import AdminStatistics from '../components/AdminStatistics';
import ReportManagement from '../components/ReportManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faTags,
  faFileShield,
  faChartColumn,
  faSchool,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/AdminDashboard.css';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account-management');

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'account-management':
        return 'Quản Lý Tài Khoản';
      case 'category-management':
        return 'Quản Lý Thể Loại';
      case 'document-management':
        return 'Quản Lý Tài Liệu';
      case 'statistics':
        return 'Thống Kê Hệ Thống';
      case 'report-management':
        return 'Quản Lý Báo cáo';
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
  return (
    <div className="all-container ">
      <div className='admin-container-card'>
        <h2 className="upload-title">
          Bảng điều khiển quản trị
        </h2>

        <div className='admin-navi'>
          <div className="admin-nav">
            <button
              className={`nav-button ${activeSection === 'account-management' ? 'active' : ''}`}
              onClick={() => setActiveSection('account-management')}
            >
              <FontAwesomeIcon icon={faUsers} className="nav-icon" /> Quản lý tài khoản
            </button>
            <button
              className={`nav-button ${activeSection === 'category-management' ? 'active' : ''}`}
              onClick={() => setActiveSection('category-management')}
            >
              <FontAwesomeIcon icon={faTags} className="nav-icon" /> Quản lý thể loại
            </button>
            <button
              className={`nav-button ${activeSection === 'document-management' ? 'active' : ''}`}
              onClick={() => setActiveSection('document-management')}
            >
              <FontAwesomeIcon icon={faFileShield} className="nav-icon" /> Quản lý tài liệu
            </button>
            <button
              className={`nav-button ${activeSection === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveSection('statistics')}
            >
              <FontAwesomeIcon icon={faChartColumn} className="nav-icon" /> Thống kê
            </button>
            <button
              className={`nav-button ${activeSection === 'report-management' ? 'active' : ''}`}
              onClick={() => setActiveSection('report-management')}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="nav-icon" /> Quản lý báo cáo
            </button>
          </div>
        </div>


        <div className="admin-content fade-in">
          <div className="section-header">
            <h3 className="section-action-title">{getSectionTitle()}</h3>
          </div>
          <div className="section-body">
            {activeSection === 'account-management' && <AccountManagement />}
            {activeSection === 'category-management' && <CategoryManagement />}
            {activeSection === 'document-management' && <DocumentManagement />}
            {activeSection === 'statistics' && <AdminStatistics />}
            {activeSection === 'report-management' && <ReportManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;