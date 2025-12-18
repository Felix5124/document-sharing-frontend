import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDocumentById, updateDocument, getCategories } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import imageCompression from 'browser-image-compression';
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
      CoverImage: null,
    }
  });
  const [tagInputText, setTagInputText] = useState('');
  const [document, setDocument] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState('');
  const [previewNewCover, setPreviewNewCover] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSubmittingRef = useRef(false);
  const navigatedRef = useRef(false);

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
          console.log('[UpdateDocument] fetched document:', docData);
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

        

        // Support both camelCase and PascalCase keys from backend
        const coverKey = docData.CoverImageUrl || docData.coverImageUrl || docData.Cover || docData.cover || docData.CoverImageUrl;
        if (coverKey && typeof coverKey === 'string' && coverKey.trim() !== '') {
          setCurrentCoverImageUrl(getFullImageUrl(coverKey));
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
      console.log('[UpdateDocument] new cover file selected:', { name: file.name, size: file.size, type: file.type });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewNewCover(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewNewCover(null);
    }
  }, [newCoverImageFile]);

  

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
    // Ensure the page scrolls to top so the loading state is visible (instant)
    if (typeof window !== 'undefined' && window.scrollTo) {
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch(e) { /* ignore */ }
    }

    if (isSubmittingRef.current) {
      console.log('[UpdateDocument] submit skipped: already submitting');
      return;
    }
    isSubmittingRef.current = true;

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

      // File replacement is not allowed during update — backend will keep existing file if none provided.

      if (newCoverImageFile && newCoverImageFile.length > 0) {
        try {
          const originalFile = newCoverImageFile[0];
          const options = { maxSizeMB: 0.7, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.7 };
          const compressedBlob = await imageCompression(originalFile, options);
          const compressedFile = new File([compressedBlob], originalFile.name, { type: compressedBlob.type });
          console.log('[UpdateDocument] compressed cover from', originalFile.size, 'to', compressedFile.size);
          formData.append('CoverImage', compressedFile);
        } catch (compressErr) {
          console.warn('[UpdateDocument] image compression failed, using original file', compressErr);
          formData.append('CoverImage', newCoverImageFile[0]);
        }
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

      // Log FormData entries for debugging
      for (const pair of formData.entries()) {
        // Files will appear as File objects
        console.log('[UpdateDocument] FormData entry:', pair[0], pair[1]);
      }

      console.log('[UpdateDocument] setLoading -> true');
      setLoading(true);
      console.log('[UpdateDocument] sending updateDocument request for id', id);
      const resp = await updateDocument(id, formData);
      console.log('[UpdateDocument] updateDocument response:', resp && resp.data ? resp.data : resp);

      // Fire-and-forget refresh: don't block navigation to avoid UI flicker
      getDocumentById(id).then((refreshed) => {
        console.log('[UpdateDocument] background refresh after update:', refreshed.data);
        const refreshedCover = refreshed.data?.CoverImageUrl || refreshed.data?.coverImageUrl || refreshed.data?.cover || '';
        if (refreshedCover && refreshedCover.trim() !== '') {
          setCurrentCoverImageUrl(getFullImageUrl(refreshedCover));
        }
      }).catch((refreshErr) => {
        console.warn('[UpdateDocument] background refresh failed:', refreshErr);
      });

      toast.success('Cập nhật tài liệu thành công.');
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        navigate('/profile');
      }
    } catch (error) {
      console.error('[UpdateDocument] update error:', error);
      console.error('[UpdateDocument] server response data:', error.response?.data);

      // If server returned validation errors, build a readable message
      let errorMessage = 'Cập nhật tài liệu thất bại.';
      const serverData = error.response?.data;
      if (serverData) {
        if (serverData.errors && typeof serverData.errors === 'object') {
          const parts = [];
          for (const key of Object.keys(serverData.errors)) {
            const val = serverData.errors[key];
            if (Array.isArray(val)) parts.push(`${key}: ${val.join(', ')}`);
            else parts.push(`${key}: ${val}`);
          }
          errorMessage = parts.join(' | ');
        } else if (serverData.message) {
          errorMessage = serverData.message;
        } else if (serverData.title) {
          errorMessage = serverData.title;
        } else {
          try { errorMessage = JSON.stringify(serverData); } catch(e) {}
        }
      } else {
        errorMessage = error.message || errorMessage;
      }

      console.error('[UpdateDocument] parsed error message:', errorMessage);
      toast.error(`Lỗi: ${errorMessage}`, { toastId: 'update-error' });
    } finally {
      if (!navigatedRef.current) {
        console.log('[UpdateDocument] setLoading -> false');
        setLoading(false);
      } else {
        console.log('[UpdateDocument] skipping setLoading false because navigated');
      }
      isSubmittingRef.current = false;
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
