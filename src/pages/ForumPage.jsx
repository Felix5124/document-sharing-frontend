import React, { useState, useEffect } from "react";
import { Container, Typography, Box, TextField, Button, List, ListItem, ListItemText, Divider } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { getPosts, createPost, getPostById, getPostComments, createPostComment, deletePost } from "../services/api";
import { useAuth } from "../context/useAuth";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ForumPage = () => {
  const { postId } = useParams(); // Nếu xem chi tiết bài viết
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (postId) {
      // Xem chi tiết bài viết
      const fetchPost = async () => {
        try {
          const postResponse = await getPostById(postId);
          const commentResponse = await getPostComments(postId);
          setPost(postResponse.data);
          setComments(commentResponse.data);
        } catch (error) {
          setError(error.response?.data?.message || "Không thể tải bài viết");
        }
      };
      fetchPost();
    } else {
      // Danh sách bài viết
      const fetchPosts = async () => {
        try {
          const response = await getPosts();
          setPosts(response.data);
        } catch (error) {
          setError(error.response?.data?.message || "Không thể tải danh sách bài viết");
        }
      };
      fetchPosts();
    }
  }, [postId]);

  const handleCreatePost = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await createPost({ title, content });
      setTitle("");
      setContent("");
      const response = await getPosts();
      setPosts(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Không thể đăng bài");
    }
  };

  const handleDeletePost = async (id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p.postId !== id));
    } catch (error) {
      setError(error.response?.data?.message || "Không thể xóa bài");
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await createPostComment({ postId: parseInt(postId), content: newComment });
      setNewComment("");
      const commentResponse = await getPostComments(postId);
      setComments(commentResponse.data);
    } catch (error) {
      setError(error.response?.data?.message || "Không thể gửi bình luận");
    }
  };

  if (error) return <Typography color="error">{error}</Typography>;

  if (postId && post) {
    // Chi tiết bài viết
    return (
      <Container>
        <Typography variant="h4" mt={4} mb={2}>
          {post.title}
        </Typography>
        <Typography variant="body1" mb={2}>{post.content}</Typography>
        <Typography variant="body2">Tác giả: {post.user?.fullName}</Typography>
        <Typography variant="body2">
          Ngày đăng: {new Date(post.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="body2">Lượt xem: {post.viewCount}</Typography>
        {user && user.userId === post.userId && (
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeletePost(post.postId)}
            sx={{ mt: 2 }}
          >
            Xóa bài viết
          </Button>
        )}
        <Box mt={4}>
          <Typography variant="h6">Bình luận</Typography>
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
          <List>
            {comments.map((comment) => (
              <ListItem key={comment.postCommentId}>
                <ListItemText
                  primary={`${comment.user?.fullName}: ${comment.content}`}
                  secondary={new Date(comment.createdAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Container>
    );
  }

  // Danh sách bài viết
  return (
    <>
    <Header />
    <Container>
      <Typography variant="h4" mt={4} mb={2}>
        Diễn đàn
      </Typography>
      {user && (
        <Box component="form" mt={2} mb={4}>
          <TextField
            label="Tiêu đề"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Nội dung"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button variant="contained" onClick={handleCreatePost} sx={{ mt: 2 }}>
            Đăng bài
          </Button>
        </Box>
      )}
      <List>
        {posts.map((post) => (
          <React.Fragment key={post.postId}>
            <ListItem
              button
              onClick={() => navigate(`/forum/${post.postId}`)}
            >
              <ListItemText
                primary={post.title}
                secondary={`Tác giả: ${post.user?.fullName} | Ngày đăng: ${new Date(post.createdAt).toLocaleString()} | Lượt xem: ${post.viewCount}`}
              />
              {user && user.userId === post.userId && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost(post.postId);
                  }}
                >
                  Xóa
                </Button>
              )}
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Container>
    <Footer />
    </>
  );
};

export default ForumPage;