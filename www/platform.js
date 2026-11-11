// Lớp nền tảng: quảng cáo (AdMob), mua hàng trong app, thông báo, rung, nút Back, đánh giá.
// Trên app (Capacitor) dùng plugin thật; trên web dùng bản mô phỏng có ghi rõ "chế độ thử".
(function () {
  const C = window.GAME_CONFIG;
  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const os = native ? cap.getPlatform() : 'web';
  const P = native ? cap.Plugins : {};
  const L = {back: [], pause: [], resume: [], grant: [], adstart: [], adend: []};

  const Platform = {
    native, os,
    on(ev, fn) { L[ev].push(fn); },
    emit(ev, ...a) { L[ev].forEach(f => { try { f(...a); } catch (e) { console.error(e); } }); },

    // ---------- Phân tích (gắn Firebase/GA sau, hiện ghi console) ----------
    log(ev, params = {}) { try { if (P.FirebaseAnalytics) P.FirebaseAnalytics.logEvent({name: ev, params}); } catch (_) {} if (!native) console.debug('[analytics]', ev, params); },

    haptic(kind = 'LIGHT') { try { if (P.Haptics) P.Haptics.impact({style: kind}); else if (navigator.vibrate) navigator.vibrate(kind === 'HEAVY' ? 40 : 15); } catch (_) {} },

    // ---------- Quảng cáo ----------
    ads: {
      async init() {
        if (!native || !P.AdMob) return;
        try {
          await P.AdMob.initialize({initializeForTesting: C.ads.testing, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false});
          if (os === 'ios' && P.AdMob.requestTrackingAuthorization) { try { await P.AdMob.requestTrackingAuthorization(); } catch (_) {} }
          const info = await P.AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === 'REQUIRED') await P.AdMob.showConsentForm();
        } catch (e) { console.warn('AdMob init', e); }
        this.preload();
      },
      ids() { return C.ads[os === 'ios' ? 'ios' : 'android']; },
      async preload() {
        if (!native || !P.AdMob) return;
        try { await P.AdMob.prepareInterstitial({adId: this.ids().interstitial, isTesting: C.ads.testing}); this.interReady = true; } catch (_) { this.interReady = false; }
        try { await P.AdMob.prepareRewardVideoAd({adId: this.ids().rewarded, isTesting: C.ads.testing}); this.rewardReady = true; } catch (_) { this.rewardReady = false; }
      },
      async interstitial() {
        Platform.log('ad_interstitial');
        if (!native) return mockAd(false);
        if (!P.AdMob || !this.interReady) { this.preload(); return false; }
        Platform.emit('adstart');
        try { await P.AdMob.showInterstitial(); return true; } catch (_) { return false; }
        finally { Platform.emit('adend'); this.interReady = false; this.preload(); }
      },
      // Trả về true nếu người chơi xem hết và được thưởng.
      async rewarded(placement) {
        Platform.log('ad_rewarded', {placement});
        if (!native) return mockAd(true);
        if (!P.AdMob) return false;
        if (!this.rewardReady) { try { await P.AdMob.prepareRewardVideoAd({adId: this.ids().rewarded, isTesting: C.ads.testing}); } catch (_) { return false; } }
        Platform.emit('adstart');
        try { const r = await P.AdMob.showRewardVideoAd(); return !!(r && (r.amount !== undefined || r.type)); }
        catch (_) { return false; }
        finally { Platform.emit('adend'); this.rewardReady = false; this.preload(); }
      },
    },

    // ---------- Mua hàng trong app ----------
    iap: {
      ready: false,
      byId(id) { return C.iap.find(p => p.id === id); },
      price(id) {
        if (native && window.CdvPurchase) { const p = CdvPurchase.store.get(id); if (p && p.pricing) return p.pricing.price; }
        return this.byId(id).webPrice;
      },
      async init() {
        if (!native) { this.ready = true; return; }
        await new Promise(r => document.readyState === 'complete' && window.CdvPurchase ? r() : document.addEventListener('deviceready', r, {once: true}));
        if (!window.CdvPurchase) return;
        const {store, ProductType, Platform: PF} = CdvPurchase;
        const plat = os === 'ios' ? PF.APPLE_APPSTORE : PF.GOOGLE_PLAY;
        store.register(C.iap.map(p => ({id: p.id, platform: plat, type: p.type === 'consumable' ? ProductType.CONSUMABLE : ProductType.NON_CONSUMABLE})));
        store.when()
          .approved(t => t.verify())
          .verified(r => r.finish())
          .finished(t => t.products.forEach(p => Platform.emit('grant', p.id, {restore: false})));
        await store.initialize([plat]);
        this.ready = true;
      },
      async buy(id) {
        Platform.log('iap_click', {id});
        if (!native) {
          const ok = await mockConfirm(`<b>${this.byId(id).name}</b><br>Giá: ${this.price(id)}<br><small>Bản web đang ở chế độ thử: giao dịch chỉ là mô phỏng, không trừ tiền thật.</small>`, 'Mua (thử)');
          if (ok) Platform.emit('grant', id, {restore: false});
          return ok;
        }
        if (!window.CdvPurchase) return false;
        const p = CdvPurchase.store.get(id), offer = p && p.getOffer();
        if (!offer) { toast('Sản phẩm chưa sẵn sàng, thử lại sau.'); return false; }
        const err = await offer.order();
        return !err;
      },
      async restore() {
        if (!native) { toast('Bản web không có giao dịch để khôi phục.'); return; }
        if (!window.CdvPurchase) return;
        await CdvPurchase.store.restorePurchases();
        C.iap.filter(p => p.type === 'non-consumable').forEach(p => { const q = CdvPurchase.store.get(p.id); if (q && q.owned) Platform.emit('grant', p.id, {restore: true}); });
        toast('Đã khôi phục giao dịch.');
      },
    },

    // ---------- Thông báo nhắc quay lại ----------
    async remindTomorrow(title, body) {
      if (!native || !P.LocalNotifications) return;
      try {
        const perm = await P.LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') return;
        await P.LocalNotifications.cancel({notifications: [{id: 7001}]});
        const at = new Date(); at.setDate(at.getDate() + 1); at.setHours(19, 30, 0, 0);
        await P.LocalNotifications.schedule({notifications: [{id: 7001, title, body, schedule: {at}}]});
      } catch (e) { console.warn('notify', e); }
    },
    async rate() {
      Platform.log('rate_prompt_accept');
      if (native && P.InAppReview) { try { await P.InAppReview.requestReview(); } catch (_) {} }
      else toast('Cảm ơn bạn! Trên app, nút này mở trang đánh giá của cửa hàng.');
    },
    exit() { if (native && P.App) P.App.exitApp(); },
    openUrl(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); },

    async init() {
      if (native) {
        try { if (P.ScreenOrientation) await P.ScreenOrientation.lock({orientation: 'landscape'}); } catch (_) {}
        try { if (P.StatusBar) await P.StatusBar.hide(); } catch (_) {}
        if (P.App) {
          P.App.addListener('backButton', () => Platform.emit('back'));
          P.App.addListener('appStateChange', s => Platform.emit(s.isActive ? 'resume' : 'pause'));
        }
        try { if (P.SplashScreen) setTimeout(() => P.SplashScreen.hide(), 300); } catch (_) {}
      }
      document.addEventListener('visibilitychange', () => Platform.emit(document.hidden ? 'pause' : 'resume'));
      this.ads.init(); this.iap.init();
    },
  };

  // ---------- Hộp thoại dùng chung ----------
  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function toast(msg, ms = 2200) {
    let box = document.getElementById('toasts');
    if (!box) { box = el('<div id="toasts"></div>'); document.body.appendChild(box); }
    const t = el(`<div class="toast">${msg}</div>`); box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  }
  function mockConfirm(html, okText = 'Đồng ý', cancelText = 'Hủy') {
    return new Promise(res => {
      const o = el(`<div class="ovl show modal-ovl"><div class="box"><div class="mtxt">${html}</div><div class="btns"><button class="ok">${okText}</button><button class="no">${cancelText}</button></div></div></div>`);
      document.body.appendChild(o);
      o.querySelector('.ok').onclick = () => { o.remove(); res(true); };
      o.querySelector('.no').onclick = () => { o.remove(); res(false); };
    });
  }
  // Quảng cáo mô phỏng cho bản web (5 giây). Rewarded: chỉ thưởng khi xem hết.
  function mockAd(rewarded) {
    return new Promise(res => {
      Platform.emit('adstart');
      let n = 5;
      const o = el(`<div class="ovl show mockad"><div class="box"><div class="adtag">QUẢNG CÁO MẪU</div><h2>Pháo Thủ Mây</h2><p>Bản web không hiển thị quảng cáo thật.<br>Trên app, đây là vị trí quảng cáo ${rewarded ? 'có thưởng' : 'chuyển cảnh'} của AdMob.</p><div class="adcount">${n}</div><div class="btns"><button class="close" disabled>Đóng</button></div></div></div>`);
      document.body.appendChild(o);
      const cnt = o.querySelector('.adcount'), btn = o.querySelector('.close');
      const iv = setInterval(() => { n--; cnt.textContent = n > 0 ? n : '✓'; if (n <= 0) { clearInterval(iv); btn.disabled = false; btn.textContent = rewarded ? 'Nhận thưởng' : 'Đóng'; } }, 1000);
      btn.onclick = () => { clearInterval(iv); o.remove(); Platform.emit('adend'); res(true); };
    });
  }
  Platform.toast = toast; Platform.confirm = mockConfirm; Platform.el = el;
  window.Platform = Platform;
})();
