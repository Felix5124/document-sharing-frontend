import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getDocumentById, updateDocument, getCategories } from '../services/api';

function UpdateDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const [document, setDocument] = useState(null);
  const [categories, setCategories] = useState([]);
  const [fileName, setFileName] = useState('');
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState('');
  const [previewNewCover, setPreviewNewCover] = useState(null);
  const [loading, setLoading] = useState(true);

  const newCoverImageFile = watch('CoverImage'); // Đổi từ 'ImageCovers' thành 'CoverImage'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docResponse, catResponse] = await Promise.all([
          getDocumentById(id),
          getCategories(),
        ]);

        const docData = docResponse.data;
        setDocument(docData);

        // Kiểm tra định dạng dữ liệu trả về từ BE (PascalCase)
        setValue('Title', docData.Title || docData.title || '');
        setValue('Description', docData.Description || docData.description || '');
        setValue('CategoryId', docData.CategoryId || docData.categoryId || '');
        setValue('UploadedBy', docData.UploadedBy || docData.uploadedBy || '');
        setValue('PointsRequired', docData.PointsRequired || docData.pointsRequired || 0);

        // Xử lý danh mục
        const cats = catResponse.data.$values || catResponse.data || [];
        setCategories(Array.isArray(cats) ? cats : []);

        // Xử lý tên file
        const fileNameFromUrl = docData.FileUrl
          ? docData.FileUrl.split('/').pop()
          : '';
        setFileName(fileNameFromUrl);

        // Xử lý ảnh bìa hiện tại
        if (docData.CoverImageUrl) {
          setCurrentCoverImageUrl(`${api.defaults.baseURL.replace('/api', '')}/${docData.CoverImageUrl}`);
        } else {
          setCurrentCoverImageUrl(`${api.defaults.baseURL.replace('/api', '')}/Files/Covers/default-cover.png`);
        }

        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
        toast.error('Không thể tải dữ liệu tài liệu.', { toastId: 'doc-error' });
        navigate('/profile');
      }
    };
    fetchData();
  }, [id, navigate, setValue]);

  // Xử lý preview ảnh bìa mới
  useEffect(() => {
    if (newCoverImageFile && newCoverImageFile.length > 0) {
      const file = newCoverImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewNewCover(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewNewCover(null);
    }
  }, [newCoverImageFile]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(extension)) {
        toast.error('Chỉ chấp nhận file PDF, DOCX, hoặc TXT.');
        e.target.value = ''; // Reset input file
        return;
      }
      setFileName(selectedFile.name);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      // Đảm bảo các trường bắt buộc không rỗng
      if (!data.Title) {
        toast.error('Tiêu đề không được để trống.');
        return;
      }
      formData.append('Title', data.Title);

      formData.append('Description', data.Description || '');

      // Kiểm tra và chuyển đổi CategoryId
      const categoryId = parseInt(data.CategoryId, 10);
      if (isNaN(categoryId) || categoryId <= 0) {
        toast.error('Vui lòng chọn danh mục hợp lệ.');
        return;
      }
      formData.append('CategoryId', categoryId.toString());

      // Kiểm tra và chuyển đổi UploadedBy
      const uploadedBy = parseInt(data.UploadedBy, 10);
      if (isNaN(uploadedBy) || uploadedBy <= 0) {
        toast.error('ID người tải lên không hợp lệ.');
        return;
      }
      formData.append('UploadedBy', uploadedBy.toString());

      // Chuyển đổi PointsRequired
      const pointsRequired = parseInt(data.PointsRequired, 10);
      formData.append('PointsRequired', (isNaN(pointsRequired) ? 0 : pointsRequired).toString());

      // Xử lý file tài liệu (nếu có)
      if (data.File && data.File.length > 0) {
        const selectedFile = data.File[0];
        const extension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(extension)) {
          toast.error('File tài liệu chỉ chấp nhận định dạng PDF, DOCX, hoặc TXT.');
          return;
        }
        formData.append('File', selectedFile);
      }

      // Xử lý ảnh bìa (nếu có)
      if (data.CoverImage && data.CoverImage.length > 0) {
        formData.append('CoverImage', data.CoverImage[0]); // Sửa từ 'ImageCovers' thành 'CoverImage'
      }

      // Log dữ liệu gửi lên để debug
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      setLoading(true);
      await updateDocument(id, formData);
      toast.success('Cập nhật tài liệu thành công.');
      navigate('/profile');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.response?.data ||
        error.message ||
        'Cập nhật tài liệu thất bại.';
      console.error('Update error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      toast.error(errorMessage, { toastId: 'update-error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !document) return <div>Đang tải...</div>;

  return (
    <div className="update-document-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 className="update-document-title" style={{ marginBottom: '20px' }}>
        <i className="bi bi-pencil-square me-2"></i> Cập nhật tài liệu
      </h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Tiêu đề</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <i className="bi bi-file-text input-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ccc', borderRadius: '4px' }}
              {...register('Title', { required: 'Vui lòng nhập tiêu đề' })}
            />
          </div>
          {errors.Title && <p className="error-text" style={{ color: 'red', marginTop: '5px' }}>{errors.Title.message}</p>}
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Mô tả</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <i className="bi bi-chat-text input-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
            <textarea
              className="form-input"
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }}
              {...register('Description')}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Danh mục</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <i className="bi bi-list input-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
            <select
              className="form-input"
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ccc', borderRadius: '4px' }}
              {...register('CategoryId', { 
                required: 'Vui lòng chọn danh mục',
                validate: (value) => parseInt(value, 10) > 0 || 'Vui lòng chọn danh mục hợp lệ'
              })}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {errors.CategoryId && <p className="error-text" style={{ color: 'red', marginTop: '5px' }}>{errors.CategoryId.message}</p>}
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Người tải lên (ID)</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <i className="bi bi-person input-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
            <input
              type="number"
              className="form-input"
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ccc', borderRadius: '4px' }}
              {...register('UploadedBy', { 
                required: 'Vui lòng nhập ID người tải lên',
                validate: (value) => parseInt(value, 10) > 0 || 'ID người tải lên không hợp lệ'
              })}
              disabled
            />
          </div>
          {errors.UploadedBy && <p className="error-text" style={{ color: 'red', marginTop: '5px' }}>{errors.UploadedBy.message}</p>}
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Điểm yêu cầu</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <i className="bi bi-star input-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
            <input
              type="number"
              className="form-input"
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ccc', borderRadius: '4px' }}
              {...register('PointsRequired', { min: { value: 0, message: 'Điểm phải lớn hơn hoặc bằng 0' } })}
            />
          </div>
          {errors.PointsRequired && <p className="error-text" style={{ color: 'red', marginTop: '5px' }}>{errors.PointsRequired.message}</p>}
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>File tài liệu</label>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>File hiện tại: </span>
            {fileName || 'Chưa có file'}
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            {...register('File')} // Sử dụng register thay vì onChange để đồng bộ với react-hook-form
            onChange={handleFileChange}
          />
        </div>

        <div className="form-group mb-3">
          <label className="form-label">Ảnh bìa</label>
          {currentCoverImageUrl && !previewNewCover && (
            <div className="mb-2 text-center">
              <p>Ảnh bìa hiện tại:</p>
              <img
                src={currentCoverImageUrl}
                alt="Ảnh bìa hiện tại"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ddd' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          {previewNewCover && (
            <div className="mb-2 text-center">
              <p>Ảnh bìa mới (xem trước):</p>
              <img
                src={previewNewCover}
                alt="Xem trước ảnh bìa mới"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ddd' }}
              />
            </div>
          )}
          <div className="input-wrapper input-group">
            <span className="input-group-text"><i className="bi bi-image"></i></span>
            <input
              type="file"
              className="form-control"
              accept="image/jpeg,image/png,image/gif"
              {...register('CoverImage')} // Đổi tên từ 'ImageCovers' thành 'CoverImage'
            />
          </div>
          <small className="form-text text-muted">Để trống nếu không muốn thay đổi ảnh bìa.</small>
        </div>

        <button
          type="submit"
          className="submit-button"
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          disabled={loading}
        >
          <i className="bi bi-check-circle me-2"></i> {loading ? 'Đang cập nhật...' : 'Cập nhật tài liệu'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          style={{ width: '100%', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px' }}
        >
          Hủy
        </button>
      </form>
    </div>
  );
}

export default UpdateDocument;