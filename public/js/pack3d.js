/* OPTIMAN · 3D-упаковка (из components/pack3d.html, без изменений) */
(function(){
  var stage = document.getElementById('pack3d'); if(!stage) return;
  var box = stage.querySelector('.pack3d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var base = { x: -14, y: -30 }, target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  var dragging = false, last = null, spin = 0, t0 = performance.now(), idleUntil = 0;

  function apply(){
    var rx = base.x + cur.x, ry = base.y + cur.y + spin;
    box.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    box.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    box.style.setProperty('--ry-num', (((ry % 360) + 360) % 360).toFixed(1));
  }
  if (reduce){ apply(); return; }

  stage.addEventListener('pointermove', function(e){
    var r = stage.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    if (dragging && last){ spin += (e.clientX - last) * .45; last = e.clientX; }
    target.y = nx * 26; target.x = -ny * 14; idleUntil = performance.now() + 2500;
  });
  stage.addEventListener('pointerleave', function(){ target.x = 0; target.y = 0; });
  stage.addEventListener('pointerdown', function(e){ dragging = true; last = e.clientX; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointerup', function(){ dragging = false; last = null; });

  (function loop(now){
    var idle = now > idleUntil && !dragging;
    if (idle){                                    // спокойное «дыхание», когда пользователь не трогает
      var k = (now - t0) / 1000;
      target.y = Math.sin(k * .45) * 16;
      target.x = Math.sin(k * .3) * 4;
      spin += (Math.round(spin / 360) * 360 - spin) * .02;   // возвращаемся лицом к зрителю
    }
    cur.x += (target.x - cur.x) * .07;
    cur.y += (target.y - cur.y) * .07;
    apply();
    requestAnimationFrame(loop);
  })(t0);
})();
