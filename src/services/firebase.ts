import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCiyIJWG437NPnonanQ1mtHABgx5cMnIAA",
  authDomain: "dims-8fa3b.firebaseapp.com",
  projectId: "dims-8fa3b",
  storageBucket: "dims-8fa3b.firebasestorage.app",
  messagingSenderId: "285235030897",
  appId: "1:285235030897:web:4a3f7397663d6d1091a4d0",
  measurementId: "G-LC02PP71JR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.log('Firebase persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.log('Firebase persistence not supported in this browser');
  }
});

export default app;
