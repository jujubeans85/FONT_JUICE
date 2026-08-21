(() => {
  'use strict';

  const CONTENT = window.MATE_CONTENT;
  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const VERSION = 'v3';

  const plans = {
    mixed: ['warm','feral','absurd','warm','feral','mission','warm','absurd','feral','warm','mission','feral','warm','absurd','feral','warm','absurd','feral','warm','warm'],
    warm:  ['warm','warm','warm','absurd','warm','warm','warm','mission','warm','warm','warm','warm','warm','feral','warm','warm','warm','absurd','warm','warm'],
    feral:['feral','warm','feral','absurd','feral','mission','feral','warm','feral','absurd','feral','feral','warm','mission','feral','absurd','feral','warm','feral','feral'],
    chaos:['absurd','feral','mission','feral','absurd','warm','feral','absurd','mission','feral','absurd','feral','warm','absurd','feral','mission','absurd','feral','feral','absurd']
  };

  const buttonText = {
    warm: 'ONE MORE',
    feral: 'TAP AGAIN, COWARD',
    absurd: 'MORE SCIENCE',
    mission: 'NEW MISSION'
  };

  function clean(value, fallback, max = 28) {
    return (String(value || '')
      .replace(/[<>\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, max) || fallback);
  }

  const to = clean(params.get('n') || params.get('to'), 'MATE');
  const from = clean(params.get('f') || params.get('from'), 'Adam');
  const toneMap = { m: 'mixed', w: 'warm', f: 'feral', c: 'chaos' };
  const requestedTone = params.get('m') || params.get('tone') || 'mixed';
  const tone = plans[requestedTone] ? requestedTone : (toneMap[requestedTone] || 'mixed');
  const series = clean(params.get('s') || params.get('series'), hash(`${to}|${from}|${tone}`).toString(36), 36).replace(/[^a-zA-Z0-9_-]/g, '') || 'mate';
  const storageKey = `mate-machine:${VERSION}:${series}`;
  const cookieKey = `mm_${series.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'mate'}`;

  function hash(input) {
    let h = 2166136261 >>> 0;
    for (const char of String(input)) {
      h ^= char.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function gcd(a, b) {
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function coprime(seed, modulus) {
    let candidate = (hash(seed) % modulus) | 1;
    if (candidate <= 0) candidate = 1;
    while (gcd(candidate, modulus) !== 1) {
      candidate += 2;
      if (candidate >= modulus) candidate = 1;
    }
    return candidate;
  }

  function readCookie(name) {
    const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
    return match ? Number.parseInt(match.slice(name.length + 1), 10) || 0 : 0;
  }

  function readCounter() {
    let local = 0;
    try { local = Number.parseInt(localStorage.getItem(storageKey), 10) || 0; } catch (_) {}
    return Math.max(local, readCookie(cookieKey));
  }

  function writeCounter(value) {
    try { localStorage.setItem(storageKey, String(value)); } catch (_) {}
    document.cookie = `${cookieKey}=${value}; Max-Age=34560000; Path=/; SameSite=Lax`;
  }

  function nextDose() {
    const next = readCounter() + 1;
    writeCounter(next);
    return next;
  }

  function categoryForDose(dose) {
    const plan = plans[tone];
    const zero = Math.max(0, dose - 1);
    const pos = zero % plan.length;
    const category = plan[pos];
    const fullCycles = Math.floor(zero / plan.length);
    const perCycle = plan.reduce((count, item) => count + Number(item === category), 0);
    let before = 0;
    for (let i = 0; i < pos; i += 1) before += Number(plan[i] === category);
    return { category, occurrence: fullCycles * perCycle + before };
  }

  function product(values) {
    return values.reduce((total, value) => total * value, 1);
  }

  function buildCard(category, occurrence) {
    const data = CONTENT[category];
    const pools = [data.openers, data.mains, data.supports, data.closers, data.signatures, data.icons];
    const space = product(pools.map((pool) => pool.length));
    const multiplier = coprime(`${series}|${tone}|${category}|multiplier`, space);
    const offset = hash(`${series}|${tone}|${category}|offset`) % space;
    let index = (((occurrence % space) * multiplier) + offset) % space;
    const picks = [];

    for (const pool of pools) {
      picks.push(pool[index % pool.length]);
      index = Math.floor(index / pool.length);
    }

    const colourSeed = hash(`${series}|${tone}|${category}|${occurrence}`);
    return {
      category,
      label: data.label,
      opener: picks[0],
      main: picks[1],
      support: picks[2],
      closer: picks[3],
      signature: picks[4].replaceAll('{{from}}', from),
      icon: picks[5],
      hue1: colourSeed % 360,
      hue2: (Math.floor(colourSeed / 360) + 137) % 360
    };
  }

  function compactUrl(dose) {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('n', to);
    url.searchParams.set('f', from);
    url.searchParams.set('m', ({ mixed: 'm', warm: 'w', feral: 'f', chaos: 'c' })[tone]);
    url.searchParams.set('s', series);
    url.searchParams.set('d', String(dose));
    return url;
  }

  function render(dose, updateUrl = true) {
    const { category, occurrence } = categoryForDose(dose);
    const card = buildCard(category, occurrence);

    document.documentElement.style.setProperty('--h1', card.hue1);
    document.documentElement.style.setProperty('--h2', card.hue2);
    document.documentElement.style.setProperty('--glow', category === 'warm' ? '.27' : '.34');

    $('#to').textContent = to;
    $('#count').textContent = `DOSE ${String(dose).padStart(3, '0')}`;
    $('#icon').textContent = card.icon;
    $('#badge').textContent = card.label;
    $('#opener').textContent = card.opener;
    $('#main').textContent = card.main;
    $('#support').textContent = card.support;
    $('#closer').textContent = card.closer;
    $('#from').textContent = card.signature;
    $('#again').textContent = buttonText[category];
    document.title = `${to} — ${card.label}`;

    const body = $('#body');
    body.classList.remove('pop');
    void body.offsetWidth;
    body.classList.add('pop');

    if (updateUrl) history.replaceState({}, '', compactUrl(dose));
  }

  const requestedDose = Number.parseInt(params.get('d') || params.get('dose'), 10);
  let currentDose;
  if (Number.isFinite(requestedDose) && requestedDose > 0) {
    currentDose = requestedDose;
    if (readCounter() < currentDose) writeCounter(currentDose);
  } else {
    currentDose = nextDose();
  }

  let hiddenAt = 0;
  let lastAutomaticAdvance = 0;

  function automaticAdvance() {
    const now = Date.now();
    if (now - lastAutomaticAdvance < 900) return;
    lastAutomaticAdvance = now;
    currentDose = nextDose();
    render(currentDose);
  }

  $('#again').addEventListener('click', () => {
    currentDose = nextDose();
    render(currentDose);
  });

  addEventListener('pageshow', (event) => {
    if (event.persisted) automaticAdvance();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 1200) automaticAdvance();
  });

  render(currentDose, !params.has('d'));
})();
