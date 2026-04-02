document.querySelectorAll('.bento-card--text').forEach(function (card) {
  const body = card.querySelector('.bento-text-body');
  const track = card.querySelector('.bento-scroll-indicator');
  const fill = card.querySelector('.bento-scroll-indicator__fill');

  if (!body || !track || !fill) return;

  function updateFill() {
    const trackH = track.clientHeight;
    const scrollable = body.scrollHeight - body.clientHeight;
    const fillH = scrollable > 0
      ? Math.max(24, (body.clientHeight / body.scrollHeight) * trackH)
      : trackH;
    const fillTop = scrollable > 0
      ? (body.scrollTop / scrollable) * (trackH - fillH)
      : 0;

    fill.style.height = fillH + 'px';
    fill.style.top = fillTop + 'px';
  }

  body.addEventListener('scroll', updateFill, { passive: true });
  updateFill();
});
