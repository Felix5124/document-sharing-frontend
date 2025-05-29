import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getDocumentById, updateDocument, getCategories } from '../services/api'; // Giả sử api.js là file bạn cung cấp

function UpdateDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      Title: '', Description: '', CategoryId: '', UploadedBy: '', PointsRequired: 0,
      Tags: [],
      File: null, // Khởi tạo File là null
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
          : 'Chưa có file'; // Hiển thị rõ hơn nếu không có file
        setFileName(fileNameFromUrl);
        // Không setValue cho 'File' ở đây vì đây là file đã có, không phải file người dùng mới chọn

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
        setFileName(document?.FileUrl ? document.FileUrl.split('/').pop() : 'Chưa có file'); // Reset về tên file cũ hoặc mặc định
        setValue('File', null, { shouldValidate: true }); // Quan trọng: đặt lại giá trị trong RHF
        return;
      }
      setFileName(selectedFile.name);
      setValue('File', e.target.files, { shouldValidate: true });
    } else {
      // Nếu người dùng bỏ chọn file (một số trình duyệt cho phép điều này)
      setFileName(document?.FileUrl ? document.FileUrl.split('/').pop() : 'Chưa có file'); // Reset về tên file cũ hoặc mặc định
      setValue('File', null, { shouldValidate: true }); // Quan trọng: đặt lại giá trị trong RHF
    }
  };

  const onSubmit = async (data) => {
    console.log('Raw form data from React Hook Form (data):', data);

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

      // Xử lý file tài liệu (nếu có file mới được chọn)
      if (data.File && data.File.length > 0) {
        const selectedFile = data.File[0];
        // Validation file type đã làm trong handleFileChange, nhưng kiểm tra lại cho chắc
        const extension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(extension)) {
          toast.error('File tài liệu chỉ chấp nhận định dạng PDF, DOCX, hoặc TXT.');
          return;
        }
        formData.append('File', selectedFile);
        console.log('New document file appended to FormData:', selectedFile.name);
      } else {
        console.log('No new document file selected to append to FormData.');
        // Quan trọng: Nếu backend YÊU CẦU trường 'File' ngay cả khi không thay đổi,
        // đây là nơi bạn sẽ gặp vấn đề. Backend nên linh hoạt hơn.
        // Không thể dễ dàng gửi lại file cũ từ đây nếu không có file mới.
      }

      if (data.CoverImage && data.CoverImage.length > 0) {
        formData.append('CoverImage', data.CoverImage[0]);
        console.log('Cover image appended to FormData:', data.CoverImage[0].name);
      } else {
        console.log('No new cover image selected.');
      }

      if (data.Tags && Array.isArray(data.Tags)) {
        if (data.Tags.length > 0) {
          data.Tags.forEach(tagObject => {
            formData.append('Tags', tagObject.label);
          });
        } else {
           if (window.location.pathname.includes('/update-document/')) {
             formData.append('Tags', ''); // Gửi string rỗng nếu không có tag nào khi update
           }
        }
      }
      console.log('Tags appended to FormData:', data.Tags?.map(t => t.label) || 'None or empty string');
      
      console.log('--- FormData entries before sending ---');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? value.name : value);
      }
      console.log('------------------------------------');

      setLoading(true);
      await updateDocument(id, formData);
      toast.success('Cập nhật tài liệu thành công.');
      navigate('/profile');
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.File?.join(', ') || // Cố gắng lấy lỗi cụ thể của trường File
        error.response?.data?.message ||
        error.response?.data?.title ||
        JSON.stringify(error.response?.data) || // Hiển thị toàn bộ lỗi data nếu có
        error.message ||
        'Cập nhật tài liệu thất bại.';
      console.error('Update error details:', error.response || error);
      toast.error(`Lỗi: ${errorMessage}`, { toastId: 'update-error' });
    } finally {
      setLoading(false);
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

  if (loading || !document) return <div>Đang tải...</div>;

  return (
    <div className="update-document-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 className="update-document-title" style={{ marginBottom: '20px' }}>
        <i className="bi bi-pencil-square me-2"></i> Cập nhật tài liệu
      </h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Title Input */}
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
        
        {/* Tag Input Section */}
        <div className="form-group mb-3" style={{ marginTop: '10px' }}>
          <label className="form-label" htmlFor="external-tag-input">Tags</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              id="external-tag-input"
              className="form-input" 
              style={{ flexGrow: 1, width: '100%', padding: '10px 10px 10px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
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

        {/* Display Current Tags */}
        {currentTags && currentTags.length > 0 && (
          <div className="external-tags-display" style={{
            marginTop: '20px',
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
        
        {/* Description Input */}
        <div className="form-group" style={{ marginTop: '20px', marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Mô tả</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <i className="bi bi-chat-text input-icon" style={{ position: 'absolute', left: '10px', top: '15px' }}></i>
            <textarea
              className="form-input"
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }}
              {...register('Description')}
            />
          </div>
        </div>

        {/* Category Select */}
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

        {/* UploadedBy Input (Disabled) */}
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

        {/* PointsRequired Input */}
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

        {/* File Input */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>File tài liệu (để trống nếu không muốn thay đổi)</label>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>File hiện tại: </span>
            {fileName || 'Chưa có file'}
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            {...register('File')} // Vẫn giữ register để RHF biết về trường này
            onChange={handleFileChange} // Xử lý việc set giá trị cho RHF và hiển thị tên file
          />
           {errors.File && <p className="error-text" style={{ color: 'red', marginTop: '5px' }}>{errors.File.message}</p>}
        </div>
        
        {/* CoverImage Input */}
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
              {...register('CoverImage')}
            />
          </div>
          <small className="form-text text-muted">Để trống nếu không muốn thay đổi ảnh bìa.</small>
        </div>

        {/* Submit and Cancel Buttons */}
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