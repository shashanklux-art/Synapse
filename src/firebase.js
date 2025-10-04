import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbDrSiUMF8AyuLJQvcH31-l-HQhr3iMV8",
  authDomain: "synapse-aeedf.firebaseapp.com",
  projectId: "synapse-aeedf",
  storageBucket: "synapse-aeedf.firebasestorage.app",
  messagingSenderId: "504474507423",
  appId: "1:504474507423:web:f072368d8ab603a17baaaa",
  measurementId: "G-06GMRP3DKM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);