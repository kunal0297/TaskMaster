import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "taskmaster-e292s",
  appId: "1:125551884679:web:cc6e91fddb1c01dd04fb22",
  storageBucket: "taskmaster-e292s.firebasestorage.app",
  apiKey: "AIzaSyDa91Yad13wFKot1pViyEjQRdF1mM6AtUU",
  authDomain: "taskmaster-e292s.firebaseapp.com",
  messagingSenderId: "125551884679",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
