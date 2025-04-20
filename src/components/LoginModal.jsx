import React, { useState } from "react";
import { Modal, Box, Tabs, Tab, TextField, Button, Typography } from "@mui/material";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ open, onClose }) => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmail(email, password);
      onClose();
      navigate("/");
    } catch (error) {
      setError(error.message || "Đăng nhập thất bại");
    }
  };

  const handleSignUp = async () => {
    try {
      await signUpWithEmail(email, password, fullName);
      onClose();
      navigate("/");
    } catch (error) {
      setError(error.message || "Đăng ký thất bại");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
      navigate("/");
    } catch (error) {
      setError(error.message || "Đăng nhập bằng Google thất bại");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ width: 400, bgcolor: "white", p: 3, mx: "auto", mt: "10%", borderRadius: 2 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
          <Tab label="Đăng nhập" value="login" />
          <Tab label="Đăng ký" value="signup" />
        </Tabs>
        {error && <Typography color="error" mt={2}>{error}</Typography>}
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Mật khẩu"
          fullWidth
          margin="normal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {tab === "signup" && (
          <TextField
            label="Họ và tên"
            fullWidth
            margin="normal"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        {tab === "login" ? (
          <Button onClick={handleLogin} variant="contained" fullWidth sx={{ mt: 2 }}>
            Đăng nhập
          </Button>
        ) : (
          <Button onClick={handleSignUp} variant="contained" fullWidth sx={{ mt: 2 }}>
            Đăng ký
          </Button>
        )}
        <Button onClick={handleGoogleSignIn} variant="outlined" fullWidth sx={{ mt: 2 }}>
          Đăng nhập bằng Google
        </Button>
      </Box>
    </Modal>
  );
};

export default LoginModal;