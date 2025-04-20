import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, List, ListItem, ListItemText, Button } from "@mui/material";
import { getNotifications, markNotificationAsRead } from "../services/api";
import { useAuth } from "../context/useAuth";

const NotificationModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !open) return;

    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        setNotifications(response.data);
      } catch (error) {
        setError(error.response?.data?.message || "Không thể tải thông báo");
      }
    };
    fetchNotifications();
  }, [user, open]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map((n) => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch (error) {
      setError(error.response?.data?.message || "Không thể đánh dấu đã đọc");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ width: 400, bgcolor: "white", p: 3, mx: "auto", mt: "10%", borderRadius: 2 }}>
        <Typography variant="h6" mb={2}>Thông báo</Typography>
        {error && <Typography color="error">{error}</Typography>}
        <List>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <ListItem
                key={notification.notificationId}
                sx={{ bgcolor: notification.isRead ? "inherit" : "#f0f0f0" }}
              >
                <ListItemText
                  primary={notification.message}
                  secondary={new Date(notification.sentAt).toLocaleString()}
                />
                {!notification.isRead && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleMarkAsRead(notification.notificationId)}
                  >
                    Đã đọc
                  </Button>
                )}
              </ListItem>
            ))
          ) : (
            <Typography>Không có thông báo.</Typography>
          )}
        </List>
      </Box>
    </Modal>
  );
};

export default NotificationModal;