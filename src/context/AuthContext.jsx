import { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getUserByFirebaseUid, createBackendUserForAuthProvider } from '../services/api'; // Thêm createBackendUserForAuthProvider
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm login nội bộ của context
  const contextLogin = (userData, idToken) => {
    if (userData && typeof userData === 'object' && idToken && typeof idToken === 'string') {
      setUser(userData);
      setToken(idToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', idToken);
    } else {
      console.error('Dữ liệu đăng nhập không hợp lệ cung cấp cho AuthContext:', { userData, idToken });
      // Không throw error ở đây để tránh crash app, chỉ log
    }
  };

  const contextLogout = async (showToast = true) => {
    // setIsLoading(true); // Không cần thiết phải setIsLoading ở đây nếu logout nhanh
    try {
      await firebaseSignOut(auth);
      if (showToast) {
        toast.success('Đăng xuất thành công!');
      }
    } catch (error) {
      console.error("Lỗi đăng xuất khỏi Firebase:", error);
      if (showToast) {
        toast.error("Lỗi khi đăng xuất. Vui lòng thử lại.");
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setIsLoading(false); // Đảm bảo set false sau khi xử lý xong, dù thành công hay thất bại
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let idToken;
        try {
          idToken = await firebaseUser.getIdToken(true);
          console.log("AuthContext: Firebase user detected:", firebaseUser.uid, "Attempting to fetch backend user data...");

          const userDetailsResponse = await getUserByFirebaseUid(firebaseUser.uid);
          const backendUserData = userDetailsResponse.data;

          if (backendUserData && backendUserData.userId && !backendUserData.isLocked) {
            console.log("AuthContext: Backend user data found:", backendUserData);
            contextLogin(backendUserData, idToken);
          } else if (backendUserData && backendUserData.isLocked) {
            toast.error('Tài khoản của bạn đã bị khóa.');
            await contextLogout(false); // Logout không cần toast thêm
          } else {
            // Trường hợp không mong muốn: backendUserData không hợp lệ dù request thành công (không phải 404)
            console.warn('AuthContext: Backend user data invalid or missing userId, logging out.', backendUserData);
            toast.error('Dữ liệu người dùng từ backend không hợp lệ.');
            await contextLogout(false);
          }
        } catch (error) {
          // Quan trọng: Xử lý lỗi khi getUserByFirebaseUid thất bại
          if (error.response?.status === 404) {
            console.log("AuthContext: User not found in backend (404). Checking provider for auto-registration...");
            const providerId = firebaseUser.providerData[0]?.providerId;

            if (providerId === 'google.com') {
              console.log("AuthContext: Google user. Attempting auto-registration...");
              toast.info("Đang thiết lập tài khoản của bạn, vui lòng chờ...");
              try {
                // Hàm này cần được tạo trong api.js
                const newUserProfile = await createBackendUserForAuthProvider(firebaseUser);
                if (newUserProfile && newUserProfile.userId) {
                  console.log("AuthContext: Backend user created successfully for Google user:", newUserProfile);
                  const freshIdToken = await firebaseUser.getIdToken(true); // Lấy token mới nhất
                  contextLogin(newUserProfile, freshIdToken);
                  toast.success('Đăng nhập Google thành công và tài khoản của bạn đã được tạo!');
                } else {
                  // Lỗi không mong muốn: API tạo user không trả về dữ liệu hợp lệ
                  console.error("AuthContext: Auto-registration failed, API did not return valid user profile.", newUserProfile);
                  toast.error('Không thể tự động tạo tài khoản. Dữ liệu trả về không hợp lệ.');
                  await contextLogout(false);
                }
              } catch (creationError) {
                console.error("AuthContext: Error during backend user creation for Google Auth:", creationError);
                const errorMsg = creationError.response?.data?.message || 'Lỗi khi tạo tài khoản mới trên backend. Vui lòng thử lại.';
                toast.error(errorMsg);
                await contextLogout(false);
              }
            } else {
              // Nhà cung cấp khác hoặc email/pass mà 404 (ví dụ: người dùng bị xóa khỏi backend nhưng vẫn còn session Firebase)
              console.warn(`AuthContext: User with UID ${firebaseUser.uid} (provider: ${providerId}) not found in backend and not eligible for auto-registration.`);
              toast.error('Tài khoản của bạn không được tìm thấy trong hệ thống của chúng tôi.');
              await contextLogout(false);
            }
          } else {
            // Các lỗi khác (500, network error không phải 404, ...)
            console.error("AuthContext: Error during login state check:", error);
            toast.error('Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.');
            await contextLogout(false);
          }
        }
      } else {
        // Không có người dùng nào đăng nhập với Firebase
        console.log("AuthContext: No Firebase user detected.");
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setIsLoading(false); // Đảm bảo setIsLoading(false) được gọi ở cuối tất cả các nhánh
    });

    return () => unsubscribe(); // Hủy đăng ký khi component unmount
  }, []); // Dependency array rỗng để chỉ chạy một lần khi mount

  return (
    // Cung cấp login và logout đã được đổi tên (contextLogin, contextLogout) với tên cũ cho dễ sử dụng bên ngoài
    <AuthContext.Provider value={{ user, token, login: contextLogin, logout: contextLogout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};