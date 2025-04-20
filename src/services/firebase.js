import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { registerUser, loginUser } from "./api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = async (email, password, fullName) => {
  // Tạo user trong Firebase
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  
  // Đăng ký user trong backend
  const response = await registerUser({
    email,
    password,
    fullName,
  });
  localStorage.setItem("userId", response.data.userId);
  return { firebaseUser: userCredential.user, backendUser: response.data };
};

export const signInWithEmail = async (email, password) => {
  // Đăng nhập qua Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Đăng nhập qua backend
  const response = await loginUser({ email, password });
  localStorage.setItem("userId", response.data.userId);
  return { firebaseUser: userCredential.user, backendUser: response.data };
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("Google User Data:", {
      email: user.email,
      fullName: user.displayName,
    });

    const response = await registerUser({
      email: user.email,
      fullName: user.displayName,
    }).catch(async (error) => {
      console.error("Register Error:", error.response?.data);
      try {
        return await loginUser({ email: user.email});
      } catch (loginError) {
        console.error("Login Error:", loginError.response?.data);
        throw loginError;
      }
    });

    console.log("Backend Response:", response.data);
    localStorage.setItem("userId", response.data.userId);
    return { firebaseUser: user, backendUser: response.data };
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};
export const signOut = async () => {
  await auth.signOut();
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
};

export { auth };