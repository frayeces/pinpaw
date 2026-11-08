// Generator level harian PinPaw untuk dunia ✨ Bonus Online.
// Membuat level acak lalu "mendaki" (hill climbing) ke arah target kesulitan, dinilai solver yang sama dengan game.
// Hanya level yang lolos semua cek yang ditambahkan ke config.json:
//   pasti bisa diselesaikan, stabil saat dimuat, target langkah (par) = langkah minimum, tidak kembar (juga cerminannya).
// Pemakaian: node tools/gen.js [jumlah=3] [menit=20]
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const { fork } = require('child_process');
const { solve, stable } = require('./engine.js');
const MOV = 'LWRXDEA';

// mekanik unggulan ada di papan?
function hasFeat(g, f) {
  const s = g.join('');
  return f === 'es' ? s.includes('I') && s.includes('L') : f === 'portal' ? s.split('O').length === 3 : f === 'tombol' ? s.includes('Q') && s.includes('Z')
    : f === 'petasan' ? s.includes('X') : f === 'tong' ? /[DE]/.test(s) : f === 'batu' ? s.includes('R') : f === 'balon' ? s.includes('A') : true;
}
const FEATS = ['es', 'portal', 'tombol', 'balon', 'petasan', 'tong', 'batu'];
const ONLY = process.env.GEN_ONLY ? process.env.GEN_ONLY.split(',') : null;
const TMIN = Math.min(8, Math.max(3, +process.env.GEN_TMIN || 4)), SEED = +process.env.GEN_SEED || 0; // opsional (untuk membuat level manual)
// ---------- pekerja: menghasilkan kandidat sampai waktu habis ----------
function worker(seed, endAt) {
  let sd = seed | 0;
  const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ri = n => Math.floor(rnd() * n), pick = a => a[ri(a.length)];
  // mekanik unggulan: setiap level dibangun di sekitar satu mekanik yang WAJIB ada (dan setelah dirapikan pasti dibutuhkan).
  // Bobot lebih besar untuk mekanik yang jarang muncul di dunia bawaan (es, portal, tombol).
  const FLAV = [
    { n: 'es', w: 3, t: 'LLLWWRBII#<>', ice: 1 }, { n: 'portal', w: 3, t: 'LLWWRB#<>', portal: 1 },
    { n: 'tombol', w: 3, t: 'LLWWRB#<>', gate: 1 }, { n: 'petasan', w: 2, t: 'LWWRBXX#<>' },
    { n: 'tong', w: 2, t: 'LLWWBDE#<>' }, { n: 'batu', w: 1, t: 'LLWWRRB#<>' }, { n: 'balon', w: 3, t: 'LLWWRBAA#<>', balloon: 1 }]
    .filter(f => !ONLY || ONLY.includes(f.n));
  const FW = []; FLAV.forEach(f => { for (let i = 0; i < f.w; i++) FW.push(f); });
  const at = (L, r, c) => L.g[r][c];
  const setc = (L, r, c, ch) => { const s = L.g[r]; L.g[r] = s.slice(0, c) + ch + s.slice(c + 1); };
  const hasPin = (L, r, c) => L.p.some(q => q[0] === r && q[1] === c);
  const delPin = (L, r, c) => { L.p = L.p.filter(q => !(q[0] === r && q[1] === c)); L.k = L.k.filter(a => !((a[0] === r && a[1] === c) || (a[2] === r && a[3] === c))); };
  const clone = L => ({ g: L.g.slice(), p: L.p.map(x => x.slice()), k: L.k.map(x => x.slice()), fl: L.fl, T: L.T });
  function add(L) {
    const H = L.g.length, W = L.g[0].length, r = 1 + ri(H - 2), c = ri(W);
    if (at(L, r, c) !== '.') return;
    const ch = pick(L.fl.t.split('')); setc(L, r, c, ch);
    if (MOV.includes(ch) && rnd() < 0.85) L.p.push([r, c]);
  }
  function init(T) {
    const W = pick([5, 5, 6, 7]), H = 9 + ri(4), fl = pick(FW), g = [];
    for (let r = 0; r < H; r++) g.push('.'.repeat(W));
    const L = { g, p: [], k: [], fl, T };
    const nc = rnd() < .5 ? 1 : (rnd() < .8 ? 2 : 3), cs = [];
    while (cs.length < nc) { const c = ri(W); if (!cs.includes(c)) cs.push(c); }
    cs.forEach(c => { setc(L, 0, c, 'H'); L.p.push([0, c]); });
    let nf = 0; while (nf < nc) { const r = fl.balloon ? 1 + ri(H - 2) : (rnd() < .6 ? H - 1 : Math.floor(H / 2) + ri(H - 1 - Math.floor(H / 2))), c = ri(W); if (at(L, r, c) === '.') { setc(L, r, c, 'F'); nf++; } }
    if (fl.portal) { setc(L, 2 + ri(3), ri(W), 'O'); const r2 = 5 + ri(H - 7), c2 = ri(W); if (at(L, r2, c2) === '.') setc(L, r2, c2, 'O'); }
    if (fl.gate) { const r = 3 + ri(H - 5), c = ri(W); if (at(L, r, c) === '.') setc(L, r, c, 'Z'); const r2 = 2 + ri(H - 3), c2 = ri(W); if (at(L, r2, c2) === '.') setc(L, r2, c2, 'Q'); }
    if (fl.ice) { for (let i = 0; i < 1 + ri(2); i++) { const r = 2 + ri(H - 4), c = ri(W); if (at(L, r, c) === '.') setc(L, r, c, 'I'); } }
    // balon: 1–2 balon berpin di bagian bawah kolom kucing, supaya kucing bisa diangkat ke ikan yang ada di atas
    if (fl.balloon) cs.forEach((c, j) => { if (j < 2 && rnd() < .8) { const r = H - 1 - ri(3); if (at(L, r, c) === '.') { setc(L, r, c, 'A'); L.p.push([r, c]); } } });
    const n = 6 + ri(6); for (let i = 0; i < n; i++) add(L);
    return L;
  }
  function mutate(L) {
    const M = clone(L), H = M.g.length, W = M.g[0].length, m = ri(8);
    const r = 1 + ri(H - 2), c = ri(W), ch = at(M, r, c);
    if (m <= 2) add(M);
    else if (m === 3) { if (!'HFOQZ.'.includes(ch)) { setc(M, r, c, '.'); delPin(M, r, c); } }
    else if (m === 4) { if (!'HFOQZ.'.includes(ch)) { const n = pick(M.fl.t.split('')); setc(M, r, c, n); if (!MOV.includes(n)) delPin(M, r, c); } }
    else if (m === 5) { if (MOV.includes(ch)) { if (hasPin(M, r, c)) delPin(M, r, c); else M.p.push([r, c]); } }
    else if (m === 6) { if (M.p.length >= 3 && M.k.length < 3) { const a = pick(M.p), b = pick(M.p); if (a !== b && !M.k.some(x => x[0] === a[0] && x[1] === a[1])) M.k.push([a[0], a[1], b[0], b[1]]); } }
    else if (M.k.length) M.k.splice(ri(M.k.length), 1);
    return M;
  }
  const lk = L => { const o = {}; L.k.forEach(a => o[a[0] + ',' + a[1]] = a[2] + ',' + a[3]); return o; };
  function evalL(L) {
    if (L.p.length < 3 || L.p.length > 9 || !hasFeat(L.g, L.fl.n) || !stable(L.g, L.p)) return null;
    const r = solve(L.g, L.p, lk(L), 60000);
    if (r.cap || r.w < 1) return null;
    const objs = L.g.join('').replace(/[.HF]/g, '').length;
    return { r, sc: -Math.abs(r.par - L.T) * 14 - Math.log2(r.w + 1) * 9 + Math.log2(r.l + 1) * 2 - Math.max(0, objs - 16) * 1.5 - (L.p.length - r.par) * 2 };
  }
  while (Date.now() < endAt) {
    const T = TMIN + ri(9 - TMIN); // target langkah TMIN..8 supaya kesulitan bervariasi
    let cur = init(T), ce = evalL(cur), tries = 0;
    while (!ce && tries++ < 300 && Date.now() < endAt) { cur = init(T); ce = evalL(cur); }
    if (!ce) continue;
    for (let it = 0; it < 2500 && Date.now() < endAt; it++) {
      const nx = mutate(cur), ne = evalL(nx);
      if (ne && (ne.sc >= ce.sc || rnd() < 0.03)) { cur = nx; ce = ne; }
    }
    if (ce.r.par === T && ce.r.w <= Math.max(2, 9 - T)) process.send({ g: cur.g, p: cur.p, k: cur.k, f: cur.fl.n });
  }
}

// ---------- rapikan: buang objek/kunci hiasan yang tidak memengaruhi solusi ----------
const lkOf = L => { const o = {}; (L.k || []).forEach(a => o[a[0] + ',' + a[1]] = a[2] + ',' + a[3]); return o; };
function ev(L) { if (!stable(L.g, L.p)) return null; const r = solve(L.g, L.p, lkOf(L), 200000); return (r.cap || r.w < 1) ? null : r; }
function prune(L) {
  let base = ev(L); if (!base) return null;
  const setc = (g, r, c, ch) => { g[r] = g[r].slice(0, c) + ch + g[r].slice(c + 1); };
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < L.k.length && !changed; i++) {
      const T = { g: L.g, p: L.p, k: L.k.filter((_, j) => j !== i) }, r = ev(T);
      if (r && r.par >= base.par && r.w <= base.w) { L.k = T.k; base = r; changed = true; }
    }
    for (let rr = 1; rr < L.g.length && !changed; rr++) for (let cc = 0; cc < L.g[0].length && !changed; cc++) {
      const ch = L.g[rr][cc]; if ('.HFOQZ'.includes(ch)) continue;
      const g = L.g.slice(); setc(g, rr, cc, '.');
      const T = { g, p: L.p.filter(q => !(q[0] === rr && q[1] === cc)), k: L.k.filter(a => !((a[0] === rr && a[1] === cc) || (a[2] === rr && a[3] === cc))) }, r = ev(T);
      if (r && r.par >= base.par && r.w <= base.w) { Object.assign(L, T); base = r; changed = true; }
    }
  }
  for (const set of ['QZ', 'O']) {
    const g = L.g.map(r => r.replace(new RegExp('[' + set + ']', 'g'), '.'));
    if (g.join('') === L.g.join('')) continue;
    const r = ev({ g, p: L.p, k: L.k }); if (r && r.par >= base.par && r.w <= base.w) { L.g = g; base = r; }
  }
  while (L.g.length > 5 && /^\.+$/.test(L.g[L.g.length - 1])) L.g = L.g.slice(0, -1);
  base = ev(L); if (!base) return null;
  return { L, r: base };
}
const mir = g => g.map(r => r.split('').reverse().join('').replace(/[<>DE]/g, x => ({ '<': '>', '>': '<', D: 'E', E: 'D' })[x]));
const hash = g => crypto.createHash('sha1').update(g.join('|')).digest('hex').slice(0, 16);
// sama seperti validLevel() di game
function valid(d) {
  if (!d || !Array.isArray(d.g) || !d.g.length || d.g.length > 16 || !Array.isArray(d.p) || !d.p.length) return false;
  const w = d.g[0].length; if (w < 1 || w > 9) return false;
  if (d.g.some(r => r.length !== w || !/^[.HFLWRDEB#<>IXOQZA]+$/.test(r))) return false;
  const s = d.g.join(''), nh = s.split('H').length - 1, nf = s.split('F').length - 1;
  return nh >= 1 && nh <= 4 && nf >= nh && d.p.every(q => q[0] >= 0 && q[0] < d.g.length && q[1] >= 0 && q[1] < w);
}

// ---------- dunia bonus mingguan bertema ----------
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
// level hari ini masuk ke dunia minggu ini; kalau belum ada, buat dunia baru dari tema berikutnya
function weeklyWorld(cfg) {
  const THEMES = require('./themes.js');
  cfg.worlds = Array.isArray(cfg.worlds) ? cfg.worlds : [];
  const id = isoWeek(new Date()), last = cfg.worlds[cfg.worlds.length - 1];
  if (last && last.id === id) return;
  const n = cfg.worlds.length, T = THEMES[n % THEMES.length], round = Math.floor(n / THEMES.length);
  const jit = ((n * 37) % 25) - 12; // variasi warna kecil supaya putaran berikutnya tidak persis sama
  cfg.worlds.push({
    id, from: cfg.levels.length,
    n: T.n + (round ? ' ' + (round + 1) : ''), en: T.en + (round ? ' ' + (round + 1) : ''), e: T.e, song: T.song,
    th: { c: hsl((T.h + 360) % 360, 70, 90), f: hsl((T.h + jit + 360) % 360, 42, 38), d: T.d, o: T.o, t: T.t, p: T.p },
  });
  console.log('dunia baru minggu ini:', T.e, cfg.worlds[n].n);
}

// ---------- utama ----------
if (process.argv[2] === '--worker') {
  worker(+process.argv[3], +process.argv[4]);
  process.disconnect(); // kirim sisa pesan dulu, lalu proses selesai sendiri
} else {
  const COUNT = +process.argv[2] || 3, MIN = +process.argv[3] || 20, MAX_LEVELS = 1000;
  const CFG = path.join(__dirname, '..', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
  cfg.levels = Array.isArray(cfg.levels) ? cfg.levels : [];
  if (cfg.levels.length >= MAX_LEVELS) { console.log('batas', MAX_LEVELS, 'level bonus tercapai; tidak menambah.'); process.exit(0); }
  const seen = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'base-hashes.json'), 'utf8')).hashes);
  cfg.levels.forEach(l => { seen.add(hash(l.g)); seen.add(hash(mir(l.g))); });
  const day = Math.floor(Date.now() / 864e5), endAt = Date.now() + MIN * 60000, nw = Math.max(1, os.cpus().length);
  const cand = [];
  let alive = nw;
  console.log('pekerja', nw, '· waktu', MIN, 'menit · target', COUNT, 'level');
  for (let i = 0; i < nw; i++) {
    const ch = fork(__filename, ['--worker', String(day * 97 + i * 7919 + 1 + SEED), String(endAt)]);
    ch.on('message', m => cand.push(m));
    ch.on('exit', () => { if (--alive === 0) finish(); });
  }
  function finish() {
    console.log('kandidat', cand.length);
    const good = [];
    for (const c of cand) {
      const pr = prune({ g: c.g.slice(), p: c.p.map(x => x.slice()), k: (c.k || []).map(x => x.slice()) });
      if (!pr) continue;
      const a = hash(pr.L.g), b = hash(mir(pr.L.g));
      if (seen.has(a) || seen.has(b)) continue;
      const lvl = { g: pr.L.g, p: pr.L.p, k: pr.L.k, par: pr.r.par };
      if (!valid(lvl) || !hasFeat(lvl.g, c.f)) continue; // mekanik unggulan harus tetap ada setelah dirapikan (= dibutuhkan)
      seen.add(a); seen.add(b); good.push({ lvl, w: pr.r.w, l: pr.r.l, f: c.f });
    }
    const DUMP = process.argv.indexOf('--dump');
    if (DUMP > 0) { fs.writeFileSync(process.argv[DUMP + 1], JSON.stringify(good)); console.log('kandidat lolos', good.length, 'ditulis ke', process.argv[DUMP + 1]); return; }
    // mekanik unggulan hari ini bergiliran, jadi semua mekanik rutin muncul (mis. es, portal, tombol hari ini; petasan, tong, batu besok)
    const today = []; for (let i = 0; i < COUNT; i++) today.push(FEATS[(day * COUNT + i) % FEATS.length]);
    good.sort((x, y) => x.lvl.par - y.lvl.par || x.w - y.w);
    const take = [];
    today.forEach((f, i) => {
      const pool = good.filter(g => g.f === f && !take.includes(g));
      if (pool.length) take.push(pool[Math.min(pool.length - 1, Math.round((pool.length - 1) * (i + 1) / (COUNT + 1)))]);
    });
    for (let i = 0; take.length < COUNT && i < good.length; i++) if (!take.includes(good[i]) && !take.some(t => t.f === good[i].f)) take.push(good[i]);
    for (let i = 0; take.length < COUNT && i < good.length; i++) if (!take.includes(good[i])) take.push(good[i]);
    take.sort((x, y) => x.lvl.par - y.lvl.par);
    if (!take.length) { console.log('tidak ada level baru yang lolos hari ini.'); return; }
    weeklyWorld(cfg);
    take.forEach(t => cfg.levels.push(t.lvl));
    fs.writeFileSync(CFG, JSON.stringify(cfg, null, 1) + '\n');
    console.log('ditambahkan', take.length, 'level:', take.map(t => t.f + ' par ' + t.lvl.par).join(', '), '· total bonus:', cfg.levels.length);
  }
}
