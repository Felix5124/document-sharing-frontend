import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { uploadDocument, getCategories } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function UploadDocument() {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      Title: '',
      Description: '',
      CategoryId: '',
      PointsRequired: 0,
      Tags: [],
      File: null,
      CoverImage: null,
    }
  });

  const [categories, setCategories] = useState([]);
  const [previewCover, setPreviewCover] = useState(null);
  const [tagInputText, setTagInputText] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.userId;
  const schoolId = user?.schoolId;

  const coverImageFile = watch('CoverImage');
  const currentTags = watch('Tags');

  useEffect(() => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để tải tài liệu lên.');
      navigate('/login');
      return;
    }
    if (!schoolId || schoolId === 0) {
      toast.error('Bạn phải xác nhận trường học trước khi đăng bài.', {
        toastId: 'no-school-error',
      });
      navigate('/profile');
    }
  }, [userId, schoolId, navigate]);

  useEffect(() => {
    const fetchCategoriesData = async () => {
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
    fetchCategoriesData();
  }, []);

  useEffect(() => {
    if (coverImageFile && coverImageFile.length > 0) {
      const file = coverImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewCover(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewCover(null);
    }
  }, [coverImageFile]);

  const handleAddTag = () => {
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
    const formData = new FormData();
    formData.append('Title', data.Title);
    formData.append('Description', data.Description || '');
    formData.append('CategoryId', parseInt(data.CategoryId, 10).toString());
    formData.append('UploadedBy', userId.toString());
    formData.append('PointsRequired', (data.PointsRequired || 0).toString());
    formData.append('SchoolId', schoolId.toString());

    if (data.File && data.File.length > 0) {
      const selectedFile = data.File[0];
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'txt', 'doc'].includes(extension)) {
        toast.error('File tài liệu chỉ chấp nhận định dạng PDF, DOC, DOCX, hoặc TXT.');
        return;
      }
      formData.append('File', selectedFile);
    } else {
      toast.error('Vui lòng chọn file tài liệu.');
      return;
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


    try {
      await uploadDocument(formData);
      toast.success('Tải tài liệu thành công, xin chờ duyệt!');
      reset();
      setPreviewCover(null);
      setTagInputText('');
      setValue('Tags', []);
      window.scrollTo(0, 0);
      navigate('/');
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.File?.join(', ') ||
        error.response?.data?.message ||
        error.response?.data?.title ||
        JSON.stringify(error.response?.data) ||
        error.message ||
        'Tải tài liệu thất bại.';
      toast.error(`Lỗi: ${errorMessage}`, { toastId: 'upload-error' });
    }
  };

  if (!userId || !schoolId || schoolId === 0) {
    return null;
  }

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
              {...register('CategoryId', {
                required: 'Vui lòng chọn danh mục',
                validate: (value) => (value && parseInt(value, 10) !== 0) || 'Vui lòng chọn danh mục',
              })}
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

          <div className="form-group mb-3" style={{ marginTop: '10px' }}>
            <label className="form-label" htmlFor="tag-input-upload">Tags</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                id="tag-input-upload"
                className="form-input"
                style={{ flexGrow: 1, width: '100%', padding: '10px 10px 10px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={tagInputText}
                onChange={(e) => setTagInputText(e.target.value)}
                placeholder="Nhập tên tag rồi nhấn 'Thêm Tag' hoặc Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={handleAddTag}
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
                      &times;
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
                {...register('PointsRequired', {
                  required: 'Vui lòng nhập điểm',
                  min: { value: 0, message: 'Điểm không được nhỏ hơn 0' },
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
                accept=".pdf,.doc,.docx,.txt"
                {...register('File', { required: 'Vui lòng chọn file tài liệu' })}
              />
            </div>
            {errors.File && <p className="error-text">{errors.File.message}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Ảnh bìa (JPG, PNG, GIF - tùy chọn)</label>
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
            {previewCover && (
              <div className="mt-2 text-center">
                <p>Xem trước ảnh bìa:</p>
                <img
                  src={previewCover}
                  alt="Xem trước ảnh bìa"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    border: '1px solid #ddd',
                  }}
                />
              </div>
            )}
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