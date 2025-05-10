import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Khôi phục trạng thái user và token từ localStorage khi ứng dụng khởi động
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    } else {
      // Nếu không có token hoặc user, đảm bảo trạng thái sạch
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, []);

  const login = (userData, token) => {
    // Lưu user và token
    if (userData && typeof userData === 'object' && token && typeof token === 'string') {
      setUser(userData);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
    } else {
      console.warn('Dữ liệu đăng nhập không hợp lệ:', { userData, token });
      throw new Error('Dữ liệu đăng nhập không hợp lệ.');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};