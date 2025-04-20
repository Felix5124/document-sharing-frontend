import React from "react";
import { Card, CardContent, CardMedia, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const DocumentCard = ({ document }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardMedia
        component="img"
        height="140"
        image={document.thumbnail || "/default-thumbnail.jpg"}
        alt={document.title}
      />
      <CardContent>
        <Typography variant="h6">{document.title}</Typography>
        <Typography color="text.secondary">{document.category?.name || "Không có danh mục"}</Typography>
        <Typography>Lượt tải: {document.downloadCount}</Typography>
        <Typography>Điểm yêu cầu: {document.pointsRequired}</Typography>
        <Button
          variant="contained"
          onClick={() => navigate(`/documents/${document.documentId}`)}
        >
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;