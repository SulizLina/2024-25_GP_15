import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAGije21MiWmtB7tOWGQY69Ew41nEkYvmU",
  authDomain: "sair-7310d.firebaseapp.com",
  projectId: "sair-7310d",
  storageBucket: "sair-7310d.appspot.com",
  messagingSenderId: "164888056761",
  appId: "1:164888056761:web:673f51e2299e101f871c68",
  measurementId: "G-KLQZVWT50E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };