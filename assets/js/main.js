/* ==========================================================================
   Sabores em Movimento â€” interaÃ§Ãµes
   - Timelines GSAP do sÃ­mbolo (header) e do pÃ´ster (hero), fiÃ©is aos originais
   - Header sticky, menu mobile, link ativo
   - Reveal on scroll, contadores, contagem regressiva
   - Faixa decorativa, busca de participantes
   - Mapa ilustrado: vegetaÃ§Ã£o, pinos, tooltip, legenda e rotas
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motionQuery.matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (!hasGsap) document.documentElement.classList.add('no-gsap');

  /* ------------------------------------------------------------------
     1. SÃ­mbolo do header (timeline de sabores-simbolo.html, sem "respiraÃ§Ã£o")
     ------------------------------------------------------------------ */
  const logo = $('#logoSymbol');
  function playLogo() {
    if (!hasGsap || !logo) return;
    const L = $$('.l', logo);
    gsap.killTweensOf(L);
    gsap.set(L, { clearProps: 'all' });
    L.forEach(e => gsap.set(e, { autoAlpha: 0, transformOrigin: e.dataset.o }));
    const tl = gsap.timeline({ delay: .15 });
    tl.fromTo($$('.blk', logo), { scale: .2, rotation: -18, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.4)', stagger: .14 }, 0)
      .set($('.s', logo), { autoAlpha: 1 }, 1.5)
      .fromTo($('.s', logo), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.inOut' }, 1.5)
      .fromTo($$('.ico', logo), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .55, ease: 'back.out(2.2)', stagger: .1 }, 2.4);
    if (reduce) tl.progress(1);
  }

  /* ------------------------------------------------------------------
     2. PÃ´ster do hero (timeline de sabores-em-movimento.html)
     ------------------------------------------------------------------ */
  const poster = $('#poster');
  const pk = k => $(`[data-k="${k}"]`, poster);
  let posterTl = null;
  let loops = [];

  function buildPoster() {
    if (!hasGsap || !poster) return;
    const L = $$('.l', poster);
    posterTl && posterTl.kill();
    loops.forEach(t => t.kill()); loops = [];
    gsap.killTweensOf(L);
    gsap.set(L, { clearProps: 'all' });
    L.forEach(e => gsap.set(e, { autoAlpha: 0, transformOrigin: e.dataset.o }));

    const blk = $$('.blk', poster), ico = $$('.ico', poster), F = 'inset(0% 0% 0% 0%)';
    posterTl = gsap.timeline();
    posterTl
      .fromTo(blk, { scale: .2, rotation: -18, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: .9, ease: 'back.out(1.4)', stagger: .12 }, 0)
      .set(pk('s'), { autoAlpha: 1 }, 1.5)
      .fromTo(pk('s'), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: F, duration: .8, ease: 'power2.inOut' }, 1.5)
      .fromTo(ico, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .5, ease: 'back.out(2.2)', stagger: .08 }, 2.1)
      .fromTo(pk('sub'), { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out' }, 3)
      .fromTo(pk('sab'), { scale: .3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'elastic.out(1,.55)' }, 3.3)
      .set(pk('mov'), { autoAlpha: 1 }, 4.5)
      .fromTo(pk('mov'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: F, duration: 1, ease: 'power2.inOut' }, 4.5)
      .fromTo(pk('d06'), { scale: .2, rotation: -40, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: .8, ease: 'back.out(1.7)' }, 4.7)
      .fromTo(pk('d22'), { scale: .2, rotation: 40, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: .8, ease: 'back.out(1.7)' }, 4.9)
      .fromTo([pk('de1'), pk('a'), pk('de2')], { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'power2.out', stagger: .1 }, 4.8)
      .fromTo(pk('nov'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out' }, 5.4)
      .add(breathe, 6);
    if (reduce) posterTl.progress(1);
  }

  function breathe() {
    if (reduce) return;
    const groups = [
      [[...$$('.blk', poster), pk('s'), ...$$('.ico', poster)], -4],
      [[pk('sub')], 2],
      [[pk('sab')], 3],
      [[pk('mov')], -3],
      [[pk('de1'), pk('a'), pk('de2'), pk('nov')], 2],
    ];
    groups.forEach(([els, y], i) => loops.push(gsap.to(els, { y, duration: 2.2 + i * .3, ease: 'sine.inOut', yoyo: true, repeat: -1 })));
    loops.push(gsap.to(pk('d06'), { rotation: 1.2, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    loops.push(gsap.to(pk('d22'), { rotation: -1.2, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    if (!heroVisible) loops.forEach(t => t.pause());
  }

  // pausa a "respiraÃ§Ã£o" quando o hero sai da tela (economia de CPU/bateria)
  let heroVisible = true;
  const heroEl = $('#inicio');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      loops.forEach(t => (heroVisible ? t.resume() : t.pause()));
    }).observe(heroEl);
  }

  $('#replay')?.addEventListener('click', () => { buildPoster(); playLogo(); });

  /* ------------------------------------------------------------------
     3. Header: estado ao rolar, menu mobile, link ativo
     ------------------------------------------------------------------ */
  const header = $('#siteHeader');
  const nav = $('#mainNav');
  const toggle = $('#navToggle');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  matchMedia('(min-width: 1280px)').addEventListener('change', e => e.matches && setMenu(false));

  const navLinks = $$('.nav-link');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => {
          const active = l.getAttribute('href') === `#${entry.target.id}`;
          l.classList.toggle('is-active', active);
          active ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'empresarios', 'evento', 'protagonistas', 'restaurantes', 'mapa'].forEach(id => { const s = document.getElementById(id); s && spy.observe(s); });
  }

  /* ------------------------------------------------------------------
     4. Reveal on scroll + contadores
     ------------------------------------------------------------------ */
  // atraso escalonado em grids
  [['.p-grid > *', .12], ['.r-grid > *', .06], ['.stats > *', .1], ['.b2b-metrics-grid > *', .1], ['.b2b-benefits-grid > *', .07], ['.b2b-gallery-grid > *', .1]].forEach(([sel, step]) => {
    $$(sel).forEach((el, i) => el.style.setProperty('--d', `${(i % 5) * step}s`));
  });
  $$('.hero-copy .reveal').forEach((el, i) => el.style.setProperty('--d', `${.15 + i * .08}s`));

  function countUp(el) {
    const target = +el.dataset.count;
    if (reduce || !target) { el.textContent = target; return; }
    const dur = 1400, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        $$('[data-count]', entry.target).forEach(countUp);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------
     5. Contagem regressiva (06/11 00:00 a 22/11 23:59, horÃ¡rio de BrasÃ­lia)
     ------------------------------------------------------------------ */
  const START = Date.UTC(2026, 10, 6, 3, 0, 0);
  const END = Date.UTC(2026, 10, 23, 3, 0, 0);
  const cd = $('#countdown');
  const cdLabel = $('#countdownLabel');
  const cdNums = Object.fromEntries($$('[data-cd]').map(n => [n.dataset.cd, n]));
  const pad = n => String(n).padStart(2, '0');
  let cdTimer;
  function updateCountdown() {
    const now = Date.now();
    let diff, label;
    if (now < START) { diff = START - now; label = 'Faltam para o circuito comeÃ§ar'; cd.classList.remove('is-live'); }
    else if (now < END) { diff = END - now; label = 'O circuito estÃ¡ acontecendo! Termina em'; cd.classList.add('is-live'); }
    else { cdLabel.textContent = 'EdiÃ§Ã£o encerrada â€” obrigado por provar Itapipoca!'; Object.values(cdNums).forEach(n => (n.textContent = '00')); clearInterval(cdTimer); return; }
    cdLabel.textContent = label;
    const s = Math.floor(diff / 1000);
    cdNums.d.textContent = pad(Math.floor(s / 86400));
    cdNums.h.textContent = pad(Math.floor((s % 86400) / 3600));
    cdNums.m.textContent = pad(Math.floor((s % 3600) / 60));
    cdNums.s.textContent = pad(s % 60);
  }
  if (cd) { updateCountdown(); cdTimer = setInterval(updateCountdown, 1000); }

  /* ------------------------------------------------------------------
     6. Faixa decorativa (inspirada na moldura do pÃ´ster)
     ------------------------------------------------------------------ */
  const tiles = [
    ['#6B2312', '#F6B42C', 'i-sun'],
    ['#F6B42C', '#6B2312', 'i-cashew'],
    ['#E2621F', '#FFF9F0', 'i-mountain'],
    ['#E59838', '#6B2312', 'i-fruit'],
    ['#A03B1E', '#F9C64A', 'i-cactus'],
    ['#F9C64A', '#A03B1E', 'i-wave'],
    ['#6B2312', '#E59838', 'i-goat'],
    ['#D9822B', '#FFF9F0', 'i-sun'],
  ];
  $$('[data-band]').forEach(band => {
    const count = Math.max(32, Math.ceil(screen.width / 56) + 4);
    let html = '';
    for (let i = 0; i < count; i++) {
      const [bg, fg, icon] = tiles[i % tiles.length];
      html += `<span class="band-tile" style="background:${bg};color:${fg}"><svg><use href="#${icon}"/></svg></span>`;
    }
    band.innerHTML = `<div class="band-track">${html}${html}</div>`;
  });

  /* ------------------------------------------------------------------
     7. Busca de participantes
     ------------------------------------------------------------------ */
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const cards = $$('.r-card');
  const search = $('#restSearch');
  const empty = $('#restEmpty');
  search?.addEventListener('input', () => {
    const q = norm(search.value);
    let shown = 0;
    cards.forEach(c => {
      const ok = !q || norm(c.textContent).includes(q);
      c.hidden = !ok;
      if (ok) { shown++; c.classList.add('is-visible'); }
    });
    empty.hidden = shown > 0;
  });

  /* ------------------------------------------------------------------
     8. Mapa do circuito
     ------------------------------------------------------------------ */
  const svg = $('#mapSvg');
  const canvas = $('#mapCanvas');
  if (!svg || !canvas) return;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  // posiÃ§Ãµes (viewBox 900Ã—1040) baseadas no mapa oficial do circuito
  const PINS = {
    '01': [509, 226], '02': [320, 468], '03': [462, 528], '04': [540, 586],
    '05': [496, 548], '06': [241, 344], '07': [769, 388], '08': [752, 580],
    '09': [307, 899], '10': [838, 104], '11': [826, 580], '12': [404, 600], '13': [245, 681],
  };

  const data = cards.map(c => ({
    num: c.dataset.num,
    territory: c.dataset.territory,
    name: $('.r-name', c).textContent.trim(),
    address: $('.r-address', c).textContent.trim(),
    card: c,
  }));

  // 8.1 vegetaÃ§Ã£o procedural (seed fixa = sempre o mesmo desenho)
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  (function plant() {
    const veg = $('#m-veg');
    const ocean = $('#m-ocean'), sand = $('#m-sand'), urban = $('#m-urban'), sertao = $('#m-sertao'), serra = $('#m-serra');
    const roads = $$('#m-roads > g:first-child > path');
    if (!veg || typeof ocean.isPointInFill !== 'function') return;
    const rand = mulberry32(20261106);
    const pt = svg.createSVGPoint();
    const frag = document.createDocumentFragment();
    const add = (id, x, y, s) => frag.appendChild(el('use', { href: `#${id}`, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})` }));
    const nearFalls = (x, y) => Math.hypot(x - 110, y - 860) < 62;
    try {
      for (let y = 12; y < 1040; y += 28) {
        for (let x = 10; x < 900; x += 28) {
          const px = x + (rand() - .5) * 20, py = y + (rand() - .5) * 20;
          pt.x = px; pt.y = py;
          if (ocean.isPointInFill(pt) || sand.isPointInFill(pt) || urban.isPointInFill(pt) || nearFalls(px, py)) continue;
          if (roads.some(r => r.isPointInStroke(pt))) continue;
          if (sertao.isPointInFill(pt)) { if (rand() < .22) add('cactusMap', px, py, .9 + rand() * .5); continue; }
          const inSerra = serra.isPointInFill(pt);
          if (rand() > (inSerra ? .92 : .45)) continue;
          add(inSerra ? 'treeDark' : 'tree', px, py, .75 + rand() * .55);
        }
      }
      [[612, 66], [668, 98], [718, 132], [760, 172], [800, 214], [842, 250], [880, 280], [560, 38]].forEach(([x, y]) => add('palm', x, y, .95 + rand() * .3));
      // pequenas Ã¡rvores dentro da cidade (praÃ§as)
      [[300, 300], [620, 280], [700, 470], [360, 650], [560, 700], [260, 560], [810, 470]].forEach(([x, y]) => add('tree', x, y, .7));
    } catch (_) { /* navegador sem isPointInFill: mapa segue sem vegetaÃ§Ã£o extra */ }
    veg.appendChild(frag);
  })();

  // 8.2 pinos
  const pinLayer = $('#m-pins');
  const pins = {};
  data.slice().sort((a, b) => PINS[a.num][1] - PINS[b.num][1]).forEach(d => {
    const [x, y] = PINS[d.num];
    const g = el('g', { class: 'pin', 'data-num': d.num, transform: `translate(${x} ${y})`, tabindex: '0', role: 'button', 'aria-label': `Ponto ${d.num}: ${d.name} â€” ${d.address}` });
    g.appendChild(el('circle', { class: 'pin-pulse', cx: 0, cy: -28, r: 14 }));
    const inner = el('g', { class: 'pin-inner', filter: 'url(#pinShadow)' });
    inner.appendChild(el('path', { class: 'pin-body', d: 'M0,0 C-5,-9 -15,-16 -15,-28 A15,15 0 1 1 15,-28 C15,-16 5,-9 0,0Z' }));
    inner.appendChild(el('circle', { class: 'pin-core', cx: 0, cy: -28, r: 10.5 }));
    const t = el('text', { class: 'pin-num', x: 0, y: -23.8 }); t.textContent = d.num;
    inner.appendChild(t);
    g.appendChild(inner);
    pinLayer.appendChild(g);
    pins[d.num] = g;
  });

  // 8.3 legenda
  const legend = $('#mapLegend');
  const legendItems = {};
  data.forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="legend-item" data-pin="${d.num}"><span class="legend-num">${d.num}</span><span class="legend-text"><strong>${d.name}</strong><small>${d.address}</small></span></button>`;
    legend.appendChild(li);
    legendItems[d.num] = li.firstElementChild;
  });

  // 8.4 tooltip / estado ativo
  const tip = $('#mapTooltip');
  let activeNum = null;
  function showTip(num) {
    const d = data.find(x => x.num === num); if (!d) return;
    const pr = pins[num].getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    const half = Math.min(120, cr.width / 2 - 8);
    const left = Math.min(Math.max(pr.left + pr.width / 2 - cr.left, half), cr.width - half);
    tip.innerHTML = `<b>${d.num}</b> <strong>${d.name}</strong>${d.address}`;
    tip.style.left = `${left}px`;
    tip.style.top = `${pr.top - cr.top}px`;
    tip.hidden = false;
  }
  function activate(num, { tooltip = true } = {}) {
    if (activeNum && pins[activeNum]) { pins[activeNum].classList.remove('is-active'); legendItems[activeNum].classList.remove('is-active'); }
    activeNum = num;
    if (!num) { tip.hidden = true; return; }
    pins[num].classList.add('is-active');
    legendItems[num].classList.add('is-active');
    pinLayer.appendChild(pins[num]); // traz para frente
    tooltip ? showTip(num) : (tip.hidden = true);
  }
  function goToCard(num) {
    const d = data.find(x => x.num === num); if (!d) return;
    if (d.card.hidden && search) { search.value = ''; search.dispatchEvent(new Event('input')); }
    d.card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    d.card.classList.remove('is-flash'); void d.card.offsetWidth; d.card.classList.add('is-flash');
  }

  Object.entries(pins).forEach(([num, g]) => {
    g.addEventListener('mouseenter', () => activate(num));
    g.addEventListener('focus', () => activate(num));
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeNum === num && !tip.hidden) {
        goToCard(num);
      } else {
        activate(num);
      }
      if (e.currentTarget && typeof e.currentTarget.blur === 'function') {
        e.currentTarget.blur();
      }
    });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        goToCard(num);
      }
    });
  });
  canvas.addEventListener('mouseleave', () => activate(null));
  canvas.addEventListener('click', (e) => {
    if (!e.target.closest('.pin')) {
      activate(null);
    }
  });
  pinLayer.addEventListener('focusout', e => { if (!pinLayer.contains(e.relatedTarget)) activate(null); });

  Object.entries(legendItems).forEach(([num, btn]) => {
    btn.addEventListener('mouseenter', () => activate(num));
    btn.addEventListener('focus', () => activate(num));
    btn.addEventListener('mouseleave', () => activate(null));
    btn.addEventListener('click', () => goToCard(num));
  });
  window.addEventListener('resize', () => activeNum && !tip.hidden && showTip(activeNum), { passive: true });

  // "Ver no mapa" nos cards
  $$('.r-maplink').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const num = a.dataset.pin;
    setRoute('all');
    canvas.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => activate(num), reduce ? 0 : 650);
  }));

  // 8.5 rotas temÃ¡ticas
  const ROUTES = {
    all: { title: 'Todas as rotas', pins: null, text: 'A sede de Itapipoca concentra 11 paradas. Daqui, a CE-168 e a CE-085 conectam a cidade ao litoral, enquanto os acessos ao sul levam Ã  serra e ao sertÃ£o.' },
    serra: { title: 'Rota da Serra', pins: ['09'], text: 'Pela saÃ­da sudoeste, a estrada segue rumo a Ipu e MazagÃ£o, onde rios, cachoeiras e clima ameno emolduram o BalneÃ¡rio OGG (09). Terra do maracujÃ¡.' },
    sertao: { title: 'Rota do SertÃ£o', pins: null, text: 'A sudeste, a paisagem fica seca e dourada: Ã© o sertÃ£o dos mandacarus e da criaÃ§Ã£o de caprinos. O carneiro, seu protagonista, ganha releituras nas paradas da sede.' },
    praia: { title: 'Rota da Praia', pins: ['10'], text: 'Rumo ao norte, o acesso ao litoral leva Ã s dunas e coqueirais da Praia da Baleia, onde fica a Barraca Du Jaime (10). Terra do caju.' },
  };
  const tabs = $$('.route-tab');
  const tCard = $('#territoryCard'), tTitle = $('#territoryTitle'), tText = $('#territoryText');
  function setRoute(route) {
    const r = ROUTES[route] || ROUTES.all;
    canvas.dataset.route = route;
    tCard.dataset.route = route;
    tTitle.textContent = r.title;
    tText.textContent = r.text;
    tabs.forEach(t => { const on = t.dataset.route === route; t.classList.toggle('is-active', on); t.setAttribute('aria-pressed', String(on)); });
    Object.entries(pins).forEach(([num, g]) => {
      const dim = !!r.pins && !r.pins.includes(num);
      g.classList.toggle('is-dim', dim);
      legendItems[num].classList.toggle('is-dim', dim);
    });
    activate(null);
    if (r.pins && r.pins.length === 1) setTimeout(() => activate(r.pins[0]), 50);
  }
  tabs.forEach(t => t.addEventListener('click', () => setRoute(t.dataset.route)));

  /* ------------------------------------------------------------------
     9. InicializaÃ§Ã£o
     ------------------------------------------------------------------ */
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = Math.max(2026, new Date().getFullYear());

  function startAnimations() { playLogo(); buildPoster(); }
  // espera as camadas carregarem para a timeline comeÃ§ar sincronizada
  const layerImgs = [...$$('.l', poster), ...$$('.l', logo)];
  Promise.all(layerImgs.map(img => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))))
    .then(startAnimations);

  motionQuery.addEventListener('change', e => {
    reduce = e.matches;
    if (reduce) { loops.forEach(t => t.kill()); loops = []; posterTl && posterTl.progress(1); }
  });
})();
