import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Tabs, Tab, TextField, Button, Grid, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DocumentCard from "../components/DocumentCard";
import { getUserById, updateUser, getDocuments, getUserBadges } from "../services/api";
import { useAuth } from "../context/useAuth";
import { LinearProgress } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [badges, setBadges] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const userResponse = await getUserById(user.userId);
        const docResponse = await getDocuments({ UploadedBy: user.userId });
        const badgeResponse = await getUserBadges();
        setProfile(userResponse.data);
        setFullName(userResponse.data.fullName);
        setSchool(userResponse.data.school || "");
        setAvatarUrl(userResponse.data.avatarUrl || "");
        setUploadedDocuments(docResponse.data);
        setBadges(badgeResponse.data);
      } catch (error) {
        setError(error.response?.data?.message || "Không thể tải thông tin");
      }
    };
    fetchData();
  }, [user, navigate]);

  const handleUpdate = async () => {
    try {
      await updateUser(user.userId, { fullName, school, avatarUrl });
      setProfile({ ...profile, fullName, school, avatarUrl });
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      setError(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  // Thêm hàm tính tiến trình
  const calculateProgress = (points, level) => {
    const thresholds = { Newbie: 0, Scholar: 100, Master: 500 };
    const nextLevel = level === "Newbie" ? "Scholar" : level === "Scholar" ? "Master" : "Master";
    const currentThreshold = thresholds[level];
    const nextThreshold = thresholds[nextLevel] || currentThreshold;
    if (nextThreshold === currentThreshold) return 100;
    return Math.min(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);
  };

  if (loading || !profile) return <Typography>Đang tải...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <>
    <Header />
    <Container>
      <Box display="flex" mt={4} mb={4}>
        <Avatar src={avatarUrl} sx={{ width: 100, height: 100, mr: 2 }} />
        <Box>
          <Typography variant="h4">{profile.fullName}</Typography>
          <Typography>Cấp bậc: {profile.level}</Typography>
          <Typography>Điểm: {profile.points}</Typography>
          <Typography>Trường: {profile.school || "Chưa cập nhật"}</Typography>
          <LinearProgress
            variant="determinate"
            value={calculateProgress(profile.points, profile.level)} // Hàm tính tiến trình
            sx={{ mt: 1 }}
          />
        </Box>
      </Box>
      <Typography variant="h6">Huy hiệu</Typography>
      <Grid container spacing={2} mb={4}>
        {badges.map((badge) => (
          <Grid item key={badge.badgeId}>
            <Box border={1} p={1} borderRadius={2}>
              <Typography>{badge.name}</Typography>
              <Typography variant="caption">{badge.description}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
        <Tab label="Thông tin cá nhân" value="info" />
        <Tab label="Lịch sử tải lên" value="uploads" />
        <Tab label="Lịch sử tải xuống" value="downloads" disabled />
        <Tab label="Thư viện cá nhân" value="library" disabled />
      </Tabs>
      {tab === "info" && (
        <Box component="form" mt={2}>
          <TextField
            label="Họ và tên"
            fullWidth
            margin="normal"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <TextField
            label="Trường học"
            fullWidth
            margin="normal"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
          />
          <TextField
            label="URL ảnh đại diện"
            fullWidth
            margin="normal"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <Button variant="contained" onClick={handleUpdate} sx={{ mt: 2 }}>
            Cập nhật
          </Button>
        </Box>
      )}
      {tab === "uploads" && (
        <Grid container spacing={2} mt={2}>
          {uploadedDocuments.length > 0 ? (
            uploadedDocuments.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.documentId}>
                <DocumentCard document={doc} />
              </Grid>
            ))
          ) : (
            <Typography>Chưa có tài liệu nào được tải lên.</Typography>
          )}
        </Grid>
      )}
      {tab === "downloads" && (
        <Typography mt={2}>Tính năng này sẽ được triển khai trong tương lai.</Typography>
      )}
      {tab === "library" && (
        <Typography mt={2}>Tính năng này sẽ được triển khai trong tương lai.</Typography>
      )}
    </Container>
    <Footer />
    </>
  );
};

export default ProfilePage;