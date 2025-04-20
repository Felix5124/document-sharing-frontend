import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, Button } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import DocumentCard from "../components/DocumentCard";
import { getDocuments, getCategories } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const HomePage = () => {
  const { loading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docResponse = await getDocuments({ SortBy: "DownloadCount", Page: 1, PageSize: 10 });
        const catResponse = await getCategories();
        setDocuments(docResponse.data.documents || []);
        setCategories(catResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Typography>Đang tải...</Typography>;

  return (
    <>
      <Header />
      <Container sx={{ mt: 4 }}>
        <img
          src="/banner.jpg"
          alt="Banner"
          style={{ width: "30%", height: 200, objectFit: "cover", borderRadius: 8 }}
        />
        <Typography variant="h4" mt={4}>
          Tài liệu nổi bật
        </Typography>
        <Grid container spacing={2} mt={2}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.documentId}>
              <DocumentCard document={doc} />
            </Grid>
          ))}
        </Grid>
        <Typography variant="h4" mt={4}>
          Danh mục phổ biến
        </Typography>
        <Grid container spacing={2} mt={2}>
          {categories.map((cat) => (
            <Grid item key={cat.categoryId}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/search?category=${cat.categoryId}`)}
              >
                {cat.name}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Footer />
      <LoginModal open={isLoginPage} onClose={() => navigate("/")} />
    </>
  );
};

export default HomePage;