import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, TextField, Button, MenuItem, Pagination } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DocumentCard from "../components/DocumentCard";
import { searchDocuments, getCategories } from "../services/api";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  
  const [keyword, setKeyword] = useState(query.get("q") || "");
  const [categoryId, setCategoryId] = useState(query.get("category") || "");
  const [fileType, setFileType] = useState("");
  const [sortBy, setSortBy] = useState("UploadedAt");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const params = {
          Keyword: keyword,
          CategoryId: categoryId || undefined,
          FileType: fileType || undefined,
          SortBy: sortBy,
          Page: page,
          PageSize: pageSize,
        };
        const response = await searchDocuments(params);
        setDocuments(response.data.items || []);
        setTotalCount(response.data.totalCount || 0);
      } catch (error) {
        console.error("Error searching documents:", error);
      }
    };
    fetchDocuments();
  }, [keyword, categoryId, fileType, sortBy, page, pageSize]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (categoryId) params.set("category", categoryId);
    navigate(`/search?${params.toString()}`);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <>
    <Header />
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Tìm kiếm tài liệu
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Từ khóa"
            fullWidth
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Danh mục"
            fullWidth
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Định dạng"
            fullWidth
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="Word">Word</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            label="Sắp xếp theo"
            fullWidth
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="UploadedAt">Mới nhất</MenuItem>
            <MenuItem value="DownloadCount">Phổ biến</MenuItem>
            <MenuItem value="Rating">Đánh giá</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" fullWidth onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc.documentId}>
            <DocumentCard document={doc} />
          </Grid>
        ))}
      </Grid>
      {totalCount > 0 && (
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={page}
          onChange={handlePageChange}
          sx={{ mt: 4, display: "flex", justifyContent: "center" }}
        />
      )}
    </Container>
    <Footer />
    </>
  );
};

export default SearchPage;