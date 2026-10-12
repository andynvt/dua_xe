# Asset Đua Xe Ôm

Tạo ngày 12/10/2026 bằng GPT ImageGen có sẵn trong Codex, theo bộ asset đã chốt qua sprite-gen.
Ảnh gốc được giữ trong thư mục generated_images của Codex. PNG dùng trong game đã cắt phần alpha trống, thu nhỏ giữ tỷ lệ và đặt trên canvas trong suốt.

| File | Kích thước | Dùng ở |
| --- | --- | --- |
| scooter.png | 256 × 192 | Xe đua nhìn ngang, quay sang phải; icon tiêu đề và nút TAP |
| pothole.png | 128 × 64 | Ổ gà trên đường đua |
| impact.png | 128 × 128 | Hiệu ứng trúng ổ gà |
| scooter-hurt.png | 1024 × 192 | Atlas 4 frame đụng ổ gà, mỗi frame 256 × 192 |

Ba PNG đầu là ảnh tĩnh. Animation `hurt_right` chạy 4 frame × 200 ms, không lặp, khớp 800 ms choáng. Khi atlas chưa nạp được, game dùng xe tĩnh; Canvas màn hình lớn còn có emoji dự phòng.
`hurt-animation.js` dùng tọa độ frame và thời gian từ manifest của sprite-gen, đồng hồ riêng cho từng xe, reset khi hết choáng. Server chỉ phục vụ asset trong danh sách cho phép; tài liệu này không được public.

Nguồn, prompt và báo cáo animation nằm trong [generated/sprites/scooter-hurt](generated/sprites/scooter-hurt). Xem [GIF preview](generated/sprites/scooter-hurt/exports/hurt_right.gif), [manifest](generated/sprites/scooter-hurt/manifest.json), [motion QA](generated/sprites/scooter-hurt/qa-notes.md).

## Prompt xe ôm

Create ONE production-ready transparent PNG game asset for a Vietnamese party racing game called Dua Xe Om. Asset: a friendly adult Vietnamese motorcycle taxi rider on a compact orange step-through scooter, wearing a plain teal shirt, dark trousers and a properly fastened bright orange helmet. Strict 2D SIDE PROFILE facing RIGHT: the front wheel, handlebars and rider's nose point toward the RIGHT edge. Both wheels fully visible on one horizontal ground line. The rider is seated with both hands naturally on the handlebars, feet appropriately placed, an upbeat focused expression. Whole scooter and rider visible, centered with generous transparent margin, no cropping. Clean playful 2D cartoon game art, bold dark outlines, simple flat colors with minimal cel shading, compact readable silhouette. Large solid color regions so it remains legible at only 56 pixels high. Orange body with cream accents, teal clothing, black tires. No text, logos, license plate lettering, scenery, road, speed lines, shadows, duplicate poses or extra figures. Actual transparent background with real alpha, not a drawn checkerboard. Landscape composition, roughly 4:3 aspect ratio. One still only, not a sprite sheet.

## Prompt ổ gà

Create ONE production-ready transparent PNG game asset for a Vietnamese 2D side-scrolling scooter racing game. Asset: a single shallow wide oval POTHOLE, seen at a slight downward angle so its dark interior is immediately readable. Irregular chunky broken asphalt rim in warm gray with a few large light tan chips connected to the rim, dark nearly black oval center, simple thick dark outline and a light edge that contrasts clearly against a dark gray road. Overall silhouette approximately twice as wide as tall. Centered, entirely visible with transparent margin. Clean playful 2D cartoon game art, bold outlines, simple flat colors with minimal cel shading, extremely readable at small scale. No scooter, riders, water, grass, surrounding road patch, cast shadow, floating debris, text, logos, multiple holes or panels. Real transparent background with actual alpha, not a checkerboard drawing. One isolated still object only.

## Prompt va chạm

Create ONE production-ready transparent PNG game effect for a playful Vietnamese 2D scooter racing game. Asset: a compact cartoon IMPACT BURST, a single bold irregular starburst with chunky orange outer spikes, bright warm yellow inside and a small cream white center. Expresses a harmless bump after hitting a pothole, energetic and funny. Connected compact silhouette, thick warm dark outline, flat colors with minimal cel shading, clean game icon that is unmistakable at only 32 pixels high. Centered, roughly square, entirely visible with generous transparent margin. No fire, smoke cloud, weapon, injury, text, punctuation, letters, multiple panels, background, cast shadow or separate floating sparks. Actual transparent background with real alpha, not a drawn checkerboard. One still effect only.
