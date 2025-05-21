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
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState('');
  const [previewNewCover, setPreviewNewCover] = useState(null);
  const [loading, setLoading] = useState(true);

  const newCoverImageFile = watch('ImageCovers');

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const [docResponse, catResponse] = await Promise.all([
          getDocumentById(id),
          getCategories(),
        ]);
        setDocument(docResponse.data);
        setCategories(catResponse.data);
        setValue('Title', docResponse.data.title);
        setValue('Description', docResponse.data.description);
        setValue('CategoryId', docResponse.data.categoryId);
        setValue('UploadedBy', docResponse.data.uploadedBy);
        setValue('PointsRequired', docResponse.data.pointsRequired);
        const fileNameFromUrl = docResponse.data.fileUrl
          ? docResponse.data.fileUrl.split('/').pop()
          : '';
        setFileName(fileNameFromUrl);
        if (docResponse.data.coverImageUrl) {
            setCurrentCoverImageUrl(`${api.defaults.baseURL.replace('/api', '')}/${docResponse.data.coverImageUrl}`);
        } else {
            setCurrentCoverImageUrl(`${api.defaults.baseURL.replace('/api', '')}/Files/Covers/default-cover.png`); // Default
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


  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(extension)) {
        toast.error('Chỉ chấp nhận file PDF, DOCX, hoặc TXT.');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

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

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('Title', data.Title);
      formData.append('Description', data.Description || '');
      formData.append('CategoryId', parseInt(data.CategoryId, 10));
      formData.append('UploadedBy', parseInt(data.UploadedBy, 10));
      formData.append('PointsRequired', parseInt(data.PointsRequired, 10) || 0);

      if (data.File && data.File.length > 0) {
        const selectedFile = data.File[0];
        const extension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(extension)) {
            toast.error('File tài liệu chỉ chấp nhận định dạng PDF, DOCX, hoặc TXT.');
            return;
        }
        formData.append('File', selectedFile);
      }

      if (data.CoverImage && data.CoverImage.length > 0) {
        formData.append('ImageCovers', data.CoverImage[0]);
      }
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
              {...register('CategoryId', { required: 'Vui lòng chọn danh mục' })}
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
              {...register('UploadedBy', { required: 'Vui lòng nhập ID người tải lên' })}
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
            onChange={handleFileChange}
          />
        </div>

        <div className="form-group mb-3">
            <label className="form-label">Ảnh bìa</label>
            {currentCoverImageUrl && !previewNewCover && (
                <div className="mb-2 text-center">
                    <p>Ảnh bìa hiện tại:</p>
                    <img src={currentCoverImageUrl} alt="Ảnh bìa hiện tại" 
                         style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ddd' }}
                         onError={(e) => { e.target.style.display = 'none'; /* Hide if error */ }}/>
                </div>
            )}
            {previewNewCover && (
                 <div className="mb-2 text-center">
                    <p>Ảnh bìa mới (xem trước):</p>
                    <img src={previewNewCover} alt="Xem trước ảnh bìa mới" 
                         style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ddd' }} />
                </div>
            )}
            <div className="input-wrapper input-group">
                <span className="input-group-text"><i className="bi bi-image"></i></span>
                <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/gif"
                    {...register('CoverImage')} // Register for new cover image
                />
            </div>
            <small className="form-text text-muted">Để trống nếu không muốn thay đổi ảnh bìa.</small>
          </div>
        

        <button
          type="submit"
          className="submit-button"
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          <i className="bi bi-check-circle me-2"></i> Cập nhật tài liệu
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