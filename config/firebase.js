// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGOJliZQ-xhCaOe45Bn98awNCqn_sEa-I",
  authDomain: "chatapp-f0e1f.firebaseapp.com",
  projectId: "chatapp-f0e1f",
  storageBucket: "chatapp-f0e1f.firebasestorage.app",
  messagingSenderId: "106303694574",
  appId: "1:106303694574:web:7ddef908dca49d564d35ff",
  measurementId: "G-5ZB342FJ3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);