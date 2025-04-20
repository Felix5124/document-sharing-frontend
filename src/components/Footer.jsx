import React from "react";
import { Box, Typography, Link } from "@mui/material";

const Footer = () => {
  return (
    <Box sx={{ mt: 4, py: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
      <Typography variant="body2">
        <Link href="/about" underline="hover" sx={{ mx: 1 }}>
          Giới thiệu
        </Link>
        |
        <Link href="/contact" underline="hover" sx={{ mx: 1 }}>
          Liên hệ
        </Link>
        |
        <Link href="/terms" underline="hover" sx={{ mx: 1 }}>
          Điều khoản sử dụng
        </Link>
      </Typography>
      <Typography variant="body2" mt={1}>
        © 2025 StuHub. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;