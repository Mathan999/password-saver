import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Firebase configuration
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

// Initialize Auth with appropriate persistence based on platform
let auth;

if (Platform.OS === 'web') {
  // For web, use standard getAuth without React Native persistence
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  // For React Native, use persistence with AsyncStorage
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth/react-native');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Realtime Database
const database = getDatabase(app);

export { auth, db, database };