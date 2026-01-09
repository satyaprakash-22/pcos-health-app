import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// PASTE YOUR firebaseConfig HERE from Firebase Console
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMZbW-7uNf4FTWr0fgB5EcHCWsXGytSN4",
  authDomain: "pcos-health-app.firebaseapp.com",
  projectId: "pcos-health-app",
  storageBucket: "pcos-health-app.firebasestorage.app",
  messagingSenderId: "316573745160",
  appId: "1:316573745160:web:865c1db1278796efb491bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);