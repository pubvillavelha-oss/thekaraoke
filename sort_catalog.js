db.collection('catalogo')
  .orderBy('views', 'desc')
  .limit(60)
  .onSnapshot(...)