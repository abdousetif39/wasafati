import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0660389049",
  appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
  apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
  authDomain: "gen-lang-client-0660389049.firebaseapp.com",
  storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
  messagingSenderId: "1097085216661",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb");
