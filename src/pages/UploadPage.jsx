import React, { useState, useEffect } from "react";
import { Container, Typography, TextField, Button, MenuItem, Box } from "@mui/material";
import { uploadDocument, getCategories } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pointsRequired, setPointsRequired] = useState(0);
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setError("Không thể tải danh mục");
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !categoryId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const formData = new FormData();
    formData.append("File", file);
    formData.append("Title", title);
    formData.append("Description", description);
    formData.append("CategoryId", categoryId);
    formData.append("UploadedBy", user.userId); // Giả định backend trả userId
    formData.append("PointsRequired", pointsRequired);

    try {
      await uploadDocument(formData);
      alert("Tải lên thành công! Bạn được cộng 10 điểm.");
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || "Tải lên thất bại");
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <>
    <Header />
    <Container maxWidth="sm">
      <Typography variant="h4" mt={4} mb={2}>
        Tải lên tài liệu
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Tiêu đề"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <TextField
          label="Mô tả"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          select
          label="Danh mục"
          fullWidth
          margin="normal"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          {categories.map((cat) => (
            <MenuItem key={cat.categoryId} value={cat.categoryId}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Điểm yêu cầu"
          type="number"
          fullWidth
          margin="normal"
          value={pointsRequired}
          onChange={(e) => setPointsRequired(e.target.value)}
          inputProps={{ min: 0 }}
        />
        <Button variant="contained" component="label" sx={{ mt: 2 }}>
          Chọn file (PDF/Word)
          <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        </Button>
        {file && <Typography mt={1}>{file.name}</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Tải lên
        </Button>
      </Box>
    </Container>
    <Footer />
    </>
  );
};

export default UploadPage;