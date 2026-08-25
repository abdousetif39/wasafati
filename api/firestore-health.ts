import { getServerDb } from '../src/server/firebaseServer';
import { collection, query, limit, getDocs } from 'firebase/firestore';

export default async function handler(req: any, res: any) {
  try {
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
      message: error?.message
    });

    return res.status(500).json({
      ok: false,
      code: error?.code || 'unknown',
      message: error?.message || 'Firestore error'
    });
  }
}
