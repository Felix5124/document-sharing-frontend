import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { uploadDocument, getCategories } from '../services/api';
import { toast } from 'react-toastify';

function UploadDocument() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [categories, setCategories] = useState([]);
   const [filePreview, setFilePreview] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUserId(user?.userId);
      } else {
        toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        // Có thể điều hướng người dùng về trang đăng nhập ở đây
      }
    } catch (error) {
      console.error("Lỗi khi parse thông tin người dùng từ localStorage:", error);
      toast.error('Có lỗi xảy ra khi lấy thông tin người dùng.');
    }
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

  // Theo dõi file ảnh bìa để hiển thị preview
  const coverImageFile = watch("CoverImageFile");
  useEffect(() => {
    if (coverImageFile && coverImageFile.length > 0) {
      const file = coverImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [coverImageFile]);

  const onSubmit = async (data) => {
    if (!userId) {
      toast.error('Không có thông tin người dùng (userId). Vui lòng đăng nhập lại.');
      return;
    }
    const formData = new FormData();
    formData.append('Title', data.Title);
    formData.append('Description', data.Description || '');
    formData.append('CategoryId', parseInt(data.CategoryId, 10));
    formData.append('PointsRequired', data.PointsRequired?.toString() || '0');

    if (data.File && data.File.length > 0) {
      formData.append('File', data.File[0]);
    } else {
      toast.error('Vui lòng chọn file tài liệu.');
      return;    
    }

    if (data.CoverImageFile && data.CoverImageFile.length > 0) {
      formData.append('CoverImageFile', data.CoverImageFile[0]);
    }


    try {
      const token = localStorage.getItem('token');
      console.log('Current Token:', token);
      if (!token || typeof token !== 'string') {
        toast.error('Token không hợp lệ, vui lòng đăng nhập lại.');
        return;
      }

      console.log('FormData to be sent:');
      for (let [key, value] of formData.entries()) {
      console.log(key, value);
      }

      const response = await uploadDocument(formData);
      console.log('Upload response:', response.data);
      toast.success('Tải tài liệu thành công! Tài liệu đang được chờ duyệt.');
    } catch (error) {
      console.error('Upload error details:', error.response?.data || error.message, 'Status:', error.response?.status);
      const errorMessage = error.response?.data?.errors || error.response?.data?.message || error.response?.data || error.message;
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        let messages = [];
        for (const key in errorMessage) {
          if (Array.isArray(errorMessage[key])) {
            messages = messages.concat(errorMessage[key]);
          }
        }
        toast.error('Tải tài liệu thất bại: ' + (messages.length > 0 ? messages.join('. ') : 'Lỗi không xác định.'));
      } else {
        toast.error('Tải tài liệu thất bại: ' + errorMessage);
      }

    }
  };

  return (
    <div className="upload-container container mt-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">
            <i className="bi bi-upload me-2"></i> Tải lên tài liệu
          </h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label htmlFor="titleInput" className="form-label">Tiêu đề</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-fonts"></i></span>
                <input
                  type="text"
                  id="titleInput"
                  className={`form-control ${errors.Title ? 'is-invalid' : ''}`}
                  {...register('Title', { required: 'Vui lòng nhập tiêu đề' })}
                />
              </div>
              {errors.Title && <p className="invalid-feedback d-block">{errors.Title.message}</p>}
            </div>

            <div className="mb-3">
              <label htmlFor="descriptionInput" className="form-label">Mô tả</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-text-paragraph"></i></span>
                <textarea
                  id="descriptionInput"
                  className="form-control"
                  rows="3"
                  {...register('Description')}
                ></textarea>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="categorySelect" className="form-label">Danh mục</label>
              <select
                id="categorySelect"
                className={`form-select ${errors.CategoryId ? 'is-invalid' : ''}`}
                {...register('CategoryId', { required: 'Vui lòng chọn danh mục' })}
                defaultValue=""
              >
                <option value="" disabled>Chọn danh mục...</option>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((category) => ( // Bỏ index nếu categoryId là duy nhất
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name || `Danh mục ${category.categoryId}`}
                    </option>
                  ))
                ) : (
                  <option disabled>Đang tải hoặc không có danh mục</option>
                )}
              </select>
              {errors.CategoryId && <p className="invalid-feedback d-block">{errors.CategoryId.message}</p>}
            </div>

            <div className="mb-3">
              <label htmlFor="pointsInput" className="form-label">Điểm yêu cầu (mặc định 0)</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-star"></i></span>
                <input
                  type="number"
                  id="pointsInput"
                  className={`form-control ${errors.PointsRequired ? 'is-invalid' : ''}`}
                  defaultValue="0"
                  {...register('PointsRequired', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Điểm không được âm' } 
                  })}
                />
              </div>
              {errors.PointsRequired && <p className="invalid-feedback d-block">{errors.PointsRequired.message}</p>}
            </div>

            <div className="mb-3">
              <label htmlFor="fileInput" className="form-label">File tài liệu chính</label>
              <input
                type="file"
                id="fileInput"
                className={`form-control ${errors.File ? 'is-invalid' : ''}`}
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" // Mở rộng các loại file được chấp nhận
                {...register('File', { required: 'Vui lòng chọn file tài liệu' })}
              />
              {errors.File && <p className="invalid-feedback d-block">{errors.File.message}</p>}
            </div>

            {/* Trường input cho Ảnh bìa (CoverImageFile) */}
            <div className="mb-3">
              <label htmlFor="coverImageInput" className="form-label">Ảnh bìa (tùy chọn)</label>
              <input
                type="file"
                id="coverImageInput"
                className="form-control" // Không cần is-invalid vì là tùy chọn
                accept="image/png, image/jpeg, image/gif" // Chấp nhận các định dạng ảnh phổ biến
                {...register('CoverImageFile')} // Không cần required
              />
              {filePreview && (
                <div className="mt-2 text-center">
                  <img src={filePreview} alt="Xem trước ảnh bìa" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100">
              <i className="bi bi-cloud-upload me-2"></i> Tải lên
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadDocument;