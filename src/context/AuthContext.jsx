import React, { createContext, useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserById } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("token", token);
          
          const userId = localStorage.getItem("userId");
          if (!userId) throw new Error("User ID not found");
          
          const response = await getUserById(userId);
          setUser({ ...firebaseUser, ...response.data, userId: response.data.userId });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
        }
      } else {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
