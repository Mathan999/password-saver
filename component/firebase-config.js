import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDHhXhW1bDnBdVgkzYWB6Wu1UdDfi5IM0",
  authDomain: "password-saver-3eac5.firebaseapp.com",
  projectId: "password-saver-3eac5",
  storageBucket: "password-saver-3eac5.firebasestorage.app",
  messagingSenderId: "217198977331",
  appId: "1:217198977331:web:4bceeb20d2ff035234de46",
  measurementId: "G-2RE2YJQGRT",
  databaseURL: "https://password-saver-3eac5-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;

// Important: We need to use initializeAuth directly with persistence
// The method we used before wasn't properly setting persistence
auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Realtime Database
const database = getDatabase(app);

export { auth, db, database };