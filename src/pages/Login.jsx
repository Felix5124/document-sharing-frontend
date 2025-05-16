import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import React, { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { exchangeFirebaseIdToken } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../context/FireBaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";

function Login() {
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(''); 

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      
      // Đăng nhập bằng Email/Password trực tiếp với Firebase trên client
      const userCredential = await signInWithEmailAndPassword(auth, data.Email, data.Password);
      const firebaseUser = userCredential.user;
      const firebaseIdToken = await firebaseUser.getIdToken(); // Lấy Firebase ID Token

      //Gửi Firebase ID Token này lên backend để đổi lấy custom token của bạn (có chứa claims)
      const backendResponse = await exchangeFirebaseIdToken(firebaseIdToken);
      console.log('Backend exchangeFirebaseIdToken response:', backendResponse.data);

      const customTokenFromBackend = backendResponse.data.token;
      const userDataFromApi = backendResponse.data.user;

      if (!customTokenFromBackend || typeof customTokenFromBackend !== 'string') {
        throw new Error('Không nhận được custom token hợp lệ từ server.');
      }
      if (!userDataFromApi || typeof userDataFromApi.userId === 'undefined') {
        throw new Error('Không nhận được đủ thông tin người dùng từ server.');
      }

      //Dùng custom token từ backend để đăng nhập vào Firebase
      await login(customTokenFromBackend, userDataFromApi);

      toast.success('Đăng nhập thành công!');

      if (userDataFromApi.isAdmin || userDataFromApi.checkAdmin) { 
        navigate('/admin');
      } else {
        navigate('/'); 
      }


    } 
    catch (error) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (error.code && error.code.startsWith('auth/')) { // Lỗi từ Firebase client SDK (signInWithEmailAndPassword)
        console.error('Firebase Client Auth Error:', error.code, error.message);
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Firebase SDK mới hơn gộp lỗi sai email/pass vào đây
            errorMessage = 'Email hoặc mật khẩu không đúng.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Tài khoản này đã bị vô hiệu hóa.';
            break;
          default:
            errorMessage = 'Lỗi xác thực Firebase. Vui lòng thử lại.';
            break;
        }
      } else if (error.response) { // Lỗi từ Axios (gọi API backend exchangeFirebaseIdToken)
        errorMessage = error.response.data?.message || error.response.data?.title || error.response.data || (typeof error.response.data === 'string' ? error.response.data : errorMessage);
        console.error('API Backend Error (exchangeFirebaseIdToken):', error.response.data);
      } else if (error.message) { // Lỗi từ logic trong try (ví dụ: token không hợp lệ từ backend, hoặc lỗi từ login của AuthContext)
        errorMessage = error.message;
        console.error('Client-side Logic/AuthContext Error:', error.message);
      } else {
        console.error('Unknown Login error:', error);
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="card shadow-lg" style={{width: "100%", maxWidth: "450px"}}>
        <div className="card-body p-4 p-md-5">
          <h2 className="text-center mb-4 fw-bold">Đăng Nhập</h2>
          {apiError && <div className="alert alert-danger" role="alert">{apiError}</div>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.Email ? 'is-invalid' : ''}`}
                id="emailInput"
                placeholder="Nhập email của bạn"
                {...formRegister('Email', {
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Email không hợp lệ',
                  },
                })}
              />
              {errors.Email && <div className="invalid-feedback">{errors.Email.message}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="passwordInput" className="form-label">Mật khẩu</label>
              <input
                type="password"
                className={`form-control ${errors.Password ? 'is-invalid' : ''}`}
                id="passwordInput"
                placeholder="Nhập mật khẩu của bạn"
                {...formRegister('Password', { required: 'Vui lòng nhập mật khẩu' })}
              />
              {errors.Password && <div className="invalid-feedback">{errors.Password.message}</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span className="ms-2">Đang xử lý...</span>
                </>
              ) : 'Đăng Nhập'}
            </button>
          </form>
          <div className="text-center mt-3">
            <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;