import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getDocumentById, updateDocument, getCategories } from '../services/api';

function UpdateDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      Title: '', Description: '', CategoryId: '', UploadedBy: '', PointsRequired: 0,
      Tags: [],
      File: null,
      CoverImage: null,
    }
  });
  const [tagInputText, setTagInputText] = useState('');
  const [document, setDocument] = useState(null);
  const [categories, setCategories] = useState([]);
  const [fileName, setFileName] = useState('');
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState('');
  const [previewNewCover, setPreviewNewCover] = useState(null);
  const [loading, setLoading] = useState(true);

  const newCoverImageFile = watch('CoverImage');
  const currentTags = watch('Tags');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docResponse, catResponse] = await Promise.all([
          getDocumentById(id),
          getCategories(),
        ]);

        const docData = docResponse.data;
        setDocument(docData);

        setValue('Title', docData.Title || docData.title || '');
        setValue('Description', docData.Description || docData.description || '');
        setValue('CategoryId', docData.CategoryId || docData.categoryId || '');
        setValue('UploadedBy', docData.UploadedBy || docData.uploadedBy || '');
        setValue('PointsRequired', docData.PointsRequired || docData.pointsRequired || 0);

        if (docData.tags && Array.isArray(docData.tags)) {
          const initialTags = docData.tags.map(tag => ({
            value: tag.tagId ? tag.tagId.toString() : tag.name,
            label: tag.name
          }));
          setValue('Tags', initialTags);
        } else {
          setValue('Tags', []);
        }
        
        const cats = catResponse.data.$values || catResponse.data || [];
        setCategories(Array.isArray(cats) ? cats : []);

        const fileNameFromUrl = docData.FileUrl
          ? docData.FileUrl.split('/').pop()
          : 'Chưa có file';
        setFileName(fileNameFromUrl);

        if (docData.CoverImageUrl) {
          setCurrentCoverImageUrl(`${api.defaults.baseURL.replace('/api', '')}/${docData.CoverImageUrl}`);
        } else {
          setCurrentCoverImageUrl(`${api.defaults.baseURL.replace('/api', '')}/ImageCovers/cat.jpg`);
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
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(extension)) {
        toast.error('Chỉ chấp nhận file PDF, DOCX, hoặc TXT.');
        e.target.value = '';
        setFileName(document?.FileUrl ? document.FileUrl.split('/').pop() : 'Chưa có file');
        setValue('File', null, { shouldValidate: true });
        return;
      }
      setFileName(selectedFile.name);
      setValue('File', e.target.files, { shouldValidate: true });
    } else {
      setFileName(document?.FileUrl ? document.FileUrl.split('/').pop() : 'Chưa có file');
      setValue('File', null, { shouldValidate: true });
    }
  };

  const handleExternalAddTag = () => {
    const newLabel = tagInputText.trim();
    if (newLabel) {
      const newTagObject = { label: newLabel, value: newLabel };
      const tagsArray = Array.isArray(currentTags) ? currentTags : [];

      if (!tagsArray.find(tag => tag.label === newTagObject.label)) {
        setValue('Tags', [...tagsArray, newTagObject], { shouldValidate: true, shouldDirty: true });
        toast.success(`Tag "${newTagObject.label}" đã được thêm.`);
      } else {
        toast.info(`Tag "${newTagObject.label}" đã tồn tại.`);
      }
      setTagInputText('');
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      if (!data.Title) {
        toast.error('Tiêu đề không được để trống.');
        return;
      }
      formData.append('Title', data.Title);
      formData.append('Description', data.Description || '');

      const categoryId = parseInt(data.CategoryId, 10);
      if (isNaN(categoryId) || categoryId <= 0) {
        toast.error('Vui lòng chọn danh mục hợp lệ.');
        return;
      }
      formData.append('CategoryId', categoryId.toString());

      const uploadedBy = parseInt(data.UploadedBy, 10);
      if (isNaN(uploadedBy) || uploadedBy <= 0) {
        toast.error('ID người tải lên không hợp lệ.');
        return;
      }
      formData.append('UploadedBy', uploadedBy.toString());

      const pointsRequired = parseInt(data.PointsRequired, 10);
      formData.append('PointsRequired', (isNaN(pointsRequired) ? 0 : pointsRequired).toString());

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
        formData.append('CoverImage', data.CoverImage[0]);
      }

      if (data.Tags && Array.isArray(data.Tags)) {
        if (data.Tags.length > 0) {
          data.Tags.forEach(tagObject => {
            formData.append('Tags', tagObject.label);
          });
        } else {
          formData.append('Tags', '');
        }
      }

      setLoading(true);
      await updateDocument(id, formData);
      toast.success('Cập nhật tài liệu thành công.');
      navigate('/profile');
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.File?.join(', ') ||
        error.response?.data?.message ||
        error.response?.data?.title ||
        JSON.stringify(error.response?.data) ||
        error.message ||
        'Cập nhật tài liệu thất bại.';
      toast.error(`Lỗi: ${errorMessage}`, { toastId: 'update-error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !document) return <div className="text-center py-5">Đang tải...</div>;

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2 className="upload-title">
          <i className="bi bi-pencil-square me-2"></i> Cập nhật tài liệu
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
                />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Danh mục</label>
            <select
              className="form-select"
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
            {errors.CategoryId && <p className="error-text">{errors.CategoryId.message}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="form-label" htmlFor="tag-input">Tags</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                id="tag-input"
                className="form-input"
                style={{ flexGrow: 1, width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={tagInputText}
                onChange={(e) => setTagInputText(e.target.value)}
                placeholder="Nhập tên tag rồi nhấn 'Thêm Tag' hoặc Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExternalAddTag();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={handleExternalAddTag}
              >
                Thêm Tag
              </button>
            </div>
          </div>

          {currentTags && currentTags.length > 0 && (
            <div className="tags-display-upload" style={{
              marginTop: '20px',
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Tags:</strong>
              <ul style={{ listStyle: 'none', paddingLeft: '0', margin: '0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentTags.map((tag, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#007bff',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: '15px',
                      fontSize: '0.875em'
                    }}
                  >
                    <span>{tag.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = currentTags.filter((_, i) => i !== index);
                        setValue('Tags', newTags, { shouldValidate: true, shouldDirty: true });
                        toast.info(`Tag "${tag.label}" đã được xóa.`);
                      }}
                      style={{
                        marginLeft: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.1em',
                        lineHeight: '1'
                      }}
                      aria-label={`Xóa tag ${tag.label}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Điểm yêu cầu</label>
            <div className="input-wrapper">
              <i className="bi bi-star input-icon"></i>
              <input
                type="number"
                className="form-input"
                {...register('PointsRequired', { min: { value: 0, message: 'Điểm phải lớn hơn hoặc bằng 0' } })}
              />
            </div>
            {errors.PointsRequired && <p className="error-text">{errors.PointsRequired.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">File tài liệu (để trống nếu không muốn thay đổi)</label>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>File hiện tại: </span>
              {fileName || 'Chưa có file'}
            </div>
            <div className="input-wrapper">
              <i className="bi bi-paperclip input-icon"></i>
              <input
                type="file"
                className="form-input"
                accept=".pdf,.docx,.txt"
                {...register('File')}
                onChange={handleFileChange}
              />
            </div>
            {errors.File && <p className="error-text">{errors.File.message}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Ảnh bìa (JPG, PNG, GIF - tùy chọn)</label>
            {currentCoverImageUrl && !previewNewCover && (
              <div className="mt-2 text-center">
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
              <div className="mt-2 text-center">
                <p>Xem trước ảnh bìa mới:</p>
                <img
                  src={previewNewCover}
                  alt="Xem trước ảnh bìa mới"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ddd' }}
                />
              </div>
            )}
            <div className="input-wrapper input-group">
              <span className="input-group-text">
                <i className="bi bi-image"></i>
              </span>
              <input
                type="file"
                className="form-control"
                accept="image/jpeg,image/png,image/gif"
                {...register('CoverImage')}
              />
            </div>
            <small className="form-text text-muted">Để trống nếu không muốn thay đổi ảnh bìa.</small>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            <i className="bi bi-check-circle me-2"></i> {loading ? 'Đang cập nhật...' : 'Cập nhật tài liệu'}
          </button>
          <button
            type="button"
            className="submit-button cancel-button"
            onClick={() => navigate('/profile')}
            style={{ background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)', marginTop: '10px' }}
          >
            <i className="bi bi-x-circle me-2"></i> Hủy
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateDocument;