import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD6uBv6UuZrh4e-1XUT7s7m5AztVTX2rmI",
  authDomain: "vmqx-356cc.firebaseapp.com",
  projectId: "vmqx-356cc",
  storageBucket: "vmqx-356cc.appspot.com",
  messagingSenderId: "331512177429",
  appId: "1:331512177429:web:2e3df4d6894b05904a7f1c",
  measurementId: "G-QD2G5GNW2S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { auth, firestore, functions };


