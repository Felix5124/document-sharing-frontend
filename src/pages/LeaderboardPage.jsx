import React, { useState, useEffect } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, TextField, MenuItem } from "@mui/material";
import { getRanking } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await getRanking({ limit: 10, filter });
        setUsers(response.data);
      } catch (error) {
        setError(error.response?.data?.message || "Không thể tải bảng xếp hạng");
      }
    };
    fetchRanking();
  }, [filter]);

  return (
    <>
    <Header />
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Bảng xếp hạng
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        select
        label="Lọc theo"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2, minWidth: 150 }}
      >
        <MenuItem value="all">Mọi thời đại</MenuItem>
        <MenuItem value="week">Theo tuần</MenuItem>
        <MenuItem value="month">Theo tháng</MenuItem>
      </TextField>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Xếp hạng</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Điểm</TableCell>
            <TableCell>Tài liệu tải lên</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.userId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.points}</TableCell>
              <TableCell>{user.documentsUploaded}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
    <Footer />
    </>
  );
};

export default LeaderboardPage;