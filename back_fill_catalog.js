// backfill.js — node backfill.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

(async () => {
  const snap = await db.collection('karaoke_cache_youtube').get();
  console.log('documentos lidos:', snap.size);

  // reaproveita a mesma songsFromDoc() da function
  const mapa = new Map();
  snap.forEach((doc) => songsFromDoc(doc.data()).forEach((s) => {
    const prev = mapa.get(s.videoId);
    mapa.set(s.videoId, prev ? {
      ...s, views: Math.max(prev.views, s.views), likes: Math.max(prev.likes, s.likes)
    } : s);
  }));

  console.log('músicas únicas:', mapa.size);

  const ids = Array.from(mapa.keys());
  for (let i = 0; i < ids.length; i += 400) {         // lotes de 400
    const batch = db.batch();
    ids.slice(i, i + 400).forEach((id) => {
      const s = mapa.get(id);
      batch.set(db.collection('catalogo').doc(id), {
        ...s,
        thumbHd: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
        criadoEm: new Date(), atualizadoEm: new Date()
      }, { merge: true });
    });
    await batch.commit();
    console.log('gravados:', Math.min(i + 400, ids.length));
  }
  console.log('backfill concluído');
})();