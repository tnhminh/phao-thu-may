# Khai báo tuân thủ cho kho ứng dụng

## Google Play — An toàn dữ liệu (Data safety)
Dựa trên mã nguồn hiện tại (lưu tiến trình trên máy, AdMob, Google Analytics for Firebase, Google Play Billing, thông báo cục bộ):

| Câu hỏi | Trả lời |
|---|---|
| Ứng dụng có thu thập hoặc chia sẻ dữ liệu người dùng? | **Có** (do SDK AdMob và Firebase Analytics) |
| Mã nhận dạng thiết bị hoặc mã khác (Advertising ID) | Thu thập + chia sẻ · Mục đích: Quảng cáo/Tiếp thị, Phân tích, Chống gian lận · Không bắt buộc ở nơi cần đồng ý |
| Mã nhận dạng khác: App instance ID (Firebase) | Thu thập · Phân tích |
| Tương tác với ứng dụng (sự kiện chơi game của Firebase, tương tác quảng cáo) | Thu thập · Phân tích, Quảng cáo |
| Chẩn đoán (nhật ký sự cố của SDK quảng cáo) | Thu thập · Phân tích |
| Vị trí gần đúng (suy ra từ IP bởi AdMob) | Thu thập · Quảng cáo |
| Thông tin thanh toán | **Không** — do Google Play xử lý |
| Dữ liệu được mã hóa khi truyền | Có |
| Người dùng có thể yêu cầu xóa dữ liệu | Dữ liệu game nằm trên máy, gỡ app là xóa; dữ liệu quảng cáo theo chính sách Google |

Tham khảo hướng dẫn chính thức của AdMob về Data safety để đối chiếu phiên bản SDK bạn dùng.

## Google Play — Nội dung ứng dụng khác
- **Quảng cáo:** Có chứa quảng cáo.
- **Đối tượng mục tiêu:** 13–15, 16–17, 18+ (không chọn dưới 13 để tránh chương trình Gia đình).
- **Bảng câu hỏi phân loại nội dung (IARC):** bạo lực hoạt hình (nhân vật hoạt hình bắn nhau, không máu, không chết chi tiết) → thường ra **PEGI 7 / ESRB Everyone 10+ / IARC 7+**. Có mua hàng trong ứng dụng; không có tương tác người dùng trực tuyến, không chia sẻ vị trí, không cờ bạc tiền thật (vòng quay chỉ cho vật phẩm trong game, không bán lượt quay bằng tiền thật).
- **Quyền truy cập ứng dụng:** Không cần đăng nhập.
- **Chính sách quyền riêng tư:** đăng `www/privacy.html` lên một địa chỉ công khai (GitHub Pages, Netlify…) và dán URL vào Play Console. Thay `[email hỗ trợ của nhà phát triển]` bằng email thật.
- **Quyền nhạy cảm:** đã gỡ `SCHEDULE_EXACT_ALARM`. Quyền `AD_ID` phục vụ quảng cáo — khai báo trong mục Advertising ID.

## Apple App Store — Nhãn quyền riêng tư (App Privacy)
- **Dữ liệu dùng để theo dõi bạn:** Mã nhận dạng (Device ID) — chỉ khi người dùng đồng ý ATT.
- **Dữ liệu liên kết/không liên kết với bạn:** Dữ liệu sử dụng (tương tác sản phẩm qua Firebase Analytics, tương tác quảng cáo), Mã nhận dạng (App instance ID), Chẩn đoán, Vị trí gần đúng — mục đích Quảng cáo bên thứ ba, Phân tích.
- **Mua hàng:** Apple xử lý, không thu thập.
- **Phân loại tuổi:** Bạo lực hoạt hình/giả tưởng ở mức Không thường xuyên/Nhẹ → thường **9+**.
- **Mã hóa xuất khẩu:** đã đặt `ITSAppUsesNonExemptEncryption = false`.
- **App Tracking Transparency:** có câu giải thích `NSUserTrackingUsageDescription`; game gọi hộp thoại ATT trước khi tải quảng cáo.

## Các điểm đã tuân thủ chính sách quảng cáo
- Quảng cáo có thưởng luôn do người chơi chủ động bấm, ghi rõ phần thưởng trước khi xem.
- Quảng cáo chuyển cảnh chỉ hiện ở điểm chuyển màn (sau màn kết quả), không hiện khi đang chơi, không hiện trong 3 trận đầu, tối đa 1 lần mỗi 3 trận và cách nhau ít nhất 150 giây.
- Có hộp thoại đồng ý (UMP) cho EU/EEA/UK trước khi tải quảng cáo.
- Mua "Xóa quảng cáo" tắt toàn bộ quảng cáo chuyển cảnh; có nút Khôi phục giao dịch.
