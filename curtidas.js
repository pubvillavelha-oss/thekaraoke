function renderCurrent(current) {
  const pending = ultimosPendentes || [];
  const nextUp = pending.length > 0 ? pending[0] : null;

  if (current) {
    const likes = Number(current.likes) || 0;
    const liked = hasLiked(current.id);

    nowContent.innerHTML = `
      <div class="singer">${esc(current.nome)}</div>
      <div class="music">🎵 ${esc(current.musica)} — <span class="artist-inline">${esc(current.artista || 'Autor')}</span></div>
      <div class="like-row">
        <button class="like-btn ${liked ? 'liked' : ''}" id="likeBtn"
                ${liked ? 'disabled' : ''}
                aria-pressed="${liked}"
                title="${liked ? 'Você já curtiu ' + esc(current.nome) : 'Curtir ' + esc(current.nome)}">
          <span class="like-icon" id="likeIcon">${liked ? '⭐' : '☆'}</span>
          <span class="like-count" id="likeCount">${likes}</span>
          <span class="like-label">${likes === 1 ? 'curtida' : 'curtidas'}</span>
        </button>
      </div>
    `;

    const btn = document.getElementById('likeBtn');
    if (btn) btn.addEventListener('click', () => darLike(current.id));
  } else if (nextUp) {
    nowContent.innerHTML = `
      <div class="singer">${esc(nextUp.nome)}</div>
      <div class="music">🎵 ${esc(nextUp.musica)} — <span class="artist-inline">${esc(nextUp.artista || 'Autor')}</span></div>
      <div class="next-flag">Próximo(a) a cantar</div>
    `;
  } else {
    nowContent.innerHTML = `<div class="empty-now">Aguardando próximo cantor...</div>`;
  }
}