/**
 * LIKEFOOD — Seed 10 SEO Blog Posts
 * Run: npx tsx scripts/seed-blogs.ts
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const blogPosts = [
  {
    title: "Top 10 Đặc Sản Việt Nam Được Yêu Thích Nhất Tại Mỹ 2026",
    summary: "Khám phá top 10 đặc sản Việt Nam bán chạy nhất tại Mỹ: cá khô miền Tây, tôm khô Cà Mau, mực khô nguyên con, nước mắm Phú Quốc. Mua online tại LIKEFOOD — giao 2-3 ngày toàn nước Mỹ.",
    category: "Đặc sản",
    content: `# Top 10 Đặc Sản Việt Nam Được Yêu Thích Nhất Tại Mỹ 2026

Nếu bạn là người Việt xa quê hoặc yêu thích ẩm thực Việt Nam, chắc hẳn bạn sẽ nhớ nhung hương vị đặc sản quê hương. **LIKEFOOD** (Like Food) mang đến cho bạn tuyển tập **top 10 đặc sản Việt Nam** được Việt kiều yêu thích nhất!

## 1. 🐟 Cá Khô Miền Tây
Cá khô miền Tây là đặc sản nổi tiếng nhất, với hương vị đậm đà, thơm lừng. Các loại phổ biến:
- **Khô cá lóc** — thịt dai, ngọt tự nhiên, phù hợp nướng than hoặc chiên giòn
- **Khô cá sặc bổi** — vị bùi béo, ướp gia vị truyền thống Cà Mau
- **Khô cá dứa** — thịt mềm, nhiều Omega-3, tốt cho sức khỏe
- **Khô cá thiểu** — nhỏ gọn, giòn rụm, ăn vặt tuyệt vời

💡 **Mẹo chế biến:** Nướng cá khô trên than hoa, xé nhỏ chấm nước mắm me chua ngọt — đúng chất miền Tây!

## 2. 🦐 Tôm Khô Cà Mau
Tôm khô Cà Mau nổi tiếng ngọt tự nhiên, không hóa chất. Phân loại:
- **Tôm khô loại 1** — con to, đỏ đẹp, thích hợp nấu canh hoặc ăn trực tiếp
- **Tôm khô nguyên con** — giữ nguyên hương vị biển

🍲 **Gợi ý:** Tôm khô nấu cháo, làm nhân bánh tráng cuốn, hoặc xào rau muống.

## 3. 🦑 Mực Khô Nguyên Con
Mực khô Việt Nam — loại nguyên con, thịt dày, ngọt tự nhiên. Nướng mực khô chấm tương ớt là món ăn vặt kinh điển!

## 4. 🥫 Nước Mắm Phú Quốc
Nước mắm Phú Quốc chính gốc — hương vị đậm đà, không chất bảo quản. Đây là "linh hồn" của ẩm thực Việt.

## 5. 🥩 Khô Bò Miếng
Khô bò Việt Nam — ướp gia vị đặc trưng, dai giòn, cay nhẹ. Ăn vặt hoặc nhậu đều tuyệt!

## 6. 🥭 Trái Cây Sấy (Xoài, Mít, Chuối)
Trái cây sấy dẻo — giữ nguyên hương vị tự nhiên, không đường hóa học. Xoài sấy, mít sấy, chuối sấy — snack healthy!

## 7. 🌿 Gia Vị Việt (Sa Tế, Tương Ớt, Muối Tôm)
Bộ gia vị Việt Nam — sa tế, tương ớt Sriracha, muối tôm Tây Ninh, bột nêm. Nấu phở, bún bò, hủ tiếu ngay tại nhà!

## 8. 🍚 Bánh Tráng & Bánh Phồng Tôm
Bánh tráng truyền thống — dùng cuốn gỏi cuốn, nem nướng. Bánh phồng tôm chiên giòn — ăn kèm cơm hoặc mì.

## 9. 🍵 Trà Việt Nam (Trà Ổi, Trà Atiso)
Trà thảo mộc Việt Nam — trà ổi giảm cân, trà atiso mát gan. 100% tự nhiên.

## 10. 🍬 Kẹo Dừa Bến Tre
Kẹo dừa Bến Tre — dẻo thơm, vị béo ngọt tự nhiên. Quà biếu Tết ý nghĩa!

---

## Mua Ở Đâu?

Tất cả đặc sản trên đều có tại **LIKEFOOD** (Like Food) — cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ.

🚚 **Giao hàng 2-3 ngày toàn nước Mỹ** | 🆓 **FREE ship đơn từ $99** | ⭐ **100% hàng chính gốc**

👉 [Mua ngay tại LIKEFOOD](https://likefood.app/products)`,
  },
  {
    title: "Cách Chế Biến Cá Khô Miền Tây Ngon Nhất — 5 Món Đơn Giản",
    summary: "Hướng dẫn 5 cách chế biến cá khô miền Tây cực ngon: nướng than, chiên giòn, kho tộ, xào sả ớt, nấu canh chua. Mua cá khô chính gốc tại LIKEFOOD.",
    category: "Công thức",
    content: `# Cách Chế Biến Cá Khô Miền Tây Ngon Nhất — 5 Món Đơn Giản

Cá khô miền Tây là đặc sản quý giá của vùng sông nước Cà Mau, Bạc Liêu, Kiên Giang. Tại **LIKEFOOD** (Like Food), chúng tôi nhập cá khô chính gốc từ miền Tây — đảm bảo chất lượng và hương vị truyền thống.

## 1. 🔥 Cá Khô Nướng Than Hoa

**Nguyên liệu:** Cá khô lóc 200g, nước mắm me, ớt, tỏi
**Cách làm:**
1. Rửa cá khô, ngâm nước ấm 10 phút cho mềm
2. Nướng trên than hoa — xoay đều cả 2 mặt đến khi vàng giòn
3. Xé cá thành sợi, chấm nước mắm me chua ngọt

⭐ **Bí quyết:** Nướng lửa nhỏ để cá chín đều, không cháy!

## 2. 🍳 Cá Khô Chiên Giòn

**Nguyên liệu:** Cá khô sặc bổi 150g, dầu ăn, tỏi băm
**Cách làm:**
1. Ngâm cá khô 5 phút, vớt ra lau khô
2. Chiên trong dầu nóng đến khi vàng giòn
3. Rắc tỏi phi vàng lên trên

💡 **Mẹo:** Chiên ở lửa vừa giúp cá giòn đều, không bị khét!

## 3. 🍲 Cá Khô Kho Tộ

Cá khô kho tộ — đậm đà, ăn với cơm trắng cực ngon. Ướp cá với nước mắm, đường, tiêu, tỏi. Kho nhỏ lửa 20 phút.

## 4. 🌶️ Cá Khô Xào Sả Ớt

Xào cá khô với sả, ớt, hành — món nhậu tuyệt vời! Vị cay nồng, thơm lừng.

## 5. 🥣 Canh Chua Cá Khô Miền Tây

Nấu canh chua bằng me, cá khô, rau thơm — hương vị truyền thống miền Tây!

---

## Mua Cá Khô Chính Gốc Ở Đâu?

**LIKEFOOD** (Like Food) — ship cá khô miền Tây chính gốc toàn nước Mỹ trong 2-3 ngày!

👉 [Xem danh mục cá khô](https://likefood.app/products)`,
  },
  {
    title: "Tôm Khô Cà Mau — Cách Phân Biệt Hàng Thật Giả và Mẹo Bảo Quản",
    summary: "Hướng dẫn phân biệt tôm khô Cà Mau chính gốc vs hàng giả. Mẹo bảo quản tôm khô đúng cách để giữ nguyên hương vị. Mua hàng chính hãng tại LIKEFOOD.",
    category: "Kiến thức",
    content: `# Tôm Khô Cà Mau — Cách Phân Biệt Hàng Thật Giả và Mẹo Bảo Quản

Tôm khô Cà Mau là đặc sản nổi tiếng nhất miền Tây, nhưng trên thị trường có rất nhiều hàng giả, hàng kém chất lượng. **LIKEFOOD** (Like Food) hướng dẫn bạn cách phân biệt!

## Cách Phân Biệt Tôm Khô Thật vs Giả

| Tiêu chí | Tôm khô THẬT | Tôm khô GIẢ |
|----------|-------------|-------------|
| Màu sắc | Đỏ cam tự nhiên | Đỏ sặc sỡ (dùng phẩm màu) |
| Mùi | Thơm ngọt biển | Tanh, hôi, mùi hóa chất |
| Kết cấu | Khô ráo, không dính | Ẩm, dính tay |
| Vị | Ngọt tự nhiên | Mặn chát, vị lạ |
| Kích thước | Đồng đều | Không đều |

## Mẹo Bảo Quản Tôm Khô

1. **Ở nhiệt độ phòng:** Cho vào hũ kín, nơi khô ráo — bảo quản 3-6 tháng
2. **Trong tủ lạnh:** Bọc kín bằng túi zip — bảo quản 6-12 tháng
3. **Trong tủ đông:** Đông lạnh — bảo quản 12-18 tháng

⚠️ **Lưu ý:** KHÔNG để tôm khô tiếp xúc ẩm — sẽ bị mốc!

## Mua Tôm Khô Chính Gốc

Tại **LIKEFOOD**, tất cả tôm khô đều nhập trực tiếp từ Cà Mau, 100% nguyên con, không hóa chất.

👉 [Xem tôm khô Cà Mau](https://likefood.app/products)`,
  },
  {
    title: "Nước Mắm Phú Quốc Chính Gốc — Tại Sao Đặc Biệt Đến Vậy?",
    summary: "Tìm hiểu lý do nước mắm Phú Quốc được UNESCO công nhận, quy trình sản xuất truyền thống, cách phân biệt nước mắm thật giả. Mua nước mắm Phú Quốc tại LIKEFOOD.",
    category: "Kiến thức",
    content: `# Nước Mắm Phú Quốc — Tại Sao Đặc Biệt Đến Vậy?

Nước mắm Phú Quốc là "linh hồn" ẩm thực Việt Nam — được **UNESCO** xếp vào danh sách Di sản Văn hóa Phi vật thể. Tại **LIKEFOOD** (Like Food), chúng tôi tự hào mang nước mắm chính gốc Phú Quốc đến tay Việt kiều tại Mỹ!

## Tại Sao Nước Mắm Phú Quốc Đặc Biệt?

1. **Nguyên liệu:** Cá cơm tươi Phú Quốc — giàu đạm, ngọt tự nhiên
2. **Ủ chượp 12-24 tháng** — thời gian dài giúp nước mắm chín tự nhiên
3. **Độ đạm 30-43°N** — cao nhất thế giới, hương vị đậm đà
4. **Không hóa chất** — 100% tự nhiên, không chất bảo quản

## So Sánh: Nước Mắm Phú Quốc vs Nước Mắm Thường

| Tiêu chí | Phú Quốc | Nước mắm thường |
|----------|----------|----------------|
| Độ đạm | 30-43°N | 10-20°N |
| Thời gian ủ | 12-24 tháng | 3-6 tháng |
| Nguyên liệu | Cá cơm tươi | Ce cơm + phụ gia |
| Hương vị | Thơm dịu, ngọt hậu | Mặn, tanh |
| Giá | Cao hơn | Rẻ hơn |

## Cách Dùng Nước Mắm Phú Quốc

- **Pha nước chấm:** 1 phần mắm + 1 phần đường + 2 phần nước + tỏi ớt
- **Nêm nếm:** Thay muối khi nấu phở, bún, canh
- **Kho thịt, cá:** Cho hương vị đậm đà, caramel

👉 [Mua nước mắm Phú Quốc chính gốc](https://likefood.app/products)`,
  },
  {
    title: "Quà Biếu Đặc Sản Việt Nam Tại Mỹ — 8 Set Quà Ý Nghĩa Cho Mọi Dịp",
    summary: "Gợi ý 8 set quà biếu đặc sản Việt Nam ý nghĩa: Tết, sinh nhật, thăm bệnh, tân gia. Giỏ quà từ $29.99. Ship toàn nước Mỹ. Đặt hàng tại LIKEFOOD.",
    category: "Gợi ý",
    content: `# Quà Biếu Đặc Sản Việt Nam Tại Mỹ — 8 Set Quà Ý Nghĩa

Bạn đang tìm quà biếu mang đậm hương vị Việt Nam? **LIKEFOOD** (Like Food) gợi ý 8 set quà đặc sản ý nghĩa cho mọi dịp!

## 1. 🎁 Set Quà Tết Truyền Thống ($49.99)
Gồm: Mứt Tết, kẹo dừa, hạt điều, trà sen — đầy đủ hương vị Tết quê hương!

## 2. 🎁 Set Hải Sản Khô Premium ($79.99)
Gồm: Tôm khô Cà Mau + mực khô nguyên con + cá khô lóc — bộ 3 đặc sản biển!

## 3. 🎁 Set Gia Vị Việt Nam ($34.99)
Gồm: Nước mắm Phú Quốc + sa tế + tương ớt + muối tôm — đủ gia vị nấu ăn Việt!

## 4-8. Và nhiều set quà khác...

👉 [Xem tất cả giỏ quà](https://likefood.app/products)`,
  },
  {
    title: "Vietnamese Food Near Me — Mua Đặc Sản Việt Nam Online Tại Mỹ",
    summary: "Looking for Vietnamese food near me? LIKEFOOD (Like Food) delivers authentic Vietnamese specialty food across the USA. Dried fish, shrimp, spices. Free ship $99+.",
    category: "Guide",
    content: `# Vietnamese Food Near Me — Buy Authentic Vietnamese Food Online in the USA

Are you searching for **Vietnamese food near me**? Whether you're a Vietnamese expat missing the flavors of home, or someone who loves exploring Asian cuisine, **LIKEFOOD** (Like Food) is your go-to online Vietnamese food store!

## Why Choose LIKEFOOD (Like Food)?

✅ **100+ Authentic Products** — directly imported from Vietnam
✅ **Fast Delivery** — 2-3 business days across the USA
✅ **Free Shipping** — orders $99+ (Standard), $199+ (Express)
✅ **FDA Quality** — all products meet US food safety standards
✅ **24/7 Customer Support** — Vietnamese & English speaking staff

## What We Offer

### 🐟 Dried Fish (Cá Khô)
Vietnamese dried fish from the Mekong Delta — perfect for grilling, frying, or adding to soups.

### 🦐 Dried Shrimp (Tôm Khô)
Ca Mau dried shrimp — naturally sweet, no chemicals. Great for congee, fried rice, or snacking.

### 🦑 Dried Squid (Mực Khô)
Whole dried squid — thick, sweet, perfect for grilling with chili sauce.

### 🥫 Fish Sauce (Nước Mắm)
Authentic Phu Quoc fish sauce — 30-43°N protein, UNESCO-recognized.

### 🌿 Spices & Seasonings
Vietnamese spices: chili paste, lemongrass, shrimp paste, pho seasoning.

## Order Now

👉 Visit [LIKEFOOD](https://likefood.app) — **Like Food**, Vietnamese food you love!`,
  },
  {
    title: "Like Food — Câu Chuyện Thương Hiệu LIKEFOOD Và Hành Trình Từ Việt Nam Đến Mỹ",
    summary: "LIKEFOOD (Like Food) — câu chuyện thương hiệu đặc sản Việt Nam tại Mỹ. Từ ước mơ mang hương vị quê hương đến tay Việt kiều, Like Food ra đời.",
    category: "Về chúng tôi",
    content: `# Like Food — Câu Chuyện LIKEFOOD Và Hành Trình Từ Việt Nam Đến Mỹ

**LIKEFOOD** (Like Food) không chỉ là một cửa hàng online — đó là hành trình mang **hương vị quê hương** đến tay người Việt xa xứ.

## Tại Sao Chúng Tôi Gọi Là "Like Food"?

"Like Food" — hay **LIKEFOOD** — bắt nguồn từ tình yêu dành cho ẩm thực Việt Nam. Chúng tôi tin rằng: **khi bạn yêu thức ăn, bạn yêu quê hương!**

## Sứ Mệnh Của LIKEFOOD

🎯 Mang đặc sản Việt Nam **chính gốc** đến mọi gia đình Việt kiều tại Mỹ
🎯 Giữ gìn **hương vị truyền thống** qua từng sản phẩm
🎯 Giao hàng **nhanh chóng, an toàn** — đóng gói cẩn thận giữ nguyên chất lượng

## Con Số Ấn Tượng

- 📦 **100+ sản phẩm** đặc sản chính gốc
- 🚚 **Giao 2-3 ngày** toàn nước Mỹ
- ⭐ **100% hàng thật** — nhập trực tiếp từ các vùng miền Việt Nam
- 🆓 **FREE ship** đơn từ $99

## Liên Hệ
- 📍 Omaha, NE 68136, USA
- 📞 402-315-8105
- 🌐 [likefood.app](https://likefood.app)`,
  },
  {
    title: "Hướng Dẫn Mua Đồ Việt Nam Online Ở Mỹ — Đầy Đủ Và Chi Tiết Nhất",
    summary: "Hướng dẫn chi tiết cách mua đặc sản Việt Nam online tại Mỹ: chọn cửa hàng uy tín, kiểm tra chất lượng, so sánh giá. LIKEFOOD — mua sắm dễ dàng, giao nhanh.",
    category: "Hướng dẫn",
    content: `# Hướng Dẫn Mua Đồ Việt Nam Online Ở Mỹ

Bạn sống tại Mỹ và muốn mua đặc sản Việt Nam nhưng không biết bắt đầu từ đâu? **LIKEFOOD** (Like Food) hướng dẫn bạn từ A-Z!

## Bước 1: Chọn Cửa Hàng Uy Tín

✅ Có website rõ ràng, thông tin liên hệ đầy đủ
✅ Hình ảnh sản phẩm thật, có mô tả chi tiết
✅ Review từ khách hàng thật
✅ Chính sách đổi trả minh bạch

**LIKEFOOD** đáp ứng tất cả tiêu chí trên!

## Bước 2: Chọn Sản Phẩm

Tại LIKEFOOD, bạn có thể tìm: cá khô, tôm khô, mực khô, nước mắm, gia vị, trái cây sấy, bánh kẹo, trà.

## Bước 3: Đặt Hàng

1. Vào [likefood.app](https://likefood.app)
2. Chọn sản phẩm → Thêm vào giỏ
3. Thanh toán bằng Visa/MC/PayPal/Apple Pay
4. Nhận hàng 2-3 ngày!

## Bước 4: Thưởng Thức!

👉 [Mua ngay tại LIKEFOOD](https://likefood.app)`,
  },
  {
    title: "So Sánh Các Loại Cá Khô Miền Tây — Loại Nào Ngon Nhất?",
    summary: "So sánh chi tiết 6 loại cá khô miền Tây phổ biến: cá lóc, cá sặc bổi, cá dứa, cá kèo, cá chạch, cá thiểu. Bảng so sánh hương vị, giá, cách chế biến.",
    category: "So sánh",
    content: `# So Sánh Các Loại Cá Khô Miền Tây — Loại Nào Ngon Nhất?

Miền Tây nổi tiếng với rất nhiều loại cá khô. Mỗi loại có hương vị, cách chế biến riêng. **LIKEFOOD** (Like Food) giúp bạn so sánh 6 loại phổ biến nhất!

## Bảng So Sánh

| Loại | Hương Vị | Kết Cấu | Nấu Gì Ngon? | Giá |
|------|----------|---------|-------------|-----|
| Khô cá lóc | Ngọt, đậm | Dai, thịt dày | Nướng, kho tộ | $$$ |
| Khô cá sặc bổi | Bùi, béo | Giòn, nhỏ | Chiên, ăn vặt | $$ |
| Khô cá dứa | Mềm, ngọt | Mềm, mịn | Nướng, gỏi | $$$$ |
| Khô cá kèo | Mặn nhẹ | Giòn | Chiên giòn | $$ |
| Khô cá chạch | Béo, thơm | Nhỏ, giòn | Kho tiêu | $ |
| Khô cá thiểu | Ngọt nhẹ | Giòn rụm | Ăn vặt | $ |

## Kết Luận
- **Ngon nhất để nướng:** Khô cá lóc
- **Ngon nhất ăn vặt:** Khô cá sặc bổi
- **Premium nhất:** Khô cá dứa
- **Tiết kiệm nhất:** Khô cá chạch, cá thiểu

👉 [Mua cá khô miền Tây chính gốc](https://likefood.app/products)`,
  },
  {
    title: "5 Combo Đặc Sản Việt Nam Tiết Kiệm Nhất — FREE Ship Toàn Mỹ",
    summary: "5 combo đặc sản Việt Nam siêu tiết kiệm: hải sản khô, gia vị, trái cây sấy, quà biếu. Mua combo FREE ship toàn nước Mỹ. Đặt hàng trên LIKEFOOD.",
    category: "Khuyến mãi",
    content: `# 5 Combo Đặc Sản Việt Nam Tiết Kiệm Nhất — FREE Ship Toàn Mỹ

Mua combo tại **LIKEFOOD** (Like Food) — tiết kiệm hơn + FREE ship! Dưới đây là 5 combo best-seller:

## Combo 1: 🐟 Hải Sản Khô Premium
- Tôm khô Cà Mau 200g
- Cá khô lóc 300g
- Mực khô nguyên con 200g
- 🆓 **FREE ship Standard**

## Combo 2: 🌿 Gia Vị Việt Đầy Đủ
- Nước mắm Phú Quốc
- Sa tế, tương ớt, muối tôm
- Bột nêm, hạt nêm

## Combo 3: 🍬 Snack Việt Nam
- Xoài sấy + mít sấy + chuối sấy
- Kẹo dừa Bến Tre
- Hạt điều rang bơ

## Combo 4: 🎁 Quà Biếu Cao Cấp
- Tôm khô loại 1 + mực khô premium
- Nước mắm Phú Quốc + hộp quà sang trọng

## Combo 5: 🍜 Nấu Ăn Việt Tại Nhà
- Phở bò + bún bò gia vị đầy đủ
- Nước mắm + tương ớt + rau thơm sấy

👉 [Đặt combo ngay](https://likefood.app/products) — Tiết kiệm đến 30%!`,
  },
];

async function seedBlogs() {
  console.log("🚀 Seeding 10 SEO blog posts...\n");

  for (const post of blogPosts) {
    const slug = generateSlug(post.title);

    try {
      // Check if slug exists
      const existing = await prisma.post.findFirst({ where: { slug } });
      if (existing) {
        console.log(`⏭️  Skipped (exists): ${post.title.slice(0, 50)}...`);
        continue;
      }

      await prisma.post.create({
        data: {
          title: post.title,
          slug,
          summary: post.summary,
          content: post.content,
          image: null,
          authorName: "LIKEFOOD",
          category: post.category,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      console.log(`✅ Created: ${post.title.slice(0, 60)}...`);
    } catch (err) {
      console.error(`❌ Error: ${post.title.slice(0, 40)}... — ${(err as Error).message}`);
    }
  }

  const total = await prisma.post.count({ where: { isPublished: true } });
  console.log(`\n📊 Total published posts: ${total}`);
  await prisma.$disconnect();
}

seedBlogs();
