// Kiểm tra trước khi build bản phát hành. Chạy: npm run release:check
// Chặn các lỗi hay gặp khi lên kho: còn mã quảng cáo THỬ, thiếu cấu hình Firebase, chính sách quyền riêng tư còn chữ mẫu...
import { readFileSync, existsSync } from 'node:fs';

const TEST_PUB = '3940256099942544'; // mã nhà xuất bản quảng cáo THỬ của Google
const read = p => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const errors = [], warns = [];
const platform = process.argv[2] || 'android'; // android | ios | all
const want = p => platform === 'all' || platform === p;

// 1) Cấu hình game
const cfg = read('www/config.js') || '';
if (/testing:\s*true/.test(cfg)) errors.push('www/config.js: ads.testing đang là true — đặt false cho bản phát hành.');
if (cfg.includes(TEST_PUB)) errors.push('www/config.js: còn mã quảng cáo THỬ (ca-app-pub-3940256099942544/...) — thay bằng mã đơn vị quảng cáo thật từ AdMob.');
if (/storeUrl:\s*''/.test(cfg)) warns.push("www/config.js: storeUrl đang trống — bản web sẽ không dẫn người chơi về trang ứng dụng.");

// 2) Android
if (want('android')) {
  const man = read('android/app/src/main/AndroidManifest.xml') || '';
  if (man.includes(TEST_PUB)) errors.push('AndroidManifest.xml: APPLICATION_ID AdMob còn là mã THỬ — thay bằng App ID thật (ca-app-pub-xxx~yyy).');
  if (!existsSync('android/app/google-services.json')) errors.push('Thiếu android/app/google-services.json (tải từ Firebase Console) — không có thì Analytics không ghi nhận gì.');
  const gradle = read('android/app/build.gradle') || '';
  const vc = (gradle.match(/versionCode\s+(\d+)/) || [])[1];
  if (vc) warns.push(`android/app/build.gradle: versionCode = ${vc} — nhớ tăng mỗi lần tải bản mới lên Google Play.`);
}

// 3) iOS
if (want('ios')) {
  const plist = read('ios/App/App/Info.plist') || '';
  if (plist.includes(TEST_PUB)) errors.push('Info.plist: GADApplicationIdentifier còn là mã THỬ.');
  if (!existsSync('ios/App/App/GoogleService-Info.plist')) errors.push('Thiếu ios/App/App/GoogleService-Info.plist (tải từ Firebase Console).');
}

// 4) Chính sách quyền riêng tư
const priv = read('www/privacy.html') || '';
if (/\[email|\[developer/i.test(priv)) errors.push('www/privacy.html: còn chữ mẫu [email hỗ trợ...] — điền email hỗ trợ thật.');

for (const w of warns) console.log('⚠️  ' + w);
for (const e of errors) console.log('❌ ' + e);
if (errors.length) { console.log(`\n${errors.length} lỗi — chưa thể phát hành. Xem store/launch-checklist.md`); process.exit(1); }
console.log('\n✅ Sẵn sàng build bản phát hành (' + platform + ').');
