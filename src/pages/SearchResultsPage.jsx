import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchDocuments } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return '0 Bytes';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const queryKeyword = useMemo(() => searchParams.get('keyword'), [searchParams]);
  const queryCategory = useMemo(() => searchParams.get('categoryId'), [searchParams]);
  const queryFileType = useMemo(() => searchParams.get('fileType'), [searchParams]);
  const querySortBy = useMemo(() => searchParams.get('sortBy'), [searchParams]);
  const queryPage = useMemo(() => searchParams.get('page'), [searchParams]);
  const queryPageSize = useMemo(() => searchParams.get('pageSize'), [searchParams]);
  const queryTags = useMemo(() => searchParams.getAll('tags'), [searchParams]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const paramsToApi = {};
        if (queryTags && queryTags.length > 0) {
          paramsToApi.tags = queryTags;
        }
        if (queryKeyword) {
          paramsToApi.keyword = queryKeyword;
        }
        if (queryCategory) {
          paramsToApi.categoryId = parseInt(queryCategory, 10);
        }
        if (queryFileType) {
          paramsToApi.fileType = queryFileType;
        }
        if (querySortBy) {
          paramsToApi.sortBy = querySortBy;
        }
        paramsToApi.page = queryPage ? parseInt(queryPage, 10) : 1;
        paramsToApi.pageSize = queryPageSize ? parseInt(queryPageSize, 10) : 10;

        const response = await searchDocuments(paramsToApi);
        setDocuments(response.data.documents || []);
        setTotalResults(response.data.total || 0);

      } catch (err) {
        setError(err.response?.data?.message || err.message || "Không thể tải kết quả tìm kiếm.");
        setDocuments([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    const hasMeaningfulSearchParams =
      (queryTags && queryTags.length > 0) ||
      queryKeyword ||
      queryCategory ||
      queryFileType;

    if (hasMeaningfulSearchParams) {
      fetchResults();
    } else {
      setLoading(false);
      setDocuments([]);
      setTotalResults(0);
    }
  }, [queryTags, queryKeyword, queryCategory, queryFileType, querySortBy, queryPage, queryPageSize]);

  if (loading) {
    return <div className="container mt-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Đang tải...</span></div><p className="mt-2">Đang tải kết quả...</p></div>;
  }

  if (error) {
    return <div className="container mt-3"><p className="alert alert-danger">Lỗi: {error}</p></div>;
  }

  return (
    <div className="container my-4">
      <h2 className="mb-4">Kết quả tìm kiếm</h2>
      <p className="text-muted mb-4">Tìm thấy {totalResults} tài liệu.</p>
      {documents.length > 0 ? (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {documents.map(doc => (
            <div key={doc.documentId} className="col">
              <div className="card h-100 shadow-sm document-card">
                <Link to={`/document/${doc.documentId}`} className="text-decoration-none">
                  <img
                    src={getFullImageUrl(doc.coverImageUrl)}
                    className="card-img-top"
                    alt={doc.title}
                    style={{ height: '200px', objectFit: 'cover', borderBottom: '1px solid #eee' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFullImageUrl(null);
                    }}
                  />
                </Link>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title h6">
                    <Link to={`/document/${doc.documentId}`} className="text-decoration-none text-dark stretched-link" title={doc.title}>
                      {doc.title.length > 55 ? doc.title.substring(0, 55) + '...' : doc.title}
                    </Link>
                  </h5>
                  <p className="card-text text-muted small mb-1 flex-grow-1">
                    {doc.description ? (doc.description.length > 70 ? doc.description.substring(0, 70) + '...' : doc.description) : 'Không có mô tả.'}
                  </p>
                  <div className="mt-auto">
                    {doc.category?.name && (
                      <p className="card-text text-muted small mb-1">
                        <i className="bi bi-folder me-1"></i>{doc.category.name}
                      </p>
                    )}
                    <p className="card-text text-muted small mb-1">
                      <i className="bi bi-person me-1"></i>{doc.email || 'N/A'}
                    </p>
                    <div className="d-flex justify-content-between align-items-center text-muted small">
                      <span><i className="bi bi-download me-1"></i>{doc.downloadCount || 0}</span>
                      <span>{doc.fileType?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                {doc.tags && doc.tags.length > 0 && (
                  <div className="card-footer bg-transparent border-top-0 pt-0 pb-2 px-2">
                    {doc.tags.slice(0, 3).map(tag => (
                      <Link key={tag.tagId || tag.name} to={`/search?tags=${encodeURIComponent(tag.name)}`} className="badge bg-light text-dark me-1 mb-1 text-decoration-none" style={{fontSize: '0.7em'}}>
                        #{tag.name}
                      </Link>
                    ))}
                    {doc.tags.length > 3 && <span className="badge bg-light text-dark mb-1" style={{fontSize: '0.7em'}}>...</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
            <i className="bi bi-search display-4 text-muted"></i>
            <p className="mt-3">Không có tài liệu nào phù hợp với tìm kiếm của bạn.</p>
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;