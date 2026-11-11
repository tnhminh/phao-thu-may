// Lớp nền tảng: quảng cáo (AdMob), mua hàng trong app, thông báo, rung, nút Back, đánh giá.
// Trên app (Capacitor) dùng plugin thật. Bản web là bản chơi thử: không bán hàng bằng tiền thật, không hiện quảng cáo.
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

    // ---------- Phân tích: Firebase Analytics trên app (cần google-services.json / GoogleService-Info.plist) ----------
    // Tên sự kiện/tham số theo quy tắc Firebase: chữ thường, gạch dưới, giá trị là chuỗi hoặc số.
    log(ev, params = {}) {
      const clean = {};
      for (const k in params) { const v = params[k]; clean[k] = typeof v === 'number' || typeof v === 'string' ? v : typeof v === 'boolean' ? +v : String(v); }
      try { if (P.FirebaseAnalytics) Promise.resolve(P.FirebaseAnalytics.logEvent({name: ev, params: clean})).catch(() => {}); } catch (_) {}
      if (!native) console.debug('[analytics]', ev, clean);
    },

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
        if (!native) return false; // web: không có quảng cáo chuyển cảnh
        Platform.log('ad_interstitial');
        if (!P.AdMob || !this.interReady) { this.preload(); return false; }
        Platform.emit('adstart');
        try { await P.AdMob.showInterstitial(); Platform.log('ad_interstitial_shown'); return true; } catch (_) { return false; }
        finally { Platform.emit('adend'); this.interReady = false; this.preload(); }
      },
      // Trả về true nếu người chơi xem hết và được thưởng.
      async rewarded(placement) {
        Platform.log('ad_rewarded', {placement});
        if (!native) { toast('Bản web: nhận thưởng ngay, không cần xem quảng cáo.'); return true; }
        if (!P.AdMob) return false;
        if (!this.rewardReady) { try { await P.AdMob.prepareRewardVideoAd({adId: this.ids().rewarded, isTesting: C.ads.testing}); } catch (_) { return false; } }
        Platform.emit('adstart');
        try { const r = await P.AdMob.showRewardVideoAd(); const ok = !!(r && (r.amount !== undefined || r.type)); if (ok) Platform.log('ad_rewarded_done', {placement}); return ok; }
        catch (_) { return false; }
        finally { Platform.emit('adend'); this.rewardReady = false; this.preload(); }
      },
    },

    // ---------- Mua hàng trong app ----------
    iap: {
      ready: false,
      available: native, // web: không bán hàng bằng tiền thật
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
          toast(C.storeUrl ? 'Gói này chỉ có trên ứng dụng — đang mở cửa hàng ứng dụng…' : 'Gói này chỉ có trên ứng dụng điện thoại.');
          if (C.storeUrl) Platform.openUrl(C.storeUrl);
          return false;
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
  Platform.toast = toast; Platform.confirm = mockConfirm; Platform.el = el;
  window.Platform = Platform;
})();
