// Overlap/overflow audit for the how-to scenes. Pasted into the render page:
// steps the timeline and reports text boxes that collide or leave the 1280×720 frame.
window.__audit = async function (step) {
  step = step || 0.7;
  const box = document.querySelector('svg foreignObject > div');
  const B = box.getBoundingClientRect();
  const dur = window.__duration();
  const out = [];
  const eff = (el) => {
    let o = 1, n = el;
    while (n && n !== box) { o *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; }
    return o;
  };
  for (let t = 0.4; t < dur; t += step) {
    document.querySelector('svg[data-om-exportable-video-with-duration-secs]')
      .dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t } }));
    await new Promise(r => setTimeout(r, 60));
    const els = [...box.querySelectorAll('*')].filter(e =>
      [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && eff(e) > 0.5);
    const R = els.map(e => ({ e, r: e.getBoundingClientRect(), txt: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24) }))
      .filter(a => a.r.width > 4 && a.r.height > 4);
    for (const a of R) {
      if (a.r.right > B.right + 2 || a.r.left < B.left - 2 || a.r.bottom > B.bottom + 2)
        out.push(t.toFixed(1) + '  UTENFOR: ' + a.txt);
    }
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const a = R[i], b = R[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const ov = Math.max(0, Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left))
               * Math.max(0, Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top));
      if (ov > 300) out.push(t.toFixed(1) + '  OVERLAPP: ' + a.txt + '  ×  ' + b.txt);
    }
  }
  const uniq = [...new Set(out)];
  document.body.innerHTML = '<pre style="font:12px monospace;color:#0f0;background:#000;margin:0;padding:10px;white-space:pre-wrap">'
    + location.search + '  ' + dur + 's\n' + (uniq.length ? uniq.slice(0, 44).join('\n') : 'INGEN FUNN') + '</pre>';
  return uniq.length;
};
