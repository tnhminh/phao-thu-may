# Pháo Thủ Mây

Game bắn pháo theo lượt 2 đấu 2 (HTML5 Canvas), đóng gói thành app Android/iOS bằng Capacitor.

## Cấu trúc
| Đường dẫn | Nội dung |
|---|---|
| `www/index.html` | Lõi game: vật lý, địa hình phá hủy, AI, đồ họa, âm thanh, nhạc |
| `www/meta.js`, `www/meta.css` | Ngoài trận: sảnh, chiến dịch 30 màn, tiền tệ, cấp độ, nhiệm vụ ngày, quà ngày, vòng quay, cửa hàng, mũ, mời đánh giá |
| `www/platform.js` | Cầu nối native: AdMob, mua hàng (cordova-plugin-purchase), thông báo, rung, nút Back, ATT/UMP |
| `www/config.js` | **Mã quảng cáo, mã sản phẩm, tần suất quảng cáo** — sửa ở đây |
| `www/privacy.html` | Chính sách quyền riêng tư (VI/EN) |
| `android/`, `ios/` | Dự án native do Capacitor tạo |
| `assets/` | Ảnh gốc để sinh biểu tượng/ảnh khởi động (`npm run assets`) |
| `store/` | Nội dung đăng kho, ảnh chụp màn hình, ảnh bìa, khai báo tuân thủ |

## Chạy thử
```bash
npm install
npm run serve            # mở http://localhost:8080 — bản web có quảng cáo/mua hàng mô phỏng
npm run android:debug    # cần Android SDK + JDK 21 → android/app/build/outputs/apk/debug/app-debug.apk
npm run ios:open         # cần macOS + Xcode 16+
```

## Cơ chế giữ chân người chơi (hooks)
- Quà đăng nhập 7 ngày (mất chuỗi khi bỏ 1 ngày) + thông báo nhắc lúc 19:30 hôm sau.
- 3 nhiệm vụ ngày ngẫu nhiên, vòng quay may mắn (1 lượt miễn phí + 3 lượt bằng quảng cáo).
- Chiến dịch 30 màn, 3 sao mỗi màn, màn trùm mỗi chương; cấp độ + XP (lên cấp +10 💎).
- Rương thưởng ngẫu nhiên sau chiến thắng; mở khóa nhân vật bằng vàng/kim cương; 6 mũ trang trí.
- Mời đánh giá 5★ sau lần thắng thứ 3 (In-App Review API).

## Kiếm tiền
- **Quảng cáo có thưởng:** x2 phần thưởng sau trận, kim cương miễn phí (5 lần/ngày), lượt quay thêm.
- **Quảng cáo chuyển cảnh:** sau màn kết quả, mỗi 3 trận, cách nhau ≥150 giây, miễn 3 trận đầu.
- **Mua trong app:** `starter_pack`, `remove_ads`, `gems_100`, `gems_550`, `gems_1200`.
- Tất cả thông số ở `www/config.js`; sự kiện phân tích đi qua `Platform.log()` (gắn Firebase Analytics nếu muốn).

## Các bước phát hành (việc bạn cần làm)
1. **Tài khoản:** Google Play Console (phí 25 USD một lần) · Apple Developer Program (99 USD/năm) · Google AdMob (miễn phí).
2. **AdMob:** tạo 2 ứng dụng (Android, iOS) và 4 đơn vị quảng cáo (chuyển cảnh + có thưởng cho mỗi nền tảng). Thay mã trong `www/config.js`, đặt `testing: false`. Thay mã ứng dụng AdMob trong `android/app/src/main/AndroidManifest.xml` và `ios/App/App/Info.plist` (`GADApplicationIdentifier`). Thêm danh sách SKAdNetwork đầy đủ do AdMob cung cấp vào `Info.plist`. Tạo thông báo GDPR (UMP) trong AdMob → Privacy & messaging.
3. **Khóa ký Android:** `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`, rồi tạo `android/keystore.properties` (đã có trong `.gitignore`) và chạy `npm run android:release` → `android/app/build/outputs/bundle/release/app-release.aab`. Bật Play App Signing. Cất giữ khóa an toàn.
4. **Sản phẩm IAP:** tạo đúng 5 mã trong `store/listing.md` ở Play Console và App Store Connect.
5. **Chính sách quyền riêng tư:** đăng `www/privacy.html` lên một địa chỉ công khai, điền email hỗ trợ thật.
6. **Đăng kho:** dán nội dung `store/listing.md`, tải ảnh trong `store/`, điền theo `store/compliance.md`.
7. **Thử nghiệm:** Google Play yêu cầu tài khoản cá nhân mới chạy *closed testing* với ít nhất 12 người thử trong 14 ngày trước khi phát hành chính thức. Thử mua hàng bằng tài khoản thử (license testers / Sandbox).
8. **iOS:** trên máy Mac: `npm run ios:open`, chọn Team ký, kiểm tra plugin mua hàng (cordova-plugin-purchase) được Capacitor đưa vào dự án, Archive → tải lên App Store Connect.
9. **Mỗi bản cập nhật:** tăng `versionCode`/`versionName` trong `android/app/build.gradle`, `CFBundleShortVersionString`/`CFBundleVersion` trên iOS và `version` trong `www/config.js`.

## Phông chữ & bản quyền
Phông Baloo 2 (SIL Open Font License) đi kèm trong `www/fonts/`. Toàn bộ nhân vật, đồ họa, âm thanh và nhạc được vẽ/tổng hợp bằng mã nguồn của dự án.
