// Hệ thống ngoài trận: lưu tiến trình, tiền tệ, cấp độ, chiến dịch, nhiệm vụ ngày, quà ngày,
// vòng quay, cửa hàng, mở khóa nhân vật/mũ, quảng cáo có thưởng, quảng cáo chuyển cảnh, mời đánh giá.
(function () {
  const C = window.GAME_CONFIG, PF = window.Platform, el = PF.el;
  const KEY = 'ptm_save_v1';
  const pad2 = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00'))/864e5);
  const fmt = n => Math.floor(n).toLocaleString('vi-VN');
  const isDemo = () => typeof demo !== 'undefined' && demo;
  const $ = id => document.getElementById(id);

  // ================= Lưu trữ =================
  const DEF = () => ({v:1, coins:300, gems:20, xp:0, level:1, unlocked:{ox:1, frog:1}, hats:{none:1}, hat:'none',
    stage:1, stars:{}, daily:{last:null, idx:0}, missions:{day:null, list:[]}, spin:{day:null, free:1, ad:0},
    adGems:{day:null, n:0}, noAds:false, starter:false, matches:0, wins:0, sinceAd:0, lastAd:0, tutorial:false, rated:false,
    settings:{music:45, sfx:80, shake:true}, diff:'normal'});
  function load() { try { const r = localStorage.getItem(KEY); if (r) return Object.assign(DEF(), JSON.parse(r)); } catch (_) {} return DEF(); }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} renderBars(); }

  // ================= Kinh tế =================
  const xpNeed = l => 100 + l*60;
  function addXp(x) {
    S.xp += x; let up = false;
    while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; S.gems += 10; up = true; }
    if (up) { PF.toast(`⬆️ Lên cấp ${S.level}! +10 💎`); PF.log('level_up', {level:S.level}); }
  }
  function give(r) { S.coins += r.coins || 0; S.gems += r.gems || 0; if (r.xp) addXp(r.xp); save(); }
  function spend(cur, n) {
    if (S[cur] < n) { PF.toast(cur === 'coins' ? 'Không đủ vàng' : 'Không đủ kim cương'); if (cur === 'gems') openShop('gems'); return false; }
    S[cur] -= n; save(); return true;
  }
  const rwTxt = r => [r.coins ? `+${fmt(r.coins)} 🪙` : '', r.gems ? `+${fmt(r.gems)} 💎` : '', r.xp ? `+${r.xp} XP` : ''].filter(Boolean);

  // ================= Nội dung =================
  const CHAR_PRICE = {bird:{coins:1200, gems:60}, turtle:{coins:2000, gems:100}};
  const HATS = [{id:'none', name:'Không đội', price:0}, {id:'cap', name:'Mũ lưỡi trai', price:30}, {id:'party', name:'Mũ tiệc', price:40},
    {id:'flower', name:'Vòng hoa', price:50}, {id:'helmet', name:'Mũ sắt', price:80}, {id:'tophat', name:'Mũ ảo thuật', price:100}, {id:'crown', name:'Vương miện', price:150}];
  const DIFF = {easy:{name:'Dễ', skill:.4, mul:.8}, normal:{name:'Thường', skill:.68, mul:1}, hard:{name:'Khó', skill:.92, mul:1.5}};
  const CHAPTERS = [{name:'Đồng cỏ', map:'meadow'}, {name:'Hoàng hôn', map:'sunset'}, {name:'Băng tuyết', map:'snow'}];
  const KEYS = ['ox', 'frog', 'bird', 'turtle'];
  function stage(n) {
    const ch = Math.floor((n - 1)/10), k = (n - 1) % 10 + 1, boss = k === 10;
    const cnt = n <= 2 ? 1 : (boss || k === 5) ? 3 : 2, b = [];
    for (let i = 0; i < cnt; i++) b.push(KEYS[(n*3 + i*5 + ch) % 4]);
    return {n, ch, k, boss, map:CHAPTERS[ch].map, b, hp:+(0.75 + n*0.022).toFixed(2), skill:Math.min(.95, .3 + n*.022),
            windMax:Math.min(10, 3 + Math.floor(n/3)), coins:60 + n*12, gems:boss ? 15 : (k === 5 ? 5 : 0)};
  }
  const MPOOL = [
    {t:'damage', n:300, txt:'Gây 300 sát thương', r:{coins:80}}, {t:'win', n:2, txt:'Thắng 2 trận', r:{coins:120}},
    {t:'direct', n:3, txt:'Bắn trúng đích 3 lần', r:{coins:70}}, {t:'item', n:3, txt:'Dùng 3 vật phẩm', r:{coins:60}},
    {t:'kill', n:3, txt:'Hạ gục 3 kẻ địch', r:{coins:90}}, {t:'ult', n:2, txt:'Tung siêu đạn 2 lần', r:{gems:5}},
    {t:'match', n:3, txt:'Chơi 3 trận', r:{coins:60}}, {t:'stage', n:1, txt:'Vượt 1 màn chiến dịch', r:{gems:8}}];
  const DAILY = [{coins:100}, {coins:150}, {gems:10}, {coins:250}, {gems:20}, {coins:400}, {gems:50, coins:500}];
  const WHEEL = [{coins:50, w:20, c:'#3d8be5'}, {gems:5, w:14, c:'#9b4dff'}, {coins:100, w:16, c:'#2fa84f'}, {coins:30, w:20, c:'#e5533d'},
                 {gems:10, w:8, c:'#c02ad8'}, {coins:200, w:7, c:'#e0a030'}, {coins:80, w:12, c:'#1fa3a3'}, {gems:25, w:3, c:'#ff3d8b'}];

  // ================= Nhiệm vụ =================
  function ensureDay() {
    const t = today();
    if (S.missions.day !== t) S.missions = {day:t, list:[...MPOOL].sort(() => Math.random() - .5).slice(0, 3).map(m => ({...m, p:0, done:false, claimed:false}))};
    if (S.spin.day !== t) S.spin = {day:t, free:1, ad:0};
    if (S.adGems.day !== t) S.adGems = {day:t, n:0};
  }
  function track(t, n = 1) {
    if (isDemo()) return;
    ensureDay(); let ch = false;
    S.missions.list.forEach(m => { if (m.t === t && !m.done) { m.p = Math.min(m.n, m.p + n); ch = true; if (m.p >= m.n) { m.done = true; PF.toast(`✅ Xong nhiệm vụ: ${m.txt}`); } } });
    if (ch) save();
  }
  function dailyState() {
    const t = today();
    if (S.daily.last === t) return {can:false, idx:(S.daily.idx - 1 + 7) % 7};
    let idx = S.daily.idx;
    if (S.daily.last && dayDiff(S.daily.last, t) > 1) idx = 0;
    return {can:true, idx:idx % 7};
  }

  // ================= Thanh tiền tệ & sảnh =================
  function renderBars() {
    document.querySelectorAll('.cur-coins').forEach(e => e.textContent = fmt(S.coins));
    document.querySelectorAll('.cur-gems').forEach(e => e.textContent = fmt(S.gems));
    if ($('hubLv')) { $('hubLv').textContent = S.level; $('hubXp').style.width = Math.min(100, S.xp/xpNeed(S.level)*100) + '%'; }
    if ($('campSub')) { const tot = Object.values(S.stars).reduce((a, b) => a + b, 0); $('campSub').textContent = `Màn ${Math.min(S.stage, 30)}/30 · ${tot}★`; }
    ensureDay();
    const alert = (id, on) => $(id) && $(id).classList.toggle('alert', !!on);
    alert('bDaily', dailyState().can);
    alert('bMis', S.missions.list.some(m => m.done && !m.claimed));
    alert('bWheel', S.spin.free > 0);
    alert('bShop', !S.starter);
  }
  const curBar = () => `<div class="curs"><button class="pill" data-shop="coins">🪙 <b class="cur-coins">0</b><span>+</span></button><button class="pill" data-shop="gems">💎 <b class="cur-gems">0</b><span>+</span></button></div>`;
  function buildUI() {
    document.body.appendChild(el(`<div id="hub" class="screen">
      <div class="hub-top"><div class="prof"><canvas id="hubAva" width="96" height="96"></canvas><div><div class="lv">Cấp <b id="hubLv">1</b></div><div class="xpbar"><i id="hubXp"></i></div></div></div>${curBar()}</div>
      <div class="hub-mid"><div class="logo sm">PHÁO THỦ MÂY</div>
        <div class="modes">
          <button class="mode big camp" id="mCamp"><span class="mi1">⚔️</span><b>CHIẾN DỊCH</b><small id="campSub"></small></button>
          <button class="mode big quick" id="mQuick"><span class="mi1">🎯</span><b>ĐẤU NHANH</b><small>Đánh với máy · nhận vàng</small></button>
          <button class="mode big pvp" id="mPvp"><span class="mi1">👥</span><b>2 NGƯỜI</b><small>Hai người cùng một máy</small></button>
        </div></div>
      <div class="hub-dock">
        <button class="ic" id="bDaily">🎁<span>Quà ngày</span><i class="dot"></i></button>
        <button class="ic" id="bMis">📋<span>Nhiệm vụ</span><i class="dot"></i></button>
        <button class="ic" id="bWheel">🎡<span>Vòng quay</span><i class="dot"></i></button>
        <button class="ic" id="bShop">🛒<span>Cửa hàng</span><i class="dot"></i></button>
        <button class="ic" id="bSet">⚙️<span>Cài đặt</span></button>
      </div></div>`));
    document.body.appendChild(el(`<div id="campScr" class="screen">
      <div class="scr-head"><button id="campBack">← Sảnh</button><h2>CHIẾN DỊCH</h2>${curBar()}</div>
      <div class="tabs" id="chTabs"></div><div class="stages" id="stageGrid"></div></div>`));
    // Thêm vào màn chọn đội
    const mi = document.querySelector('#menu .mi');
    mi.insertBefore(el(`<div class="backrow"><button id="tsBack">← Trở về</button>${curBar()}</div>`), mi.firstChild);
    $('teams').insertBefore(el('<div id="stageInfo"></div>'), $('teams').lastElementChild);
    document.querySelector('#menu .opts').insertBefore(el(`<div class="seg" id="diffSeg">${Object.entries(DIFF).map(([k, d]) => `<button data-v="${k}">${d.name}</button>`).join('')}</div>`), $('randTeam'));
    $('diffSeg').querySelectorAll('button').forEach(b => b.onclick = () => { S.diff = b.dataset.v; save(); syncDiff(); });
    document.querySelectorAll('.card').forEach(c => c.insertAdjacentHTML('beforeend', '<div class="lockb"></div>'));
    // Nút
    document.addEventListener('click', e => { const p = e.target.closest('[data-shop]'); if (p) openShop(p.dataset.shop === 'gems' ? 'gems' : 'offers'); });
    $('mCamp').onclick = () => { click(); openCampaign(); };
    $('mQuick').onclick = () => { click(); openTeamSelect('quick'); };
    $('mPvp').onclick = () => { click(); openTeamSelect('pvp'); };
    $('bDaily').onclick = () => { click(); openDaily(); };
    $('bMis').onclick = () => { click(); openMissions(); };
    $('bWheel').onclick = () => { click(); openWheel(); };
    $('bShop').onclick = () => { click(); openShop('offers'); };
    $('bSet').onclick = () => { click(); openSettings(); };
    $('campBack').onclick = () => { click(); showHub(); };
    $('tsBack').onclick = () => { click(); ctx.mode === 'campaign' ? openCampaign() : showHub(); };
  }
  const click = () => { try { SFX.click(); } catch (_) {} };

  // ================= Màn hình =================
  const ctx = {mode:'quick', stage:null, chapter:0};
  function screen(id) {
    ['hub', 'campScr'].forEach(s => $(s).classList.toggle('show', s === id));
    menu.style.display = id === 'menu' ? 'block' : 'none';
    renderBars();
  }
  let dailyShown = false;
  function showHub() {
    screen('hub'); drawAvatar();
    if (!dailyShown && dailyState().can) { dailyShown = true; setTimeout(openDaily, 400); }
  }
  function drawAvatar() {
    const g = $('hubAva').getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 96, 96);
    const k = KEYS.find(k => S.unlocked[k]) || 'ox';
    portrait(g, 48, 48, 44, k, TEAM_COL[0], {ring:5, ringCol:'#ffd34a', hat:S.hat});
  }

  // ================= Chiến dịch =================
  function openCampaign() {
    screen('campScr');
    ctx.chapter = Math.min(2, Math.floor((Math.min(S.stage, 30) - 1)/10));
    renderCampaign();
  }
  function renderCampaign() {
    $('chTabs').innerHTML = CHAPTERS.map((c, i) => {
      const st = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((a, k) => a + (S.stars[i*10 + k] || 0), 0), lock = S.stage <= i*10;
      return `<button data-c="${i}" class="${i === ctx.chapter ? 'on' : ''}" ${lock ? 'disabled' : ''}>${lock ? '🔒 ' : ''}Chương ${i + 1}: ${c.name} · ${st}/30★</button>`;
    }).join('');
    $('chTabs').querySelectorAll('button').forEach(b => b.onclick = () => { ctx.chapter = +b.dataset.c; renderCampaign(); });
    let h = '';
    for (let k = 1; k <= 10; k++) {
      const n = ctx.chapter*10 + k, st = stage(n), s = S.stars[n] || 0, lock = n > S.stage;
      h += `<button class="stg ${st.boss ? 'boss' : ''} ${lock ? 'lock' : ''}" data-n="${n}">${st.boss ? '<span class="bt">TRÙM</span>' : ''}${lock ? '🔒' : n}<small>${'★'.repeat(s)}${'☆'.repeat(3 - s)}</small></button>`;
    }
    $('stageGrid').innerHTML = h;
    $('stageGrid').querySelectorAll('.stg').forEach(b => b.onclick = () => {
      const n = +b.dataset.n; click();
      if (n > S.stage) return PF.toast('Hãy vượt màn trước để mở khóa');
      openStage(n);
    });
  }
  function foesHtml(st) { return `<div class="foes">${st.b.map((k, i) => `<canvas width="128" height="128" data-k="${k}" data-boss="${st.boss && i === 0 ? 1 : 0}"></canvas>`).join('')}</div>`; }
  function paintFoes(root) {
    root.querySelectorAll('.foes canvas').forEach(c => portrait(c.getContext('2d'), 64, 64, 58, c.dataset.k, TEAM_COL[1], {ring:c.dataset.boss === '1' ? 7 : 4, ringCol:c.dataset.boss === '1' ? '#ff4a3a' : TEAM_COL[1], flip:true, hat:c.dataset.boss === '1' ? 'crown' : 'none'}));
  }
  function openStage(n) {
    const st = stage(n), first = !S.stars[n];
    modal(`<h2>MÀN ${n}${st.boss ? ' · TRÙM' : ''}</h2><div class="mtxt">Chương ${st.ch + 1}: ${CHAPTERS[st.ch].name}</div>${foesHtml(st)}
      <div class="mtxt"><small>Máu địch ×${st.hp}${st.boss ? ' · Trùm ×1.8' : ''} · Gió tối đa ${st.windMax} · Độ chính xác của máy ${Math.round(st.skill*100)}%</small></div>
      <div class="rw"><span>${first ? 'Lần đầu' : 'Chơi lại'}: +${fmt(first ? st.coins : Math.round(st.coins*.3))} 🪙${first && st.gems ? ` +${st.gems} 💎` : ''}</span><span>Mỗi sao mới +3 💎</span></div>
      <div class="mtxt" style="text-align:left;font-size:14px">★ Chiến thắng<br>★★ Không mất đồng đội nào<br>★★★ Còn từ 60% máu cả đội trở lên</div>`,
      [['Chọn đội ▶', () => { ctx.stage = n; openTeamSelect('campaign', n); }], ['Đóng', null]], box => paintFoes(box));
  }

  // ================= Chọn đội =================
  function syncDiff() { $('diffSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === S.diff)); }
  function openTeamSelect(mode, n) {
    ctx.mode = mode; if (mode !== 'campaign') ctx.stage = null;
    screen('menu');
    const camp = mode === 'campaign', blue = document.querySelector('.team.blue');
    $('modeSeg').style.display = 'none';
    $('mapSeg').style.display = camp ? 'none' : '';
    $('diffSeg').style.display = mode === 'quick' ? '' : 'none';
    blue.style.display = camp ? 'none' : '';
    blue.querySelector('h3').textContent = mode === 'pvp' ? 'NGƯỜI CHƠI 2' : 'ĐỘI XANH (MÁY)';
    document.querySelector('.team.red h3').textContent = mode === 'pvp' ? 'NGƯỜI CHƠI 1' : 'ĐỘI CỦA BẠN';
    const si = $('stageInfo');
    if (camp) { const st = stage(n); si.style.display = 'block'; si.innerHTML = `<h3>MÀN ${n}${st.boss ? ' · TRÙM' : ''}</h3>${foesHtml(st)}`; paintFoes(si); }
    else si.style.display = 'none';
    $('start').textContent = camp ? `BẮT ĐẦU MÀN ${n}` : 'BẮT ĐẦU';
    ['r0', 'r1'].concat(mode === 'pvp' ? ['b0', 'b1'] : []).forEach(s => { if (!S.unlocked[sel[s]]) sel[s] = KEYS.find(k => S.unlocked[k] && k !== sel[s === 'r0' ? 'r1' : s === 'r1' ? 'r0' : s === 'b0' ? 'b1' : 'b0']) || 'ox'; });
    activeSlot = 'r0';
    syncDiff(); refreshCards(); renderSlots();
    document.querySelector('.hint').textContent = camp ? 'Chọn 2 pháo thủ cho đội của bạn' : 'Chọn một ô ở trên, rồi bấm vào nhân vật bên dưới';
  }
  function needsUnlock(slot) { return slot[0] === 'r' || ctx.mode === 'pvp'; }
  function canPick(slot, k) { return !needsUnlock(slot) || !!S.unlocked[k]; }
  function nextSlot(s) {
    const order = ctx.mode === 'campaign' ? ['r0', 'r1'] : ['r0', 'r1', 'b0', 'b1'];
    return order[(order.indexOf(s) + 1) % order.length];
  }
  function refreshCards() {
    document.querySelectorAll('.card').forEach(c => {
      const k = c.dataset.k, p = CHAR_PRICE[k], lock = !S.unlocked[k];
      c.classList.toggle('locked', lock);
      const lb = c.querySelector('.lockb'); if (lb && p) lb.textContent = `🔒 ${fmt(p.coins)} 🪙`;
    });
  }
  function unlockChar(k, cur, done) {
    const p = CHAR_PRICE[k];
    if (!spend(cur, p[cur])) return;
    S.unlocked[k] = 1; save(); refreshCards(); PF.toast(`🎉 Đã mở khóa ${CHARS[k].name}!`); PF.log('unlock_char', {k, cur});
    if (done) done();
  }
  function promptUnlock(k, done) {
    const p = CHAR_PRICE[k];
    modal(`<h2>MỞ KHÓA</h2><div class="foes"><canvas width="160" height="160" data-k="${k}"></canvas></div><h3>${CHARS[k].name}</h3><div class="mtxt">${CHARS[k].desc}</div>`,
      [[`${fmt(p.coins)} 🪙`, () => unlockChar(k, 'coins', done)], [`${p.gems} 💎`, () => unlockChar(k, 'gems', done)], ['Để sau', null]],
      box => { const c = box.querySelector('canvas'); portrait(c.getContext('2d'), 80, 80, 74, k, TEAM_COL[0], {ring:5, hat:S.hat}); });
  }
  function randomTeam() {
    const mine = KEYS.filter(k => S.unlocked[k]), any = KEYS;
    const pick = a => a[Math.random()*a.length|0];
    sel.r0 = pick(mine); sel.r1 = pick(mine);
    sel.b0 = pick(ctx.mode === 'pvp' ? mine : any); sel.b1 = pick(ctx.mode === 'pvp' ? mine : any);
  }
  function buildCfg() {
    const r = [sel.r0, sel.r1];
    if (r.some(k => !S.unlocked[k])) { PF.toast('Đội của bạn có nhân vật chưa mở khóa'); return null; }
    if (ctx.mode === 'pvp') {
      if ([sel.b0, sel.b1].some(k => !S.unlocked[k])) { PF.toast('Người chơi 2 có nhân vật chưa mở khóa'); return null; }
      return {r, b:[sel.b0, sel.b1], mode:'pvp', map:mapSel, hat:S.hat};
    }
    if (ctx.mode === 'quick') return {r, b:[sel.b0, sel.b1], mode:'ai', map:mapSel, skill:DIFF[S.diff].skill, diff:S.diff, hat:S.hat};
    const st = stage(ctx.stage);
    return {r, b:st.b, mode:'ai', map:st.map, skill:st.skill, bHp:st.hp, boss:st.boss ? 0 : -1, windMax:st.windMax, stage:st.n, hat:S.hat};
  }
  function beforeMatch(cfg, go) {
    PF.log('match_start', {mode:ctx.mode, stage:cfg.stage || 0});
    if (S.tutorial) return go();
    modal(`<h2>CÁCH CHƠI</h2><div class="tut">
      <div><b class="k">🎯</b><span><b>Ngắm:</b> kéo ngón tay/chuột trên màn chơi, hoặc dùng phím ▲ ▼. Mỗi nhân vật có giới hạn góc riêng.</span></div>
      <div><b class="k">💪</b><span><b>Bắn:</b> giữ nút BẮN (hoặc Space) để nạp lực, thả ra để bắn. Vạch trắng trên thanh lực là lực phát trước.</span></div>
      <div><b class="k">🌬️</b><span><b>Gió:</b> mũi tên ở giữa phía trên cho biết hướng và sức gió. Gió đẩy đạn lệch đi!</span></div>
      <div><b class="k">⭐</b><span><b>POW:</b> gây/nhận sát thương và mỗi lượt đều nạp thanh POW. Đầy thì chọn: bấm 3 tung Siêu đạn, hoặc bấm nút POW để đạn lượt đó mạnh ×1.5, nổ to hơn.</span></div></div>`,
      [['Vào trận!', () => { S.tutorial = true; save(); go(); }]]);
  }

  // ================= Kết thúc trận =================
  let lastRes = null;
  function onMatchEnd(winTeam, list, cfg) {
    if (cfg.mode === 'pvp') { S.matches++; S.sinceAd++; save(); PF.log('match_end', {mode:'pvp'}); return lastRes = {pvp:true}; }
    const won = winTeam === 0, mine = list.filter(u => u.team === 0);
    const dmg = mine.reduce((a, u) => a + u.dmg, 0);
    let coins = won ? 45 : 15, gems = 0, stars = 0, newStars = 0, first = false;
    const xp = Math.round(dmg/3) + (won ? 40 : 15);
    if (cfg.diff) coins = Math.round(coins*DIFF[cfg.diff].mul);
    if (cfg.stage) {
      if (won) {
        stars = 1; if (mine.every(u => u.alive)) stars++;
        if (mine.reduce((a, u) => a + u.hp, 0)/mine.reduce((a, u) => a + u.maxhp, 0) >= .6) stars++;
        const prev = S.stars[cfg.stage] || 0, st = stage(cfg.stage);
        first = prev === 0; newStars = Math.max(0, stars - prev);
        if (stars > prev) S.stars[cfg.stage] = stars;
        coins = first ? st.coins : Math.round(st.coins*.3);
        gems = (first ? st.gems : 0) + newStars*3;
        if (cfg.stage === S.stage && S.stage <= 30) S.stage = Math.min(31, S.stage + 1);
        track('stage');
        PF.log('stage_clear', {stage:cfg.stage, stars});
      } else { coins = 10; PF.log('stage_fail', {stage:cfg.stage}); }
    }
    let chest = null;
    if (won && Math.random() < .55) chest = Math.random() < .75 ? {coins:30 + (Math.random()*90|0)} : {gems:2 + (Math.random()*5|0)};
    S.matches++; S.sinceAd++; if (won) S.wins++;
    track('match'); if (won) track('win');
    give({coins:coins + (chest && chest.coins || 0), gems:gems + (chest && chest.gems || 0), xp});
    PF.log('match_end', {won, mode:ctx.mode, coins, gems});
    return lastRes = {won, coins, gems, xp, stars, newStars, chest, stage:cfg.stage, doubled:false};
  }
  function renderResult(box, res) {
    if (res.pvp) { box.innerHTML = ''; $('again').textContent = '🔁 Đấu lại'; return; }
    let h = '';
    if (res.stage) h += `<div class="stars">${[1, 2, 3].map(i => i <= res.stars ? `<b style="animation-delay:${i*.18}s">★</b>` : '☆').join('')}</div>`;
    h += `<div class="rw">${rwTxt(res).map(t => `<span>${t}</span>`).join('')}${res.chest ? `<span>🎁 Rương: ${rwTxt(res.chest).join(' ')}</span>` : ''}</div>`;
    if (res.coins + res.gems > 0) h += `<button id="dblBtn" class="on">📺 Xem quảng cáo nhận x2 (${rwTxt({coins:res.coins, gems:res.gems}).join(' ')})</button>`;
    box.innerHTML = h;
    const b = $('dblBtn');
    if (b) b.onclick = async () => {
      b.disabled = true;
      if (await PF.ads.rewarded('double_reward')) { give({coins:res.coins, gems:res.gems}); res.doubled = true; b.textContent = '✓ Đã nhận x2!'; PF.toast(`Nhận thêm ${rwTxt({coins:res.coins, gems:res.gems}).join(' ')}`); }
      else { b.disabled = false; PF.toast('Quảng cáo chưa sẵn sàng, thử lại sau.'); }
    };
    $('again').textContent = res.stage && res.won && res.stage < 30 ? `Màn ${res.stage + 1} ▶` : '🔁 Đấu lại';
  }
  // Gọi khi rời màn kết quả: quảng cáo chuyển cảnh có giới hạn + mời đánh giá.
  async function afterResult(next) {
    const now = Date.now()/1000;
    if (!S.noAds && S.matches > C.ads.firstFreeMatches && S.sinceAd >= C.ads.interstitialEvery && now - S.lastAd > C.ads.interstitialMinGapSec) {
      if (await PF.ads.interstitial()) { S.sinceAd = 0; S.lastAd = now; save(); }
    }
    next();
    if (S.wins >= 3 && !S.rated && lastRes && lastRes.won) {
      S.rated = true; save();
      setTimeout(() => modal('<h2>BẠN THÍCH GAME CHỨ?</h2><div class="mtxt">Nếu Pháo Thủ Mây làm bạn vui, một đánh giá 5 sao giúp game đến được với nhiều người hơn!</div>',
        [['⭐ Đánh giá ngay', () => PF.rate()], ['Để sau', null]]), 600);
    }
  }
  function nextCfg() {
    if (lastRes && lastRes.stage && lastRes.won && lastRes.stage < 30) { ctx.stage = lastRes.stage + 1; return buildCfg(); }
    return null;
  }

  // ================= Quà ngày / Nhiệm vụ / Vòng quay =================
  function openDaily() {
    const d = dailyState();
    const tiles = DAILY.map((r, i) => `<div class="day ${i < d.idx || (!d.can && i === d.idx) ? 'got' : ''} ${d.can && i === d.idx ? 'now' : ''}"><b>Ngày ${i + 1}</b><span>${r.gems ? '💎' : '🪙'}</span>${rwTxt(r).join('<br>')}</div>`).join('');
    modal(`<h2>QUÀ HẰNG NGÀY</h2><div class="mtxt"><small>Đăng nhập liên tục để nhận quà lớn hơn. Bỏ lỡ một ngày sẽ quay về ngày 1.</small></div><div class="days">${tiles}</div>`,
      d.can ? [['Nhận quà', () => {
        const r = DAILY[d.idx]; S.daily = {last:today(), idx:d.idx + 1}; give(r);
        PF.toast(`🎁 ${rwTxt(r).join(' ')}`); PF.log('daily_claim', {day:d.idx + 1});
        PF.remindTomorrow('🎁 Quà hằng ngày đang chờ!', `Vào Pháo Thủ Mây nhận quà ngày ${(d.idx + 1) % 7 + 1} nhé!`);
      }]] : [['Ngày mai quay lại nhé!', null]]);
  }
  function openMissions() {
    ensureDay();
    const render = () => S.missions.list.map((m, i) => `<div class="mis"><div class="mt"><b>${m.txt}</b> <small>(${m.p}/${m.n})</small><div class="pb"><i style="width:${m.p/m.n*100}%"></i></div></div>
      <button data-i="${i}" ${!m.done || m.claimed ? 'disabled' : ''} class="${m.done && !m.claimed ? 'on' : ''}">${m.claimed ? '✓ Đã nhận' : rwTxt(m.r).join(' ')}</button></div>`).join('');
    modal(`<h2>NHIỆM VỤ HÔM NAY</h2><div id="misList">${render()}</div><div class="mtxt"><small>Nhiệm vụ mới mỗi ngày.</small></div>`, [['Đóng', null]], box => {
      const bind = () => box.querySelectorAll('#misList button').forEach(b => b.onclick = () => {
        const m = S.missions.list[+b.dataset.i]; if (!m.done || m.claimed) return;
        m.claimed = true; give(m.r); PF.toast(rwTxt(m.r).join(' ')); $('misList').innerHTML = render(); bind();
      });
      bind();
    });
  }
  function openWheel() {
    ensureDay();
    modal(`<h2>VÒNG QUAY MAY MẮN</h2><canvas id="wheelCv" width="560" height="560"></canvas><div class="mtxt"><small id="wheelInfo"></small></div>`,
      [['QUAY', null, 'spinBtn'], ['Đóng', null]], box => {
        const cv = $('wheelCv'), g = cv.getContext('2d'), seg = Math.PI*2/WHEEL.length;
        let rot = 0, spinning = false;
        const draw = () => {
          g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 280, 280);
          WHEEL.forEach((w, i) => {
            const a0 = rot + i*seg - Math.PI/2;
            g.beginPath(); g.moveTo(140, 140); g.arc(140, 140, 128, a0, a0 + seg); g.closePath(); g.fillStyle = w.c; g.fill();
            g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.stroke();
            g.save(); g.translate(140, 140); g.rotate(a0 + seg/2); g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = '800 15px "Baloo 2",sans-serif';
            g.fillText(rwTxt(w)[0], 118, 5); g.restore();
          });
          g.beginPath(); g.arc(140, 140, 130, 0, Math.PI*2); g.lineWidth = 6; g.strokeStyle = '#ffd34a'; g.stroke();
          g.beginPath(); g.arc(140, 140, 18, 0, Math.PI*2); g.fillStyle = '#ffd34a'; g.fill();
          g.beginPath(); g.moveTo(128, 2); g.lineTo(152, 2); g.lineTo(140, 26); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#2a1700'; g.lineWidth = 2; g.stroke();
        };
        const btn = $('spinBtn'), info = $('wheelInfo');
        const sync = () => {
          if (S.spin.free > 0) { btn.textContent = 'QUAY MIỄN PHÍ'; btn.disabled = false; }
          else if (S.spin.ad < 3) { btn.textContent = `📺 Xem quảng cáo để quay (${3 - S.spin.ad})`; btn.disabled = false; }
          else { btn.textContent = 'Hết lượt hôm nay'; btn.disabled = true; }
          info.textContent = 'Mỗi ngày 1 lượt miễn phí, thêm 3 lượt bằng quảng cáo.';
        };
        draw(); sync();
        btn.onclick = async () => {
          if (spinning) return;
          if (S.spin.free > 0) S.spin.free--;
          else if (S.spin.ad < 3) { btn.disabled = true; if (!(await PF.ads.rewarded('wheel'))) { sync(); return; } S.spin.ad++; }
          else return;
          save(); spinning = true; btn.disabled = true;
          const tot = WHEEL.reduce((a, w) => a + w.w, 0); let r = Math.random()*tot, idx = 0;
          while (r >= WHEEL[idx].w) { r -= WHEEL[idx].w; idx++; }
          const start = rot, target = -(idx + .5)*seg + Math.PI*2*(6 + Math.ceil(start/(Math.PI*2))), t0 = performance.now(), dur = 3600;
          const step = now => {
            const k = Math.min(1, (now - t0)/dur), e = 1 - (1 - k)**4;
            rot = start + (target - start)*e; draw();
            if (k < 1) requestAnimationFrame(step);
            else { spinning = false; rot %= Math.PI*2; give(WHEEL[idx]); PF.toast(`🎡 Trúng ${rwTxt(WHEEL[idx]).join(' ')}!`); PF.log('wheel_spin', {idx}); sync(); }
          };
          requestAnimationFrame(step);
        };
      });
  }

  // ================= Cửa hàng =================
  function openShop(tab = 'offers') {
    modal(`<h2>CỬA HÀNG</h2>${curBar()}<div class="tabs" id="shopTabs">
      <button data-t="offers">Ưu đãi</button><button data-t="gems">Kim cương</button><button data-t="chars">Nhân vật</button><button data-t="hats">Mũ</button></div><div id="shopBody"></div>`,
      [['Đóng', null]], box => {
        box.querySelector('.box').style.width = 'min(760px,100%)';
        box.querySelector('.curs').style.justifyContent = 'center';
        const render = t => {
          box.querySelectorAll('#shopTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
          const B = $('shopBody'); let h = '<div class="shopgrid">';
          if (t === 'offers') {
            const sp = PF.iap.byId('starter_pack');
            if (!S.starter) h += `<div class="item hot"><div><span class="tag">CHỈ 1 LẦN</span><h3>🎁 ${sp.name}</h3><div>Mở khóa <b>Rùa Băng</b> + ${sp.gems} 💎 + ${fmt(sp.coins)} 🪙</div></div><button class="on" data-buy="starter_pack">${PF.iap.price('starter_pack')}</button></div>`;
            h += `<div class="item"><div class="big">🚫</div><b>Xóa quảng cáo</b><small>Tắt quảng cáo chuyển cảnh vĩnh viễn. Quảng cáo nhận thưởng vẫn tùy bạn chọn.</small>${S.noAds ? '<button disabled>✓ Đã sở hữu</button>' : `<button data-buy="remove_ads">${PF.iap.price('remove_ads')}</button>`}</div>`;
            const left = C.ads.rewardedGemsPerDay - S.adGems.n;
            h += `<div class="item"><div class="big">📺</div><b>Kim cương miễn phí</b><small>Xem quảng cáo nhận ${C.ads.rewardedGemsAmount} 💎 · còn ${left}/${C.ads.rewardedGemsPerDay} lượt hôm nay</small><button data-adgems ${left <= 0 ? 'disabled' : ''}>Xem quảng cáo</button></div>`;
            h += `<div class="item"><div class="big">🪙</div><b>500 vàng</b><small>Đổi bằng kim cương</small><button data-ex="500">25 💎</button></div>`;
            h += `<div class="item"><div class="big">💰</div><b>3.000 vàng</b><small>Đổi bằng kim cương</small><button data-ex="3000">120 💎</button></div>`;
          } else if (t === 'gems') {
            C.iap.filter(p => p.type === 'consumable').forEach(p => h += `<div class="item">${p.tag ? `<span class="tag">${p.tag}</span>` : ''}<div class="big">💎</div><b>${p.name}</b><button class="on" data-buy="${p.id}">${PF.iap.price(p.id)}</button></div>`);
          } else if (t === 'chars') {
            KEYS.forEach(k => {
              const p = CHAR_PRICE[k];
              h += `<div class="item"><canvas width="144" height="144" data-k="${k}"></canvas><b>${CHARS[k].name}</b><small>${CHARS[k].role}</small>${S.unlocked[k] ? '<button disabled>✓ Đã có</button>' : `<button data-uc="${k}" data-cur="coins">${fmt(p.coins)} 🪙</button><button data-uc="${k}" data-cur="gems">${p.gems} 💎</button>`}</div>`;
            });
          } else {
            HATS.forEach(hh => {
              const own = S.hats[hh.id], eq = S.hat === hh.id;
              h += `<div class="item"><canvas width="144" height="144" data-hat="${hh.id}"></canvas><b>${hh.name}</b>${eq ? '<button disabled>✓ Đang đội</button>' : own ? `<button data-eq="${hh.id}">Đội</button>` : `<button data-hb="${hh.id}">${hh.price} 💎</button>`}</div>`;
            });
          }
          B.innerHTML = h + '</div>';
          B.querySelectorAll('canvas[data-k]').forEach(c => portrait(c.getContext('2d'), 72, 72, 66, c.dataset.k, TEAM_COL[0], {ring:4, hat:S.hat}));
          B.querySelectorAll('canvas[data-hat]').forEach(c => portrait(c.getContext('2d'), 72, 72, 66, 'frog', TEAM_COL[0], {ring:4, hat:c.dataset.hat}));
          B.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => PF.iap.buy(b.dataset.buy));
          B.querySelectorAll('[data-uc]').forEach(b => b.onclick = () => unlockChar(b.dataset.uc, b.dataset.cur, () => render(t)));
          B.querySelectorAll('[data-hb]').forEach(b => b.onclick = () => { const hh = HATS.find(x => x.id === b.dataset.hb); if (spend('gems', hh.price)) { S.hats[hh.id] = 1; S.hat = hh.id; save(); PF.log('buy_hat', {id:hh.id}); render(t); drawAvatar(); } });
          B.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { S.hat = b.dataset.eq; save(); render(t); drawAvatar(); });
          B.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { const n = +b.dataset.ex, cost = n === 500 ? 25 : 120; if (spend('gems', cost)) { give({coins:n}); PF.toast(`+${fmt(n)} 🪙`); } });
          B.querySelectorAll('[data-adgems]').forEach(b => b.onclick = async () => {
            b.disabled = true;
            if (await PF.ads.rewarded('free_gems')) { S.adGems.n++; give({gems:C.ads.rewardedGemsAmount}); PF.toast(`+${C.ads.rewardedGemsAmount} 💎`); }
            render(t);
          });
        };
        box.querySelectorAll('#shopTabs button').forEach(b => b.onclick = () => render(b.dataset.t));
        shopRender = () => render(box.querySelector('#shopTabs .on') ? box.querySelector('#shopTabs .on').dataset.t : tab);
        render(tab); renderBars();
      }, () => { shopRender = null; });
  }
  let shopRender = null;
  PF.on('grant', (id, o) => {
    const p = PF.iap.byId(id); if (!p) return;
    if (id === 'remove_ads') S.noAds = true;
    if (id === 'starter_pack') { S.starter = true; S.unlocked[p.unlock] = 1; if (!o.restore) { S.gems += p.gems; S.coins += p.coins; } }
    if (p.type === 'consumable' && !o.restore) S.gems += p.gems;
    save(); refreshCards();
    if (!o.restore) PF.toast(`🎉 Mua thành công: ${p.name}`);
    PF.log('purchase', {id});
    if (shopRender) shopRender();
  });

  // ================= Cài đặt =================
  function applySettings() {
    try {
      volM = S.settings.music/100; volS = S.settings.sfx/100; shakeOn = S.settings.shake;
      if (musG) musG.gain.value = volM; if (sfxG) sfxG.gain.value = volS;
      $('volM').value = S.settings.music; $('volS').value = S.settings.sfx; $('optShake').checked = S.settings.shake;
    } catch (_) {}
  }
  function openSettings() {
    modal(`<h2>CÀI ĐẶT</h2>
      <div class="set"><span>🎵 Nhạc nền</span><input type="range" id="sM" min="0" max="100" value="${S.settings.music}"></div>
      <div class="set"><span>🔊 Hiệu ứng</span><input type="range" id="sS" min="0" max="100" value="${S.settings.sfx}"></div>
      <div class="set"><span>📳 Rung màn hình</span><input type="checkbox" id="sK" ${S.settings.shake ? 'checked' : ''}></div>
      <div class="btns"><button id="sRestore">Khôi phục giao dịch</button><button id="sTut">Xem lại cách chơi</button><button id="sPriv">Chính sách quyền riêng tư</button></div>
      <div class="mtxt"><small>Phiên bản ${C.version}${C.ads.testing ? ' · quảng cáo thử' : ''}</small></div>`, [['Xong', null]], () => {
        $('sM').oninput = e => { S.settings.music = +e.target.value; applySettings(); save(); };
        $('sS').oninput = e => { S.settings.sfx = +e.target.value; applySettings(); save(); };
        $('sK').onchange = e => { S.settings.shake = e.target.checked; applySettings(); save(); };
        $('sRestore').onclick = () => PF.iap.restore();
        $('sTut').onclick = () => { S.tutorial = false; save(); PF.toast('Hướng dẫn sẽ hiện ở trận tiếp theo'); };
        $('sPriv').onclick = () => PF.openUrl(C.privacyUrl);
      });
  }

  // ================= Hộp thoại =================
  const modals = [];
  function modal(html, buttons, onOpen, onClose) {
    const o = el(`<div class="ovl show"><div class="box">${html}<div class="btns">${buttons.map((b, i) => `<button data-mb="${i}" ${b[2] ? `id="${b[2]}"` : ''} class="${i === 0 ? 'on' : ''}">${b[0]}</button>`).join('')}</div></div></div>`);
    const close = () => { o.remove(); modals.splice(modals.indexOf(rec), 1); if (onClose) onClose(); renderBars(); };
    const rec = {o, close};
    o.querySelectorAll('[data-mb]').forEach(b => { const [, fn, id] = buttons[+b.dataset.mb]; if (id && !fn) return; b.onclick = () => { click(); close(); if (fn) fn(); }; });
    document.body.appendChild(o); modals.push(rec);
    if (onOpen) onOpen(o);
    renderBars();
    return rec;
  }

  // ================= Nút Back (Android) & tạm dừng khi ẩn app =================
  PF.on('back', () => {
    if (modals.length) return modals[modals.length - 1].close();
    if ($('pause').classList.contains('show')) return togglePause(false);
    if ($('result').classList.contains('show')) return $('resMenu').click();
    if (!isDemo() && state !== 'over' && menu.style.display === 'none' && !$('hub').classList.contains('show') && !$('campScr').classList.contains('show') && $('title').style.display === 'none') return togglePause(true);
    if (menu.style.display !== 'none') return $('tsBack').click();
    if ($('campScr').classList.contains('show')) return showHub();
    modal('<h2>THOÁT GAME?</h2>', [['Thoát', () => PF.exit()], ['Ở lại', null]]);
  });
  PF.on('pause', () => { try { if (!isDemo() && ['aim', 'ai', 'fly', 'settle', 'cutin'].includes(state)) togglePause(true); if (AC) AC.suspend(); } catch (_) {} });
  PF.on('resume', () => { try { if (AC && !document.hidden) AC.resume(); } catch (_) {} });
  PF.on('adstart', () => { try { if (AC) AC.suspend(); } catch (_) {} });
  PF.on('adend', () => { try { if (AC) AC.resume(); } catch (_) {} });

  window.Meta = {
    get save() { return S; }, track, onMatchEnd, renderResult, afterResult, nextCfg, buildCfg, beforeMatch, canPick, nextSlot,
    promptUnlock, refreshCards, randomTeam, showHub, openTeamSelect, openShop, applySettings, ctx, HATS, openCampaign,
    setSetting(k, v) { S.settings[k] = v; save(); },
    init() { ensureDay(); buildUI(); applySettings(); save(); PF.init(); },
  };
})();
