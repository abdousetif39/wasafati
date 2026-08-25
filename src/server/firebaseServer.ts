import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0660389049",
  appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
  apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
  authDomain: "gen-lang-client-0660389049.firebaseapp.com",
  storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
  messagingSenderId: "1097085216661",
};

export const getServerDb = () => {
  try {
    const apps = getApps();
    const isInitialized = apps.some(a => a.name === 'serverApp');

    const app = isInitialized 
      ? getApp('serverApp') 
      : initializeApp(firebaseConfig, 'serverApp');

    const db = isInitialized
      ? getFirestore(app, "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb")
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb");
    
    return db;
  } catch (err) {
    console.error('Firebase Server Initialization Error:', err);
    throw err;
  }
};
