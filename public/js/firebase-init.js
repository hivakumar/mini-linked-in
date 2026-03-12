// public/js/firebase-init.js
// Firebase configuration for the frontend
// You MUST replace these with your actual Firebase project Web config keys!

const firebaseConfig = {
  apiKey: "AIzaSyDif-VPNvk503aBaOT10VDnYj7B0ZoEC2s",
  authDomain: "minilinkedin-6c1bb.firebaseapp.com",
  projectId: "minilinkedin-6c1bb",
  storageBucket: "minilinkedin-6c1bb.firebasestorage.app",
  messagingSenderId: "1032013166069",
  appId: "1:1032013166069:web:44f7d5895583afdc64dcbc",
  measurementId: "G-7NXB3T222L"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Auth
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Export for other scripts if using modules, but we are using globals for simplicity
window.auth = auth;
window.googleProvider = googleProvider;
