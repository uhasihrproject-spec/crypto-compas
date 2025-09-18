// src/firebaseConfig.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import App from "next/app";

const firebaseConfig = {
  apiKey: "AIzaSyC7wBWR0VbD8OFFHMTUoXCB1p3DSv50qQY",
  authDomain: "crpypto-web.firebaseapp.com",
  projectId: "crpypto-web",
  storageBucket: "crpypto-web.firebasestorage.app",
  messagingSenderId: "323892087835",
  appId: "1:323892087835:web:866353891e93dc9b013cbe",
  measurementId: "G-TH9XLBYGF0"
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();
export const googleProvider = new GoogleAuthProvider();
