import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Bỏ comment nếu bạn dùng
};

// In ra để kiểm tra (xóa sau khi xác nhận hoạt động)
//console.log("Firebase API Key from Vite env:", import.meta.env.VITE_FIREBASE_API_KEY);
//console.log("Firebase Auth Domain from Vite env:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export { auth }; 