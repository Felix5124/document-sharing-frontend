// src/context/AuthContext.jsx
// Quản lý trạng thái firebase authentication, chức năng login / logout

import React, {  useState, useEffect } from 'react';
import { auth } from './FireBaseConfig';
import { signInWithCustomToken, onAuthStateChanged, signOut } from "firebase/auth";
import { AuthContext } from './AuthContext';


export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase user object
  const [apiUser, setApiUser] = useState(null); // User data from your API (includes isAdmin/checkAdmin)
  const [idToken, setIdToken] = useState(null); // Firebase ID Token
  const [loadingAuth, setLoadingAuth] = useState(true); // Initial loading state for auth

  // Function to log in using a custom token obtained from the backend
  // It also stores the user data returned by the backend API
  const loginWithApiAndCustomToken = async (customTokenFromBackend, userDataFromApi) => {
    setLoadingAuth(true);
    try {
      const userCredential = await signInWithCustomToken(auth, customTokenFromBackend);
      const fbUser = userCredential.user;
      console.log("Firebase sign-in successful with custom token:", fbUser);

      // Get the ID Token from Firebase user
      const newIdToken = await fbUser.getIdToken();
      console.log("Firebase ID Token:", newIdToken);

      // Store API user data and Firebase ID token
      setApiUser(userDataFromApi);
      setIdToken(newIdToken);
      localStorage.setItem('user', JSON.stringify(userDataFromApi)); // For Navbar, Profile, etc.
      localStorage.setItem('token', newIdToken); // For API calls (interceptor)

      // setFirebaseUser will be handled by onAuthStateChanged
      setLoadingAuth(false);
      return { firebaseUser: fbUser, apiUser: userDataFromApi, idToken: newIdToken };
    } catch (error) {
      console.error("Error during Firebase sign-in with custom token:", error);
      // Clean up on error
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setApiUser(null);
      setIdToken(null);
      setFirebaseUser(null); 
      setLoadingAuth(false);
      throw error;
    }
  };

  // Function to log out
  const logout = async () => {
    setLoadingAuth(true);
    try {
      await signOut(auth); // Sign out from Firebase
      console.log("Firebase sign-out successful.");
      // Clear all local state and storage
      setFirebaseUser(null);
      setApiUser(null);
      setIdToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error("Error during Firebase sign-out:", error);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Listener for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true);
      if (user) {
        console.log("Firebase onAuthStateChanged: User is signed in.", user);
        setFirebaseUser(user);
        try {
          const newIdToken = await user.getIdToken(true); // Force refresh if needed
          setIdToken(newIdToken);
          localStorage.setItem('token', newIdToken); // Update token in localStorage

          // Attempt to retrieve API user data if not already set (e.g., on page refresh)
          // This assumes 'user' in localStorage contains the API user data.
          const storedApiUser = localStorage.getItem('user');
          if (storedApiUser) {
            setApiUser(JSON.parse(storedApiUser));
          } else {
            // If apiUser is not in localStorage, it might mean the user refreshed
            // and we only have Firebase's user. Depending on your app flow,
            // you might need to fetch API user details again using firebaseUser.uid
            // or rely on the initial login to set it.
            // For now, if it's not there, we leave apiUser as null or clear it.
            // setApiUser(null); // Or fetch API user details
          }
        } catch (error) {
          console.error("Error getting ID token on auth state change:", error);
          await logout(); // Log out if token cannot be retrieved
        }
      } else {
        console.log("Firebase onAuthStateChanged: User is signed out.");
        setFirebaseUser(null);
        setApiUser(null);
        setIdToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setLoadingAuth(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  // Value provided by the AuthContext
  const value = {
    firebaseUser,       // The user object from Firebase (contains uid, email, etc.)
    apiUser,            // User object from your API (contains userId, checkAdmin, etc.)
    user: apiUser,      // For backward compatibility with components expecting 'user'
                        // You might want to create a combined user object or choose one as primary
    idToken,            // Firebase ID Token to be used for API calls
    token: idToken,     // For backward compatibility if 'token' is used directly
    login: loginWithApiAndCustomToken, // Renamed for clarity
    logout,
    loadingAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
