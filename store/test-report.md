# Báo cáo kiểm thử — Pháo Thủ Mây 1.0.0

## Môi trường
- Trình duyệt Chromium (Playwright) — máy tính 1280×720, điện thoại iPhone 13 ngang (cảm ứng).
- Máy ảo Android 11 (API 30, Google APIs, x86_64) **không có tăng tốc phần cứng**, WebView 83.
- Kết nối gỡ lỗi Chrome DevTools vào WebView của app để chạy kịch bản thử bên trong app thật.

## Kết quả
| Hạng mục | Trình duyệt | Android (máy ảo) |
|---|---|---|
| Build APK debug / AAB release đã ký | — | ✅ (`jar verified`) |
| Cài đặt, mở app, khóa màn hình ngang | — | ✅ |
| Ảnh khởi động đúng tỉ lệ, toàn màn hình (ẩn thanh hệ thống) | — | ✅ |
| Màn chào → sảnh → quà ngày | ✅ | ✅ |
| Phông tiếng Việt đi kèm, chơi không cần mạng | ✅ | ✅ |
| Trận đấu đầy đủ, AI, siêu đạn, kết quả | ✅ | — (máy ảo quá chậm để chơi) |
| Chiến dịch: thắng màn 1 → 3★, mở màn 2 | ✅ | — |
| Nhiệm vụ ghi nhận sát thương / hạ gục / vượt màn | ✅ | — |
| x2 phần thưởng bằng quảng cáo (mô phỏng) | ✅ | — |
| Quảng cáo chuyển cảnh: không hiện trong 3 trận đầu, hiện khi đủ điều kiện | ✅ | — |
| Mua kim cương (mô phỏng), mở khóa nhân vật bằng vàng | ✅ | — |
| Lưu tiến trình sau khi tải lại | ✅ | — |
| 8 plugin native nạp đúng (AdMob, App, Haptics, LocalNotifications, ScreenOrientation, SplashScreen, StatusBar, InAppReview) + CdvPurchase | — | ✅ |
| AdMob dựng yêu cầu quảng cáo ở chế độ thử ("sent from a test device") | — | ✅ |
| AdMob tải được quảng cáo thử | — | ❌ Hết thời gian chờ Google Play services trên máy ảo không tăng tốc (lỗi môi trường); app không sập, game vẫn chạy |
| Google Play Billing | — | ⚠️ Không kiểm được: ảnh hệ thống không có Play Store, và sản phẩm chưa được tạo trên Play Console |

## Cần kiểm trên điện thoại thật trước khi phát hành
1. Quảng cáo thử (chuyển cảnh + có thưởng) hiển thị và trả thưởng.
2. Hộp thoại đồng ý UMP (dùng thiết bị/VPN ở EU hoặc chế độ debug geography).
3. Mua hàng bằng tài khoản *license tester* trong track thử nghiệm của Play Console; khôi phục giao dịch.
4. Thông báo nhắc quà ngày (Android 13+ sẽ hỏi quyền).
5. Nút Back: đóng hộp thoại → tạm dừng → về sảnh → hỏi thoát.
