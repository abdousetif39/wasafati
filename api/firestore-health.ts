export default async function handler(req: any, res: any) {
  try {
    const { getServerDb } = await import('../src/server/firebaseServer');
    const { collection, query, limit, getDocs } = await import('firebase/firestore');

    const db = getServerDb();
    
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
      code: error?.code || 'unknown',
      message: error?.message || 'Firestore error'
    });
  }
}
