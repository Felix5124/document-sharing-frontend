import React, { useState, useEffect } from "react";
import { Container, Typography, Button, TextField, Rating, Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { getDocumentById, previewDocument, downloadDocument, createComment, getCommentsByDocument, createFollow } from "../services/api";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Cấu hình pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docResponse = await getDocumentById(id);
        setDocument(docResponse.data);

        const commentResponse = await getCommentsByDocument(id);
        setComments(commentResponse.data);

        // Lấy preview PDF nếu là file PDF
        if (docResponse.data.fileType === "PDF") {
          const previewResponse = await previewDocument(id);
          const blob = new Blob([previewResponse.data], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (error) {
        setError(error.response?.data?.message || "Không thể tải tài liệu");
      }
    };
    fetchData();
  }, [id]);

  const handleDownload = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const response = await downloadDocument(id);
      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${document.title}.${document.fileType.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.response?.data?.message || "Không thể tải tài liệu");
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await createComment({ documentId: parseInt(id), content: newComment, rating });
      const commentResponse = await getCommentsByDocument(id);
      setComments(commentResponse.data);
      setNewComment("");
      setRating(0);
    } catch (error) {
      setError(error.response?.data?.message || "Không thể gửi bình luận");
    }
  };

  const handleFollowAuthor = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await createFollow({ followedUserId: document.uploadedBy });
      alert("Đã theo dõi tác giả!");
    } catch (error) {
      setError(error.response?.data?.message || "Không thể theo dõi");
    }
  };

  if (error) return <Typography color="error">{error}</Typography>;
  if (!document) return <Typography>Đang tải...</Typography>;

  return (
    <>
    <Header />
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        {document.title}
      </Typography>
      <Typography variant="body1" mb={2}>{document.description}</Typography>
      <Typography variant="body2">Danh mục: {document.category?.name}</Typography>
      <Typography variant="body2">Tác giả: {document.user?.fullName}</Typography>
      <Typography variant="body2">Lượt tải: {document.downloadCount}</Typography>
      <Typography variant="body2">Điểm yêu cầu: {document.pointsRequired}</Typography>
      <Typography variant="body2">Ngày đăng: {new Date(document.uploadedAt).toLocaleDateString()}</Typography>
      
      {pdfUrl && (
        <Box mt={4}>
          <Typography variant="h6">Xem trước</Typography>
          <Document file={pdfUrl}>
            <Page pageNumber={1} width={400} />
          </Document>
        </Box>
      )}

      <Box mt={2}>
        <Button variant="contained" onClick={handleDownload} sx={{ mr: 2 }}>
          Tải xuống
        </Button>
        <Button variant="outlined" onClick={handleFollowAuthor}>
          Theo dõi tác giả
        </Button>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Đánh giá và bình luận</Typography>
        <Rating value={rating} onChange={(e, newValue) => setRating(newValue)} />
        <TextField
          label="Bình luận"
          fullWidth
          multiline
          rows={4}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ mt: 2 }}
        />
        <Button variant="contained" onClick={handleCommentSubmit} sx={{ mt: 2 }}>
          Gửi bình luận
        </Button>
        {comments.map((comment) => (
          <Box key={comment.commentId} mt={2} p={2} border={1} borderRadius={2}>
            <Typography variant="body2">{comment.user?.fullName}: {comment.content}</Typography>
            <Rating value={comment.rating} readOnly />
            <Typography variant="caption">{new Date(comment.createdAt).toLocaleString()}</Typography>
          </Box>
        ))}
      </Box>
    </Container>
    <Footer />
    </>
  );
};

export default DocumentDetailPage;