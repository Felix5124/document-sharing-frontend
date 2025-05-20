import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { uploadDocument, getCategories } from '../services/api';
import { toast } from 'react-toastify';

function UploadDocument() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm(); // Thêm reset
  const [categories, setCategories] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.userId;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      const cats = response.data.$values || response.data || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục.');
      setCategories([]);
    }
  };

  const onSubmit = async (data) => {
  const formData = new FormData();
  formData.append('Title', data.Title);
  formData.append('Description', data.Description || '');
  formData.append('CategoryId', parseInt(data.CategoryId, 10).toString());
  formData.append('UploadedBy', userId.toString());
  formData.append('PointsRequired', (data.PointsRequired || 0).toString());
  if (data.File && data.File.length > 0) {
    formData.append('File', data.File[0]);
  } else {
    toast.error('Vui lòng chọn file.');
    return;
  }

  try {
    const response = await uploadDocument(formData);
    toast.success('Tải tài liệu thành công, xin chờ duyệt!');
    reset(); // Reset form
    window.scrollTo(0, 0); // Cuộn lên   // Cuộn lên đầu trang
  } catch (error) {
    toast.error('Tải tài liệu thất bại: ' + (error.response?.data?.message || error.message));
  }
};

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2 className="upload-title">
          <i className="bi bi-upload me-2"></i> Tải lên tài liệu
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Tiêu đề</label>
            <div className="input-wrapper">
              <i className="bi bi-fonts input-icon"></i>
              <input
                type="text"
                className="form-input"
                {...register('Title', { required: 'Vui lòng nhập tiêu đề' })}
              />
            </div>
            {errors.Title && <p className="error-text">{errors.Title.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <div className="input-wrapper">
              <i className="bi bi-text-paragraph input-icon"></i>
              <textarea
                className="form-input"
                {...register('Description')}
              ></textarea>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Danh mục</label>
            <select
              className="form-select"
              {...register('CategoryId', { required: 'Vui lòng chọn danh mục' })}
            >
              <option value="">Chọn danh mục</option>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category, index) => (
                  <option key={category.categoryId || index} value={category.categoryId}>
                    {category.name || `Danh mục ${index + 1}`}
                  </option>
                ))
              ) : (
                <option disabled>Không có danh mục</option>
              )}
            </select>
            {errors.CategoryId && <p className="error-text">{errors.CategoryId.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Điểm yêu cầu</label>
            <div className="input-wrapper">
              <i className="bi bi-star input-icon"></i>
              <input
  type="number"
  className="form-input"
  {...register('PointsRequired', { 
    required: 'Vui lòng nhập điểm', 
    min: { value: 0, message: 'Điểm không được nhỏ hơn 0' } // Thêm kiểm tra min
  })}
/>
            </div>
            {errors.PointsRequired && <p className="error-text">{errors.PointsRequired.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">File tài liệu</label>
            <div className="input-wrapper">
              <i className="bi bi-paperclip input-icon"></i>
              <input
                type="file"
                className="form-input"
                accept=".pdf,.doc,.docx"
                {...register('File', { required: 'Vui lòng chọn file' })}
              />
            </div>
            {errors.File && <p className="error-text">{errors.File.message}</p>}
          </div>
          <button type="submit" className="submit-button">
            <i className="bi bi-cloud-upload me-2"></i> Tải lên
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadDocument;