import React, { useState, useEffect } from "react";
import { Container, Typography, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, Button, Box } from "@mui/material";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { getPendingDocuments, approveDocument, deleteDocument, getDocuments } from "../services/api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("documents");
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [stats, setStats] = useState({ documentCount: 0, userCount: 0, downloadCount: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const pendingResponse = await getPendingDocuments();
        const docResponse = await getDocuments();
        setPendingDocuments(pendingResponse.data);
        
        // Tính thống kê
        const documentCount = docResponse.data.length;
        const downloadCount = docResponse.data.reduce((sum, doc) => sum + doc.downloadCount, 0);
        setStats({ documentCount, userCount: 0, downloadCount });
      } catch (error) {
        setError(error.response?.data?.message || "Không thể tải dữ liệu");
      }
    };
    fetchData();
  }, [user, navigate]);

  const handleApprove = async (id) => {
    try {
      await approveDocument(id);
      setPendingDocuments(pendingDocuments.filter((doc) => doc.documentId !== id));
    } catch (error) {
      setError(error.response?.data?.message || "Duyệt thất bại");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      setPendingDocuments(pendingDocuments.filter((doc) => doc.documentId !== id));
    } catch (error) {
      setError(error.response?.data?.message || "Xóa thất bại");
    }
  };

  const chartData = {
    labels: ["Tài liệu", "Lượt tải"],
    datasets: [
      {
        label: "Thống kê",
        data: [stats.documentCount, stats.downloadCount],
        backgroundColor: ["#1976d2", "#ff9800"],
      },
    ],
  };

  return (
    <>
    <Header />
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Bảng quản trị
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
        <Tab label="Kiểm duyệt tài liệu" value="documents" />
        <Tab label="Quản lý người dùng" value="users" disabled />
        <Tab label="Thống kê" value="stats" />
      </Tabs>
      {tab === "documents" && (
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Tác giả</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingDocuments.length > 0 ? (
              pendingDocuments.map((doc) => (
                <TableRow key={doc.documentId}>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell>{doc.user?.fullName || "Không xác định"}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(doc.documentId)}
                      sx={{ mr: 1 }}
                    >
                      Duyệt
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(doc.documentId)}
                    >
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>Không có tài liệu chờ duyệt.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {tab === "users" && (
        <Typography mt={2}>
          Tính năng này sẽ được triển khai trong tương lai.
        </Typography>
      )}
      {tab === "stats" && (
        <Box mt={4}>
          <Typography variant="h6">Thống kê hệ thống</Typography>
          <Typography variant="body2" mb={2}>
            Số người dùng: Chưa khả dụng (yêu cầu endpoint /api/users).
          </Typography>
          <Bar data={chartData} options={{ responsive: true }} />
        </Box>
      )}
    </Container>
    <Footer />
    </>
  );
};

export default AdminDashboard;