import { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getUserByFirebaseUid, createBackendUserForAuthProvider } from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // Thêm trạng thái để tránh lặp

  const contextLogin = (userData, idToken) => {
    if (userData && typeof userData === 'object' && idToken && typeof idToken === 'string') {
      setUser(userData);
      setToken(idToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', idToken);
    } else {
      console.error('Dữ liệu đăng nhập không hợp lệ:', { userData, idToken });
    }
  };

  const contextLogout = async (showToast = true) => {
    try {
      await firebaseSignOut(auth);
      if (showToast) {
        toast.success('Đăng xuất thành công!');
      }
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      if (showToast) {
        toast.error("Lỗi khi đăng xuất. Vui lòng thử lại.");
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !isProcessing) {
        setIsProcessing(true); // Ngăn xử lý đồng thời
        let idToken;
        try {
          idToken = await firebaseUser.getIdToken(true);
          
          const userDetailsResponse = await getUserByFirebaseUid(firebaseUser.uid);
          const backendUserData = userDetailsResponse.data;

          if (backendUserData && backendUserData.userId && !backendUserData.isLocked) {
            contextLogin(backendUserData, idToken);
          } else if (backendUserData && backendUserData.isLocked) {
            toast.error('Tài khoản của bạn đã bị khóa.');
            await contextLogout(false);
          } else {
            toast.error('Dữ liệu người dùng từ backend không hợp lệ.');
            await contextLogout(false);
          }
        } catch (error) {
          if (error.response?.status === 404) {
            const providerId = firebaseUser.providerData[0]?.providerId;

            if (providerId === 'google.com') {
              toast.info("Đang thiết lập tài khoản Google...");
              try {
                const payload = {
                  FirebaseUid: firebaseUser.uid,
                  Email: firebaseUser.email,
                  FullName: firebaseUser.displayName || "Unknown"
                };
                const newUserProfile = await createBackendUserForAuthProvider(payload);
                if (newUserProfile && newUserProfile.userId) {
                  const freshIdToken = await firebaseUser.getIdToken(true);
                  contextLogin(newUserProfile, freshIdToken);
                  toast.success('Đăng nhập Google thành công, tài khoản đã được tạo!');
                } else {
                  throw new Error('Dữ liệu trả về không hợp lệ từ API tạo user.');
                }
              } catch (creationError) {
                const errorMsg = creationError.response?.data?.message || 'Lỗi khi tạo tài khoản mới. Vui lòng thử lại.';
                toast.error(errorMsg);
                await contextLogout(false);
              }
            } else {
              toast.error('Tài khoản không được tìm thấy trong hệ thống.');
              await contextLogout(false);
            }
          } else {
            toast.error('Lỗi đăng nhập. Vui lòng thử lại.');
            await contextLogout(false);
          }
        } finally {
          setIsProcessing(false);
        }
      } else if (!firebaseUser) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsProcessing(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login: contextLogin, logout: contextLogout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};