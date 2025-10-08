import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchDocuments } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import '../styles/pages/SearchResultsPage.css';

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
    return <div className="loading-container"><div className="loading-spinner" role="status"></div><p className="loading-text">Đang tải kết quả...</p></div>;
  }

  if (error) {
    return <div className="search-results-container"><div className="error-message">Lỗi: {error}</div></div>;
  }

  return (
    <div className="search-results-container">
      <div className="search-results-header">
        <h2 className="search-results-title">Kết quả tìm kiếm</h2>
        <p className="search-results-count">Tìm thấy {totalResults} tài liệu.</p>
      </div>
      {documents.length > 0 ? (
        <div className="documents-grid">
          {documents.map(doc => (
            <div key={doc.documentId} className="document-card">
              <div className="card-img-container">
                <Link to={`/document/${doc.documentId}`}>
                  <img
                    src={getFullImageUrl(doc.coverImageUrl)}
                    className="card-img-top"
                    alt={doc.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFullImageUrl(null);
                    }}
                  />
                </Link>
              </div>
              <div className="card-body">
                <h5 className="card-title">
                  <Link to={`/document/${doc.documentId}`} title={doc.title}>
                    {doc.title.length > 55 ? doc.title.substring(0, 55) + '...' : doc.title}
                  </Link>
                </h5>
                <p className="card-description">
                  {doc.description ? (doc.description.length > 70 ? doc.description.substring(0, 70) + '...' : doc.description) : 'Không có mô tả.'}
                </p>
                <div className="card-meta">
                  {doc.category?.name && (
                    <div className="meta-item">
                      <span className="icon folder-icon"></span>{doc.category.name}
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="icon person-icon"></span>{doc.email || 'N/A'}
                  </div>
                  <div className="meta-item">
                    <span className="icon download-icon"></span>{doc.downloadCount || 0}
                    <span className="file-type">{doc.fileType?.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              {doc.tags && doc.tags.length > 0 && (
                <div className="card-footer">
                  <div className="tag-container">
                    {doc.tags.slice(0, 3).map(tag => (
                      <Link key={tag.tagId || tag.name} to={`/search?tags=${encodeURIComponent(tag.name)}`} className="tag-badge">
                        #{tag.name}
                      </Link>
                    ))}
                    {doc.tags.length > 3 && <span className="tag-badge">...</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
            <span className="empty-icon search-icon"></span>
            <p className="empty-message">Không có tài liệu nào phù hợp với tìm kiếm của bạn.</p>
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;