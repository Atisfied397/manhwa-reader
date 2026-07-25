import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCtEVJJIhMVYqjCsneON_XIS1oHZf3g2TU",
  authDomain: "manhwa-reader-c131d.firebaseapp.com",
  projectId: "manhwa-reader-c131d",
  storageBucket: "manhwa-reader-c131d.firebasestorage.app",
  messagingSenderId: "933821612110",
  appId: "1:933821612110:web:23861beb8ebb8699b7431f",
  measurementId: "G-WQEVX8BELG",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
