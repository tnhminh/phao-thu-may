// Cấu hình phát hành. Trước khi lên store: đổi mã quảng cáo thử sang mã thật và đặt testing = false.
window.GAME_CONFIG = {
  version: '1.0.0',
  appId: 'vn.phaothumay.game',
  privacyUrl: 'privacy.html',
  ads: {
    testing: true,
    // Mã quảng cáo THỬ công khai của Google AdMob — an toàn khi phát triển, không tạo doanh thu.
    android: { interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
    ios:     { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
    interstitialEvery: 3,      // hiện quảng cáo chuyển cảnh sau mỗi 3 trận
    interstitialMinGapSec: 150,
    firstFreeMatches: 3,       // 3 trận đầu đời không có quảng cáo chuyển cảnh
    rewardedGemsPerDay: 5,     // số lần xem quảng cáo nhận kim cương mỗi ngày
    rewardedGemsAmount: 5,
  },
  // Mã sản phẩm phải trùng với mã tạo trong Google Play Console / App Store Connect.
  iap: [
    { id: 'starter_pack', type: 'non-consumable', name: 'Gói Khởi Đầu', gems: 300, coins: 3000, unlock: 'turtle', webPrice: '59.000 ₫' },
    { id: 'remove_ads',   type: 'non-consumable', name: 'Xóa quảng cáo', webPrice: '49.000 ₫' },
    { id: 'gems_100',     type: 'consumable', name: '100 Kim cương', gems: 100, webPrice: '22.000 ₫' },
    { id: 'gems_550',     type: 'consumable', name: '550 Kim cương', gems: 550, webPrice: '99.000 ₫', tag: 'Phổ biến' },
    { id: 'gems_1200',    type: 'consumable', name: '1.200 Kim cương', gems: 1200, webPrice: '199.000 ₫', tag: 'Lời nhất' },
  ],
};
