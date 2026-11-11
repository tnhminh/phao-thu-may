# Checklist ra mắt — Pháo Thủ Mây (Giai đoạn 0: ra mắt thử)

Phần code đã chuẩn bị sẵn. Những việc dưới đây cần **tài khoản của bạn** nên phải tự làm.
Làm xong thì chạy `npm run release:check`. Script báo ✅ là build được bản phát hành.

## 1. AdMob — quảng cáo thật
- [ ] Tạo ứng dụng Android trên [AdMob](https://admob.google.com), lấy **App ID** (`ca-app-pub-…~…`).
- [ ] Tạo 2 đơn vị quảng cáo: **Interstitial** (chuyển cảnh) và **Rewarded** (có thưởng).
- [ ] Điền vào `www/config.js` → `ads.android.interstitial`, `ads.android.rewarded`, rồi đặt `ads.testing: false`.
- [ ] Thay App ID trong `android/app/src/main/AndroidManifest.xml` (dòng `com.google.android.gms.ads.APPLICATION_ID`).
- [ ] (iOS, làm sau) Làm tương tự với `ads.ios` và `GADApplicationIdentifier` trong `ios/App/App/Info.plist`.
- [ ] **app-ads.txt**: AdMob yêu cầu file này ở gốc tên miền "trang web nhà phát triển" khai trên Google Play.
  Nếu dùng GitHub Pages, cần repo `tnhminh.github.io` để file nằm ở `https://tnhminh.github.io/app-ads.txt`.
- ⚠️ Trong lúc test, **không tự bấm quảng cáo thật** trên máy mình. Hãy thêm máy mình làm *test device* trong AdMob.

## 2. Firebase — đo lường
- [ ] Tạo project tại [Firebase Console](https://console.firebase.google.com), bật Google Analytics.
- [ ] Thêm ứng dụng Android, package `vn.phaothumay.game`, tải **`google-services.json`** đặt vào `android/app/`.
- [ ] Liên kết Firebase với AdMob và Google Play để thấy doanh thu quảng cáo và mua hàng trong cùng bảng số liệu.
- [ ] (iOS, làm sau) Tải `GoogleService-Info.plist` đặt vào `ios/App/App/`.
- [ ] Đánh dấu là **conversion** các sự kiện: `tutorial_complete`, `purchase`, `ad_rewarded_done`.

Sự kiện game đã gửi:
`match_start` · `match_end` · `stage_clear` · `stage_fail` · `level_up` · `tutorial_complete` · `pow_used` · `item_used` ·
`unlock_char` · `buy_hat` · `daily_claim` · `wheel_spin` · `iap_click` · `purchase` · `ad_rewarded` · `ad_rewarded_done` ·
`ad_interstitial` · `ad_interstitial_shown` · `rate_prompt_accept`.
Các sự kiện `first_open`, `session_start` và tỷ lệ quay lại do Firebase tự ghi.

## 3. Google Play Console
- [ ] Tài khoản nhà phát triển (phí một lần 25 USD), xác minh danh tính.
- [ ] Tạo ứng dụng `vn.phaothumay.game`. Điền nội dung từ `store/listing.md` và khai báo theo `store/compliance.md`.
- [ ] Tạo sản phẩm trong ứng dụng, **mã phải trùng với `www/config.js`**:
  | Mã | Loại trên Play | Giá gợi ý |
  |---|---|---|
  | `starter_pack` | Sản phẩm một lần (không tiêu hao) | 59.000 ₫ |
  | `remove_ads` | Sản phẩm một lần (không tiêu hao) | 49.000 ₫ |
  | `gems_100` | Sản phẩm một lần (tiêu hao) | 22.000 ₫ |
  | `gems_550` | Sản phẩm một lần (tiêu hao) | 99.000 ₫ |
  | `gems_1200` | Sản phẩm một lần (tiêu hao) | 199.000 ₫ |
- [ ] Thêm email của mình vào **License testing** để mua thử không mất tiền.
- [ ] ⚠️ **Tài khoản cá nhân tạo sau 13/11/2023**: Google bắt buộc chạy **thử nghiệm kín với ít nhất 12 người trong 14 ngày** trước khi được lên Production. Hãy tìm sẵn 12+ người test.
- [ ] Lộ trình phát hành: Internal testing → Closed testing (12 người × 14 ngày) → Production (ra mắt thử ở 1–2 quốc gia trước).

## 4. Ký ứng dụng và build
- [ ] Tạo keystore phát hành và **cất giữ cẩn thận** (mất là không cập nhật app được nữa).
- [ ] Thêm 4 secret vào GitHub repo: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
  Workflow `Android build` sẽ tự tạo file AAB đã ký.
- [ ] Tăng `versionCode` trong `android/app/build.gradle` mỗi lần tải bản mới lên.

## 5. Chính sách và liên kết
- [ ] Thay `[email hỗ trợ của nhà phát triển]` trong `www/privacy.html` bằng email thật.
- [ ] URL chính sách để dán vào Play Console: `https://tnhminh.github.io/phao-thu-may/privacy.html`
- [ ] Khi app đã lên kho: điền `storeUrl` trong `www/config.js`. Bản web sẽ dẫn người chơi về Google Play khi họ bấm mua gói.

## 6. Pháp lý Việt Nam (cần luật sư xác nhận)
- Game hiện **chơi một mình, không có máy chủ chơi online**, nên không thuộc loại G1. Nhưng phát hành game có thu tiền tại Việt Nam vẫn có thể phải **đăng ký cung cấp dịch vụ trò chơi G2/G3/G4 và thông báo phát hành** theo Nghị định 147/2024/NĐ-CP.
- Khi làm chơi online thời gian thực (giai đoạn 2), cần **giấy phép G1 và quyết định phát hành**.

## 7. Kế hoạch ra mắt thử (4–6 tuần)
1. Tuần 1–2: chạy thử nghiệm kín, sửa crash và lỗi. Kiểm tra quảng cáo thật hiện đúng và mua hàng thật hoạt động.
2. Tuần 3–6: Production ở 1–2 thị trường nhỏ, chi một khoản nhỏ để kéo người chơi đo CPI.
3. Mục tiêu tham khảo cho dòng game lai giữa casual và có chiều sâu (thị trường Việt Nam thường thấp hơn):
   | Chỉ số | Cần đạt để đi tiếp | Tốt |
   |---|---|---|
   | Quay lại sau 1 ngày (D1) | ≥ 35% | ≥ 40% |
   | Quay lại sau 7 ngày (D7) | ≥ 12% | ≥ 18% |
   | Quay lại sau 30 ngày (D30) | ≥ 5% | ≥ 8% |
   | Hoàn thành hướng dẫn | ≥ 80% | ≥ 90% |
   | Doanh thu/người chơi/ngày (ARPDAU) | Đo để so với CPI | — |
4. Nếu D7 dưới 10%: **sửa trải nghiệm trước**, chưa chi thêm tiền kéo người chơi.
   Xem `stage_fail` ở màn nào nhiều nhất và `tutorial_complete` có thấp không.

## Giới hạn đã biết của bản này
- **Chưa có lưu đám mây.** Tiến trình nằm trên máy. Android tự sao lưu dữ liệu app (`allowBackup=true`) nên cài lại trên cùng tài khoản Google thường khôi phục được.
  Gói mua vĩnh viễn khôi phục qua nút "Khôi phục giao dịch". Kim cương đã mua thì không khôi phục được nếu mất dữ liệu.
  Giai đoạn sau nên thêm Google Play Games Saved Games hoặc tài khoản đám mây.
- **Chưa có máy chủ xác minh giao dịch.** Hiện dựa vào xác minh của Google Play trên máy; thêm máy chủ khi doanh thu đáng kể.
- **Bản web là bản chơi thử:** không bán hàng bằng tiền thật, không hiện quảng cáo, thưởng "xem quảng cáo" được nhận ngay.
