export default async function handler(req: any, res: any) {
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const {
      initializeFirestore,
      getFirestore,
      collection,
      query,
      limit,
      getDocs
    } = await import('firebase/firestore');

    const firebaseConfig = {
      projectId: "gen-lang-client-0660389049",
      appId: "1:1097085216661:web:bd1e9b66a968a1fb5ef89c",
      apiKey: "AIzaSyCk9yOzd_dPMNbh36WklxUt2g7_qMkElEM",
      authDomain: "gen-lang-client-0660389049.firebaseapp.com",
      storageBucket: "gen-lang-client-0660389049.firebasestorage.app",
      messagingSenderId: "1097085216661",
    };

    const apps = getApps();
    const app = apps.some(a => a.name === 'serverHealthApp')
      ? getApp('serverHealthApp')
      : initializeApp(firebaseConfig, 'serverHealthApp');

    let db;
    try {
      db = getFirestore(app, 'ai-studio-6180126a-591b-4f63-b44a-d513c9233feb');
    } catch {
      db = initializeFirestore(
        app,
        { experimentalAutoDetectLongPolling: true },
        'ai-studio-6180126a-591b-4f63-b44a-d513c9233feb'
      );
    }

    const snap = await getDocs(
      query(
        collection(db, 'categories'),
        limit(1)
      )
    );

    return res.status(200).json({
      ok: true,
      firebase: true,
      count: snap.size
    });

  } catch (error: any) {
    console.error('FIRESTORE HEALTH ERROR', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    });

    return res.status(500).json({
      ok: false,
      code: error?.code || error?.name || 'unknown',
      message: error?.message || 'Firestore error'
    });
  }
}
