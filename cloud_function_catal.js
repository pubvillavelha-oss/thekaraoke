const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const CACHE = 'karaoke_cache_youtube';
const CATALOGO = 'catalogo';

const str = (v) => (v == null ? '' : String(v).trim());

function vidFromThumb(url) {
  const m = String(url || '').match(/\/vi\/([\w-]{11})\//);
  return m ? m[1] : '';
}

// Extrai todos os vídeos de um documento de cache, já deduplicados por videoId
function songsFromDoc(data) {
  const out = new Map();

  const add = (o) => {
    if (!o || typeof o !== 'object') return;
    const vid = str(o.id) || vidFromThumb(o.thumb);
    if (!vid) return;

    const cur = {
      videoId: vid,
      titulo: str(o.titulo),
      canal: str(o.canal),
      thumb: str(o.thumb),
      views: Number(o.views) || 0,
      likes: Number(o.likes) || 0,
      duracao: Number(o.duration) || 0
    };

    const prev = out.get(vid);
    if (!prev) { out.set(vid, cur); return; }

    // Mesmo vídeo visto de dois caches: mantém o melhor de cada campo
    out.set(vid, {
      videoId: vid,
      titulo: prev.titulo || cur.titulo,
      canal: prev.canal || cur.canal,
      thumb: prev.thumb || cur.thumb,
      views: Math.max(prev.views, cur.views),
      likes: Math.max(prev.likes, cur.likes),
      duracao: prev.duracao || cur.duracao
    });
  };

  add(data);
  Object.keys(data || {}).forEach((k) => {
    if (!/^\d+$/.test(k)) return;
    const v = data[k];
    if (Array.isArray(v)) v.forEach(add);
    else add(v);
  });

  return Array.from(out.values());
}

exports.catalogoFromCache = onDocumentWritten(
  { document: `${CACHE}/{docId}`, region: 'southamerica-east1' },
  async (event) => {
    const data = event.data?.after?.data();
    if (!data) return; // documento removido: catálogo não é afetado

    const songs = songsFromDoc(data);
    if (!songs.length) return;

    await Promise.all(songs.map((s) => db.runTransaction(async (tx) => {
      const ref = db.collection(CATALOGO).doc(s.videoId); // ID = videoId → sem duplicata
      const snap = await tx.get(ref);

      if (!snap.exists) {
        tx.set(ref, {
          ...s,
          thumbHd: 'https://i.ytimg.com/vi/' + s.videoId + '/maxresdefault.jpg',
          criadoEm: FieldValue.serverTimestamp(),
          atualizadoEm: FieldValue.serverTimestamp()
        });
        return;
      }

      const old = snap.data();
      tx.update(ref, {
        titulo: old.titulo || s.titulo,
        canal: old.canal || s.canal,
        thumb: old.thumb || s.thumb,
        views: Math.max(Number(old.views) || 0, s.views),
        likes: Math.max(Number(old.likes) || 0, s.likes),
        duracao: old.duracao || s.duracao,
        atualizadoEm: FieldValue.serverTimestamp()
      });
    })));
  }
);