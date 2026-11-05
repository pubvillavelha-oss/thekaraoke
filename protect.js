async function darLike(singerId) {
  if (!singerId || hasLiked(singerId)) return;

  const btn   = document.getElementById('likeBtn');
  const icon  = document.getElementById('likeIcon');
  const count = document.getElementById('likeCount');
  const anterior = count ? (parseInt(count.textContent, 10) || 0) : 0;

  // Trava imediata — evita dois incrementos no mesmo toque
  if (btn) btn.disabled = true;
  if (count) count.textContent = anterior + 1;

  try {
    await db.collection(COLLECTION).doc(singerId).update({
      likes: firebase.firestore.FieldValue.increment(1)
    });

    markLiked(singerId); // regra do TXT: 1 curtida por dispositivo

    if (btn) {
      btn.classList.add('liked');
      btn.setAttribute('aria-pressed', 'true');
      btn.title = 'Você já curtiu este cantor';
    }
    if (icon) icon.textContent = '⭐';
  } catch (error) {
    // Reverte o contador e libera o botão se o banco falhar
    if (count) count.textContent = anterior;
    if (btn) btn.disabled = false;
    console.error('Erro ao registrar like:', error);
  }
}