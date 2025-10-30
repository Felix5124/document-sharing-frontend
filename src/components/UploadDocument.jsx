import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { uploadDocument, getCategories } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/components/UploadDocument.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeading, faParagraph, faFolder, faStar, faPaperclip, faImage, faTags, faCloudArrowUp } from '../utils/icons';

function UploadDocument() {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      Title: '',
      Description: '',
      CategoryId: '',
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

  const coverImageFile = watch('CoverImage');
  const currentTags = watch('Tags');

  useEffect(() => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để tải tài liệu lên.');
      navigate('/login');
      return;
    }
  }, [userId, navigate]);

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
  // points and school removed: do not append PointsRequired or SchoolId

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

  if (!userId) {
    return null;
  }

  return (
    <div className="all-container">
      <div className="all-container-card">
        <h2 className="upload-title">
          <i className="bi bi-upload icon-margin-right"></i> Tải lên tài liệu
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Tiêu đề</label>
            <div className="input-wrapper">
              <div className='input-icon'><FontAwesomeIcon icon={faHeading} /></div>
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
              <div className='input-icon'><FontAwesomeIcon icon={faParagraph} /></div>
              <textarea
                className="form-input"
                {...register('Description')}
              ></textarea>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Danh mục</label>
            <div className="input-wrapper">
              <div className="input-icon"><FontAwesomeIcon icon={faFolder} /></div>
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
            </div>
            {errors.CategoryId && <p className="error-text">{errors.CategoryId.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tag-input-upload">Tags</label>
            <div className="tag-input-row">
              <div className="input-wrapper">
                <div className="input-icon">
                  <FontAwesomeIcon icon={faTags} />
                </div>
                <input
                  type="text"
                  id="tag-input-upload"
                  className="form-input"
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
              </div>
              <button
                type="button"
                className="tag-button"
                onClick={handleAddTag}
              >
                Thêm Tag
              </button>
            </div>
          </div>


          {currentTags && currentTags.length > 0 && (
            <div className="tags-display-upload">
              <strong>Tags:</strong>
              <ul>
                {currentTags.map((tag, index) => (
                  <li key={index}>
                    <span>{tag.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = currentTags.filter((_, i) => i !== index);
                        setValue('Tags', newTags, { shouldValidate: true, shouldDirty: true });
                        toast.info(`Tag "${tag.label}" đã được xóa.`);
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


          {/* Points feature removed */}


          <div className="form-group">
            <label className="form-label">File tài liệu</label>
            <div className="input-wrapper">
              <div className="input-icon"><FontAwesomeIcon icon={faPaperclip} /></div>
              <input
                type="file"
                className="form-input"
                accept=".pdf,.doc,.docx,.txt"
                {...register('File', { required: 'Vui lòng chọn file tài liệu' })}
              />
            </div>
            {errors.File && <p className="error-text">{errors.File.message}</p>}
          </div>

          <div className="form-group margin-bottom">
            <label className="form-label">Ảnh bìa (JPG, PNG, GIF - tùy chọn)</label>
            <div className="input-wrapper file-input-group">
              <div className="input-icon"> <FontAwesomeIcon icon={faImage} /></div>
              <input
                type="file"
                className="form-input file-input"
                accept="image/jpeg,image/png,image/gif"
                {...register('CoverImage')}
              />
            </div>
            {previewCover && (
              <div className="preview-container">
                <p>Xem trước ảnh bìa:</p>
                <img src={previewCover} alt="Xem trước ảnh bìa" />
              </div>
            )}
          </div>

          <button type="submit" className="submit-button">
            Tải lên
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadDocument;