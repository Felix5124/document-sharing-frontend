import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Avatar } from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import SearchBar from "./SearchBar";
import NotificationModal from "./NotificationModal";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);

  const handleSearch = (keyword) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1}>
          <img
            src="/logo.jpg"
            alt="StuHub"
            style={{ height: 40, marginRight: 16, cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
          <SearchBar onSearch={handleSearch} />
        </Box>
        <Box>
          {user ? (
            <>
              <IconButton color="inherit" onClick={() => setOpenNotifications(true)}>
                <NotificationsIcon />
              </IconButton>
              <Button color="inherit" onClick={() => navigate("/upload")}>
                Tải lên
              </Button>
              <Avatar
                src={user.avatarUrl}
                sx={{ ml: 2, cursor: "pointer" }}
                onClick={() => navigate("/profile")}
              />
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate("/login")}>
              Đăng nhập/Đăng ký
            </Button>
          )}
        </Box>
      </Toolbar>
      {user && (
        <NotificationModal
          open={openNotifications}
          onClose={() => setOpenNotifications(false)}
        />
      )}
    </AppBar>
  );
};

export default Header;