import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDocumentById, updateDocument, getCategories } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare,
  faFont,
  faParagraph,
  faPaperclip,
  faImage,
  faCheckCircle,
  faXmarkCircle,
  faTags,
  faFolder
} from '@fortawesome/free-solid-svg-icons';
import '../styles/components/UpdateDocument.css';

function UpdateDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      Title: '', Description: '', CategoryId: '', UploadedBy: '',
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

        if (docData.CoverImageUrl && docData.CoverImageUrl.trim() !== '') {
          setCurrentCoverImageUrl(getFullImageUrl(docData.CoverImageUrl));
        } else {
          setCurrentCoverImageUrl(getFullImageUrl(null));
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

  if (loading || !document) return <div className="loading-display">Đang tải...</div>;

  return (
    <div className="all-container">
      <div className="all-container-card">
        <h2 className="upload-title">
          Cập nhật tài liệu
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Tiêu đề</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faFont} className="input-icon" />
              <input type="text" className="form-input" {...register('Title', { required: 'Vui lòng nhập tiêu đề' })} />
            </div>
            {errors.Title && <p className="error-text">{errors.Title.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faParagraph} className="input-icon" />
              <textarea className="form-input" {...register('Description')} />
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
                id="tag-input"
                className="form-input"
                style={{ flexGrow: 1 }}
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
              </div>
              <button type="button" className="tag-button" onClick={handleExternalAddTag}>
                Thêm Tag
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">File tài liệu</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faPaperclip} className="input-icon" />
              <input type="file" className="form-input" accept=".pdf,.docx,.txt" {...register('File')} onChange={handleFileChange} />
            </div>
          </div>

          <div className="form-group margin-bottom">
            <label className="form-label">Ảnh bìa</label>
            {currentCoverImageUrl && !previewNewCover && (
              <div className="preview-container">
                <p>Ảnh bìa hiện tại:</p>
                <img src={currentCoverImageUrl} alt="Ảnh bìa hiện tại" style={{ maxWidth: '200px', border: '1px solid #ddd' }} />
              </div>
            )}
            {previewNewCover && (
              <div className="preview-container">
                <p>Xem trước ảnh bìa mới:</p>
                <img src={previewNewCover} alt="Xem trước ảnh bìa mới" style={{ maxWidth: '200px', border: '1px solid #ddd' }} />
              </div>
            )}
            <div className="input-wrapper file-input-group">
              <FontAwesomeIcon icon={faImage} className="file-input-icon" />
              <input type="file" className="form-input file-input" accept="image/jpeg,image/png,image/gif" {...register('CoverImage')} />
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            <FontAwesomeIcon icon={faCheckCircle} className="icon-margin-right" /> {loading ? 'Đang cập nhật...' : 'Cập nhật tài liệu'}
          </button>

          <button
            type="button"
            className="submit-button cancel-button"
            onClick={() => navigate('/profile')}
            style={{ background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)', marginTop: '10px' }}
          >
            <FontAwesomeIcon icon={faXmarkCircle} className="icon-margin-right" /> Hủy
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdateDocument;
