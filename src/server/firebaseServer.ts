import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0660389049",
  appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
  apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
  authDomain: "gen-lang-client-0660389049.firebaseapp.com",
  storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
  messagingSenderId: "1097085216661",
};

let dbInstance: Firestore | null = null;

export const getServerDb = () => {
  if (dbInstance) return dbInstance;

  try {
    const apps = getApps();
    const app = apps.find(a => a.name === 'wasafati-server') || initializeApp(firebaseConfig, 'wasafati-server');
    
    try {
      dbInstance = getFirestore(app, "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb");
    } catch {
      dbInstance = initializeFirestore(
        app,
        { experimentalAutoDetectLongPolling: true },
        "ai-studio-6180126a-591b-4f63-b44a-d513c9233feb"
      );
    }
    
    return dbInstance;
  } catch (err) {
    console.error('Firebase Server Initialization Error:', err);
    throw err;
  }
};
