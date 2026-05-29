import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCd3Mu7rmKkI2bZeqpN50D6xcqoTSZCU-M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-routine-7fea8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-routine-7fea8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-routine-7fea8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "843843589272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:843843589272:web:d37c05047ba29cefe06ced",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8G8HSP64FE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
