/**
 * LIKEFOOD - SEO Blog Posts Seed Script
 * Tạo 5 bài viết SEO-focused về LIKEFOOD và đặc sản Việt Nam
 * 
 * Chạy: npx ts-node scripts/seed-seo-posts.ts
 * Hoặc: npx tsx scripts/seed-seo-posts.ts
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

const SEO_POSTS = [
  {
    title: "LIKEFOOD là gì? Nền tảng đặc sản Việt Nam hàng đầu tại Mỹ",
    titleEn: "What is LIKEFOOD? The Leading Vietnamese Specialty Platform in the USA",
    slug: "likefood-la-gi",
    summary: "Tìm hiểu LIKEFOOD - nền tảng thương mại điện tử chuyên cung cấp đặc sản Việt Nam chính gốc tại Hoa Kỳ. Câu chuyện thương hiệu, sứ mệnh và cam kết chất lượng.",
    summaryEn: "Discover LIKEFOOD - the e-commerce platform specializing in authentic Vietnamese specialty food in the United States. Brand story, mission, and quality commitment.",
    category: "Giới thiệu",
    categoryEn: "About",
    content: `<h2>LIKEFOOD là gì?</h2>
<p><strong>LIKEFOOD</strong> là nền tảng thương mại điện tử chuyên cung cấp <strong>đặc sản Việt Nam chính gốc</strong> tại thị trường Hoa Kỳ. Ra đời từ nỗi nhớ hương vị quê hương của cộng đồng người Việt xa xứ, LIKEFOOD mang đến hơn 100 sản phẩm đặc sản được tuyển chọn kỹ lưỡng từ các vùng miền Việt Nam.</p>

<h2>Sứ mệnh của LIKEFOOD</h2>
<p>LIKEFOOD ra đời với sứ mệnh <strong>kết nối hương vị Việt Nam với cộng đồng người Việt tại Mỹ</strong>. Chúng tôi tin rằng mỗi món đặc sản không chỉ là thực phẩm, mà còn là sợi dây kết nối với cội nguồn, gia đình và quê hương.</p>

<h3>Tại sao LIKEFOOD khác biệt?</h3>
<ul>
<li><strong>Nguyên liệu tự nhiên:</strong> Sản phẩm được tuyển chọn từ nguyên liệu tự nhiên, qua sàng lọc kỹ lưỡng từ đội ngũ tại Việt Nam.</li>
<li><strong>An toàn thực phẩm:</strong> Quy trình kiểm định chất lượng nghiêm ngặt, đóng gói theo tiêu chuẩn phù hợp thị trường Hoa Kỳ.</li>
<li><strong>Giao hàng toàn Mỹ:</strong> Giao nhanh đến 50 bang, đóng gói cẩn thận để giữ trọn chất lượng và hương vị sản phẩm.</li>
<li><strong>Thương hiệu riêng:</strong> LIKEFOOD là thương hiệu riêng với cam kết hương vị Việt, đóng gói chuẩn, nâng tầm giá trị.</li>
</ul>

<h2>Sản phẩm LIKEFOOD có gì?</h2>
<p>LIKEFOOD cung cấp đa dạng các nhóm sản phẩm đặc sản Việt Nam:</p>

<h3>🐟 Cá khô miền Tây</h3>
<p>Cá lóc khô, cá sặc khô, cá chỉ vàng và nhiều loại <strong>cá khô đặc sản miền Tây</strong> được chế biến theo phương pháp truyền thống, giữ nguyên hương vị đậm đà.</p>

<h3>🦐 Tôm khô & Mực khô</h3>
<p><strong>Tôm khô Cà Mau</strong>, mực khô Phan Thiết - những sản phẩm hải sản khô hảo hạng từ các vùng biển nổi tiếng Việt Nam. 100% tự nhiên, không chất bảo quản.</p>

<h3>🥭 Trái cây sấy</h3>
<p>Trái cây sấy tự nhiên giữ nguyên hương vị và dinh dưỡng: xoài sấy, mít sấy, chuối sấy, khoai lang sấy... Snack lành mạnh cho cả gia đình.</p>

<h3>🍵 Trà & Bánh mứt</h3>
<p>Trà truyền thống, bánh mứt đậm đà hương vị Tết Việt Nam. Đặc biệt phù hợp làm quà biếu, quà Tết cho người thân xa xứ.</p>

<h2>Mua đặc sản Việt Nam tại Mỹ ở đâu?</h2>
<p>Nếu bạn đang tìm kiếm <strong>đặc sản Việt Nam chính gốc tại Mỹ</strong>, LIKEFOOD là lựa chọn hàng đầu. Website <a href="https://likefood.vn">likefood.vn</a> cung cấp trải nghiệm mua sắm trực tuyến dễ dàng với:</p>
<ul>
<li>Thanh toán an toàn qua nhiều phương thức</li>
<li>Giao hàng nhanh chóng toàn nước Mỹ</li>
<li>Đóng gói cẩn thận, bảo quản tốt</li>
<li>Hỗ trợ tư vấn 24/7</li>
<li>Chính sách đổi trả linh hoạt</li>
</ul>

<h2>Thông tin liên hệ LIKEFOOD</h2>
<p>📍 Địa chỉ: Omaha, NE 68136, United States</p>
<p>📞 Hotline: +1 402-315-8105</p>
<p>📧 Email: tranquocvu3011@gmail.com</p>
<p>🌐 Website: <a href="https://likefood.vn">likefood.vn</a></p>

<p><em>LIKEFOOD - Mang hương vị Việt đến người Việt xa xứ. Đặt hàng ngay hôm nay!</em></p>`,

    contentEn: `<h2>What is LIKEFOOD?</h2>
<p><strong>LIKEFOOD</strong> is an e-commerce platform specializing in providing <strong>authentic Vietnamese specialty food</strong> in the United States. Born from the longing for home flavors among the Vietnamese community abroad, LIKEFOOD offers over 100 specialty products carefully selected from various regions of Vietnam.</p>

<h2>LIKEFOOD's Mission</h2>
<p>LIKEFOOD was created with the mission of <strong>connecting Vietnamese flavors with the Vietnamese community in the U.S.</strong> We believe that each specialty product is not just food, but a thread connecting roots, family, and homeland.</p>

<h3>What Makes LIKEFOOD Different?</h3>
<ul>
<li><strong>Natural ingredients:</strong> Products are carefully selected from natural sources by our team in Vietnam.</li>
<li><strong>Food safety:</strong> Rigorous quality controls, packaged to meet U.S. market standards.</li>
<li><strong>Nationwide U.S. shipping:</strong> Fast delivery to all 50 states with careful packaging.</li>
<li><strong>Own brand:</strong> LIKEFOOD is our own brand, committed to Vietnamese flavor and standardized packaging.</li>
</ul>

<h2>What Products Does LIKEFOOD Offer?</h2>
<p>LIKEFOOD provides a diverse range of Vietnamese specialty products:</p>

<h3>🐟 Dried Fish from Western Vietnam</h3>
<p>Snakehead, climbing perch, golden threadfin and many <strong>Western Vietnamese dried fish specialties</strong> prepared using traditional methods.</p>

<h3>🦐 Dried Shrimp & Dried Squid</h3>
<p><strong>Ca Mau dried shrimp</strong>, Phan Thiet dried squid - premium dried seafood from Vietnam's famous coastal regions. 100% natural, no preservatives.</p>

<h3>🥭 Dried Fruits</h3>
<p>Naturally dried fruits preserving authentic flavor and nutrition: dried mango, dried jackfruit, dried banana... Healthy snacks for the whole family.</p>

<h3>🍵 Tea & Confectionery</h3>
<p>Traditional tea, cakes and sweets rich in Vietnamese Tet flavors. Perfect for gifts and Tet presents.</p>

<h2>Contact LIKEFOOD</h2>
<p>📍 Address: Omaha, NE 68136, United States</p>
<p>📞 Hotline: +1 402-315-8105</p>
<p>📧 Email: tranquocvu3011@gmail.com</p>
<p>🌐 Website: <a href="https://likefood.vn">likefood.vn</a></p>`,
    image: "/images/dacsan.png",
  },

  {
    title: "Tại sao chọn LIKEFOOD? 5 lý do người Việt tại Mỹ tin tưởng",
    titleEn: "Why Choose LIKEFOOD? 5 Reasons Vietnamese in the US Trust Us",
    slug: "tai-sao-chon-likefood",
    summary: "Khám phá 5 lý do hàng đầu khiến cộng đồng người Việt tại Mỹ tin tưởng LIKEFOOD để mua đặc sản Việt Nam. Chất lượng, giao hàng, giá cả và dịch vụ.",
    summaryEn: "Discover the top 5 reasons why the Vietnamese community in the US trusts LIKEFOOD for authentic Vietnamese specialty food.",
    category: "Giới thiệu",
    categoryEn: "About",
    content: `<h2>Tại sao nên mua đặc sản Việt Nam tại LIKEFOOD?</h2>
<p>Với hàng triệu người Việt đang sinh sống tại Hoa Kỳ, nhu cầu tìm kiếm <strong>đặc sản Việt Nam chính gốc</strong> luôn rất lớn. Tuy nhiên, không phải nơi nào cũng đáp ứng được yêu cầu về chất lượng, nguồn gốc và sự tiện lợi. Đó là lý do LIKEFOOD trở thành lựa chọn hàng đầu.</p>

<h3>1. Sản phẩm chính gốc, nguồn gốc rõ ràng</h3>
<p>LIKEFOOD làm việc trực tiếp với các nhà sản xuất tại Việt Nam. Mỗi sản phẩm đều được <strong>kiểm tra nguồn gốc xuất xứ</strong>, đảm bảo 100% chính gốc từ các vùng đặc sản nổi tiếng:</p>
<ul>
<li>Cá khô từ miền Tây Nam Bộ</li>
<li>Tôm khô Cà Mau, mực khô Phan Thiết</li>
<li>Trái cây sấy từ các tỉnh Đồng bằng sông Cửu Long</li>
<li>Gia vị, trà từ các vùng truyền thống</li>
</ul>

<h3>2. Giao hàng toàn nước Mỹ trong 2-3 ngày</h3>
<p>LIKEFOOD cam kết <strong>giao hàng nhanh chóng đến tất cả 50 bang</strong>. Sản phẩm được đóng gói cẩn thận trong bao bì chất lượng cao, đảm bảo giữ nguyên hương vị và chất lượng khi đến tay bạn.</p>
<p><strong>Miễn phí vận chuyển</strong> cho đơn hàng từ $500!</p>

<h3>3. An toàn thực phẩm theo tiêu chuẩn Mỹ</h3>
<p>Tất cả sản phẩm LIKEFOOD đều tuân thủ <strong>quy trình kiểm định chất lượng nghiêm ngặt</strong>. Từ khâu thu mua, chế biến đến đóng gói đều được giám sát chặt chẽ để đạt tiêu chuẩn an toàn thực phẩm phù hợp thị trường Hoa Kỳ.</p>

<h3>4. Giá cả hợp lý, nhiều ưu đãi</h3>
<p>LIKEFOOD cung cấp sản phẩm với <strong>giá cạnh tranh</strong> nhờ quy trình phân phối trực tiếp, không qua trung gian. Ngoài ra, khách hàng còn được hưởng:</p>
<ul>
<li>Flash Sale định kỳ giảm đến 50%</li>
<li>Voucher giảm giá cho khách hàng mới</li>
<li>Chương trình tích điểm LIKEFOOD Xu</li>
<li>Quà tặng kèm cho đơn hàng lớn</li>
</ul>

<h3>5. Hỗ trợ tận tâm 24/7</h3>
<p>Đội ngũ LIKEFOOD luôn sẵn sàng <strong>hỗ trợ bạn mọi lúc</strong>. Dù bạn cần tư vấn về sản phẩm, theo dõi đơn hàng hay giải quyết vấn đề, chúng tôi đều có mặt.</p>
<ul>
<li>📞 Hotline: +1 402-315-8105</li>
<li>📧 Email: tranquocvu3011@gmail.com</li>
<li>💬 Live Chat trên website</li>
<li>📱 Facebook Messenger</li>
</ul>

<h2>Kết luận</h2>
<p>LIKEFOOD không chỉ là nơi bán đặc sản Việt Nam, mà còn là <strong>cầu nối văn hóa ẩm thực</strong> giữa Việt Nam và cộng đồng người Việt tại Mỹ. Hãy trải nghiệm và cảm nhận sự khác biệt!</p>
<p><a href="/products">👉 Khám phá sản phẩm LIKEFOOD ngay</a></p>`,

    contentEn: `<h2>Why Buy Vietnamese Specialties at LIKEFOOD?</h2>
<p>With millions of Vietnamese living in the United States, the demand for <strong>authentic Vietnamese specialty food</strong> is always high. However, not everywhere can meet requirements for quality, origin, and convenience. That's why LIKEFOOD has become the top choice.</p>

<h3>1. Authentic Products with Clear Origins</h3>
<p>LIKEFOOD works directly with producers in Vietnam. Each product is <strong>origin-verified</strong>, ensuring 100% authenticity from famous specialty regions.</p>

<h3>2. Nationwide U.S. Shipping in 2-3 Days</h3>
<p>LIKEFOOD guarantees <strong>fast delivery to all 50 states</strong>. Products are carefully packaged to preserve flavor and quality.</p>
<p><strong>Free shipping</strong> for orders from $500!</p>

<h3>3. U.S. Food Safety Standards</h3>
<p>All LIKEFOOD products comply with <strong>rigorous quality control processes</strong> suitable for the U.S. market.</p>

<h3>4. Competitive Prices with Great Deals</h3>
<p>Direct distribution means <strong>competitive prices</strong>. Plus: Flash Sales up to 50% off, new customer vouchers, LIKEFOOD points program.</p>

<h3>5. Dedicated 24/7 Support</h3>
<p>The LIKEFOOD team is always <strong>ready to help</strong> with product advice, order tracking, or issue resolution.</p>

<p><a href="/products">👉 Explore LIKEFOOD products now</a></p>`,
    image: "/images/dacsan.png",
  },

  {
    title: "Hướng dẫn mua hàng trên LIKEFOOD - Đặc sản Việt Nam ship tận nhà",
    titleEn: "How to Order on LIKEFOOD - Vietnamese Specialties Delivered to Your Door",
    slug: "huong-dan-mua-hang-likefood",
    summary: "Hướng dẫn chi tiết cách mua đặc sản Việt Nam trên LIKEFOOD từ A-Z: tạo tài khoản, chọn sản phẩm, thanh toán và theo dõi đơn hàng.",
    summaryEn: "Complete guide on how to order Vietnamese specialties on LIKEFOOD: account creation, product selection, payment, and order tracking.",
    category: "Hướng dẫn",
    categoryEn: "Guide",
    content: `<h2>Mua đặc sản Việt Nam online chưa bao giờ dễ dàng đến thế!</h2>
<p>LIKEFOOD mang đến trải nghiệm <strong>mua sắm đặc sản Việt Nam</strong> trực tuyến đơn giản, nhanh chóng và an toàn. Dưới đây là hướng dẫn chi tiết từ A đến Z.</p>

<h3>Bước 1: Truy cập LIKEFOOD</h3>
<p>Bạn có thể mua hàng tại:</p>
<ul>
<li>🌐 Website: <a href="https://likefood.vn">likefood.vn</a></li>
<li>📱 Tương thích hoàn hảo trên điện thoại, máy tính bảng</li>
</ul>

<h3>Bước 2: Tìm kiếm sản phẩm</h3>
<p>LIKEFOOD cung cấp nhiều cách để bạn tìm đúng sản phẩm:</p>
<ul>
<li><strong>Thanh tìm kiếm:</strong> Gõ tên sản phẩm, ví dụ "cá khô", "tôm khô"</li>
<li><strong>Danh mục:</strong> Cá khô, Tôm & Mực khô, Trái cây sấy, Trà & Bánh mứt, Gia vị</li>
<li><strong>Bộ lọc thông minh:</strong> Lọc theo giá, đánh giá, tag sản phẩm</li>
<li><strong>Flash Sale:</strong> Sản phẩm giảm giá đặc biệt</li>
</ul>

<h3>Bước 3: Thêm vào giỏ hàng</h3>
<p>Khi đã chọn được sản phẩm yêu thích:</p>
<ul>
<li>Chọn biến thể (trọng lượng, hương vị) nếu có</li>
<li>Nhấn nút <strong>"Thêm vào giỏ"</strong></li>
<li>Tiếp tục mua sắm hoặc đi đến giỏ hàng</li>
</ul>

<h3>Bước 4: Thanh toán</h3>
<p>LIKEFOOD hỗ trợ nhiều phương thức thanh toán an toàn:</p>
<ul>
<li>💳 Thẻ tín dụng / Thẻ ghi nợ (Visa, Mastercard, etc.)</li>
<li>🏦 Chuyển khoản ngân hàng</li>
<li>💰 COD (Thanh toán khi nhận hàng)</li>
</ul>
<p>Nhập <strong>mã giảm giá</strong> hoặc sử dụng <strong>LIKEFOOD Xu</strong> để được giảm thêm!</p>

<h3>Bước 5: Nhận hàng</h3>
<p>Sau khi đặt hàng thành công:</p>
<ul>
<li>Bạn sẽ nhận email xác nhận đơn hàng</li>
<li>Theo dõi trạng thái đơn hàng trực tiếp trên website</li>
<li>Nhận thông báo khi đơn hàng được giao</li>
<li>Thời gian giao hàng: <strong>2-3 ngày</strong> trên toàn nước Mỹ</li>
</ul>

<h2>Mẹo mua hàng thông minh trên LIKEFOOD</h2>
<ul>
<li>✅ Đặt đơn từ $500 để được <strong>miễn phí ship</strong></li>
<li>✅ Theo dõi <strong>Flash Sale</strong> để săn deal giảm đến 50%</li>
<li>✅ Tích điểm LIKEFOOD Xu với mỗi đơn hàng</li>
<li>✅ Đăng ký nhận email để không bỏ lỡ ưu đãi</li>
</ul>

<p><strong>Bắt đầu mua sắm ngay: </strong><a href="/products">Xem tất cả sản phẩm LIKEFOOD →</a></p>`,

    contentEn: `<h2>Buying Vietnamese Specialties Online Has Never Been Easier!</h2>
<p>LIKEFOOD provides a simple, fast, and secure <strong>Vietnamese specialty shopping</strong> experience. Here's a complete guide.</p>

<h3>Step 1: Visit LIKEFOOD</h3>
<p>Shop at <a href="https://likefood.vn">likefood.vn</a> — fully compatible with phones, tablets, and computers.</p>

<h3>Step 2: Find Products</h3>
<p>Use the search bar, browse categories, or check Flash Sales for special deals.</p>

<h3>Step 3: Add to Cart</h3>
<p>Select variants if available, click "Add to Cart", and continue shopping or proceed to checkout.</p>

<h3>Step 4: Checkout</h3>
<p>Multiple secure payment methods: credit/debit cards, bank transfer, and COD.</p>

<h3>Step 5: Receive Your Order</h3>
<p>Track your order status online. Delivery within <strong>2-3 days</strong> across the U.S.</p>

<p><a href="/products">Start shopping now →</a></p>`,
    image: "/images/dacsan.png",
  },

  {
    title: "Đặc sản Việt Nam tại Mỹ - Cẩm nang mua sắm online toàn diện 2026",
    titleEn: "Vietnamese Specialties in the USA - Complete Online Shopping Guide 2026",
    slug: "dac-san-viet-nam-tai-my",
    summary: "Cẩm nang toàn diện về các loại đặc sản Việt Nam phổ biến tại Mỹ: cá khô, tôm khô, mực khô, trái cây sấy. Cách chọn mua, bảo quản và thưởng thức.",
    summaryEn: "Comprehensive guide to popular Vietnamese specialties in the US: dried fish, shrimp, squid, dried fruits. How to buy, store, and enjoy.",
    category: "Cẩm nang",
    categoryEn: "Guide",
    content: `<h2>Đặc sản Việt Nam - Hương vị không thể thiếu đối với người Việt xa xứ</h2>
<p>Sống xa quê hương, <strong>người Việt tại Mỹ</strong> luôn mang trong mình nỗi nhớ hương vị quê nhà. Những món đặc sản quen thuộc từ thuở nhỏ - cá khô, tôm khô, mực khô - không chỉ là thực phẩm mà còn là ký ức, là sợi dây kết nối với cội nguồn.</p>

<h2>Các loại đặc sản Việt Nam phổ biến tại Mỹ</h2>

<h3>1. Cá khô miền Tây</h3>
<p><strong>Cá khô</strong> là món đặc sản truyền thống của miền Tây Nam Bộ. Các loại phổ biến nhất:</p>
<ul>
<li><strong>Cá lóc khô:</strong> Thịt dày, vị ngọt tự nhiên, nướng hoặc chiên đều ngon</li>
<li><strong>Cá sặc khô:</strong> Vị đậm, phù hợp kho với tương, ăn cơm nóng</li>
<li><strong>Cá chỉ vàng:</strong> Giòn, thơm, nướng ăn với cơm trắng rất tuyệt</li>
</ul>
<p>💡 <strong>Mẹo bảo quản:</strong> Để nơi khô ráo, thoáng mát. Đóng kín túi zip sau khi mở. Bảo quản tủ lạnh giữ được 6-12 tháng.</p>

<h3>2. Tôm khô & Mực khô</h3>
<p><strong>Tôm khô Cà Mau</strong> nổi tiếng với vị ngọt tự nhiên, màu đỏ cam đẹp mắt. Có thể ăn trực tiếp hoặc dùng trong nhiều món:</p>
<ul>
<li>Bánh tráng trộn</li>
<li>Gỏi ngó sen tôm khô</li>
<li>Cháo tôm khô</li>
</ul>
<p><strong>Mực khô</strong> Phan Thiết - nướng trên than hồng, chấm tương ớt - đơn giản nhưng ngon khó cưỡng!</p>

<h3>3. Trái cây sấy</h3>
<p>Trái cây sấy tự nhiên từ Việt Nam ngày càng được ưa chuộng tại Mỹ vì:</p>
<ul>
<li>✅ Giàu dinh dưỡng, giữ nguyên vitamin</li>
<li>✅ Không đường, không chất bảo quản</li>
<li>✅ Snack lành mạnh cho cả gia đình</li>
<li>✅ Phù hợp mang theo nhâm nhi</li>
</ul>
<p>Các loại phổ biến: xoài sấy, mít sấy, chuối sấy, khoai lang sấy, thanh long sấy.</p>

<h3>4. Gia vị & Nước mắm</h3>
<p>Không thể thiếu trong gian bếp người Việt:</p>
<ul>
<li>Nước mắm Phú Quốc</li>
<li>Tương ớt, sa tế</li>
<li>Bột ngũ vị hương</li>
<li>Bột cà ri Việt Nam</li>
</ul>

<h2>Mua đặc sản Việt Nam ở đâu tại Mỹ?</h2>
<p>Ngày nay, bạn có thể <strong>mua đặc sản Việt Nam online</strong> dễ dàng thông qua LIKEFOOD - nền tảng chuyên biệt cho đặc sản Việt tại Mỹ:</p>
<ul>
<li>🌐 Website: <a href="https://likefood.vn">likefood.vn</a></li>
<li>📦 Giao hàng toàn Mỹ trong 2-3 ngày</li>
<li>💰 Giá cạnh tranh, nhiều khuyến mãi</li>
<li>✅ Sản phẩm chính gốc, nguồn gốc rõ ràng</li>
</ul>

<p><a href="/products">👉 Khám phá đặc sản Việt Nam tại LIKEFOOD →</a></p>`,

    contentEn: `<h2>Vietnamese Specialties - Essential Flavors for Vietnamese Abroad</h2>
<p>Living far from home, <strong>Vietnamese in America</strong> always carry a longing for homeland flavors. Familiar specialty foods from childhood are not just sustenance but memories connecting us to our roots.</p>

<h2>Popular Vietnamese Specialties in the USA</h2>

<h3>1. Western Vietnamese Dried Fish</h3>
<p>Traditional dried fish from the Mekong Delta region including snakehead, climbing perch, and golden threadfin.</p>

<h3>2. Dried Shrimp & Dried Squid</h3>
<p>Ca Mau dried shrimp famous for natural sweetness. Phan Thiet dried squid - grilled on hot coals with chili sauce.</p>

<h3>3. Dried Fruits</h3>
<p>Natural dried fruits rich in nutrition: dried mango, jackfruit, banana, sweet potato, dragon fruit.</p>

<h3>4. Spices & Fish Sauce</h3>
<p>Essential Vietnamese kitchen items: Phu Quoc fish sauce, chili paste, five-spice powder.</p>

<h2>Where to Buy Vietnamese Specialties in the USA?</h2>
<p>Shop online at <a href="https://likefood.vn">LIKEFOOD</a> for authentic Vietnamese food delivered to your door.</p>`,
    image: "/images/dacsan.png",
  },

  {
    title: "LIKEFOOD Review 2026 - Trải nghiệm mua đặc sản Việt Nam online tại Mỹ",
    titleEn: "LIKEFOOD Review 2026 - Buying Vietnamese Specialty Food Online in the USA",
    slug: "likefood-review",
    summary: "Đánh giá chi tiết LIKEFOOD 2026: chất lượng sản phẩm, trải nghiệm mua sắm, giao hàng, hỗ trợ khách hàng. Review thực tế từ khách hàng.",
    summaryEn: "Detailed LIKEFOOD 2026 review: product quality, shopping experience, delivery, customer support. Real customer feedback.",
    category: "Đánh giá",
    categoryEn: "Review",
    content: `<h2>LIKEFOOD Review: Đánh giá toàn diện nền tảng đặc sản Việt Nam tại Mỹ</h2>
<p>Nếu bạn đang tìm kiếm một nơi uy tín để <strong>mua đặc sản Việt Nam tại Mỹ</strong>, bài review này sẽ giúp bạn hiểu rõ hơn về LIKEFOOD - nền tảng thương mại điện tử ngày càng được cộng đồng người Việt tin tưởng.</p>

<h2>📦 Chất lượng sản phẩm</h2>
<p><strong>Đánh giá: ⭐⭐⭐⭐⭐ (5/5)</strong></p>
<p>Đây là điểm mạnh lớn nhất của LIKEFOOD. Sản phẩm được tuyển chọn kỹ từ các vùng đặc sản nổi tiếng Việt Nam:</p>
<ul>
<li>Cá khô thịt dày, khô đều, không mùi hôi</li>
<li>Tôm khô đỏ tươi, vị ngọt tự nhiên</li>
<li>Mực khô dẻo dai, thơm đặc trưng</li>
<li>Trái cây sấy giòn, giữ nguyên hương vị</li>
</ul>
<p>Đặc biệt, LIKEFOOD có <strong>thương hiệu riêng</strong> với bao bì chuyên nghiệp, thông tin sản phẩm rõ ràng.</p>

<h2>🛒 Trải nghiệm mua sắm</h2>
<p><strong>Đánh giá: ⭐⭐⭐⭐⭐ (5/5)</strong></p>
<ul>
<li>Website thiết kế hiện đại, dễ sử dụng</li>
<li>Tìm kiếm sản phẩm nhanh chóng với bộ lọc thông minh</li>
<li>Hỗ trợ cả Tiếng Việt và Tiếng Anh</li>
<li>Tương thích tốt trên điện thoại</li>
<li>Chatbot AI hỗ trợ tư vấn tự động</li>
</ul>

<h2>🚚 Giao hàng</h2>
<p><strong>Đánh giá: ⭐⭐⭐⭐ (4.5/5)</strong></p>
<ul>
<li>Giao hàng toàn nước Mỹ</li>
<li>Thời gian: 2-3 ngày làm việc</li>
<li>Đóng gói cẩn thận, bảo quản tốt</li>
<li>Miễn phí ship cho đơn từ $500</li>
<li>Có tracking code theo dõi đơn hàng</li>
</ul>

<h2>💰 Giá cả & Ưu đãi</h2>
<p><strong>Đánh giá: ⭐⭐⭐⭐⭐ (5/5)</strong></p>
<ul>
<li>Giá cạnh tranh so với thị trường</li>
<li>Flash Sale giảm đến 50%</li>
<li>Voucher giảm giá thường xuyên</li>
<li>Chương trình tích điểm LIKEFOOD Xu</li>
</ul>

<h2>📞 Hỗ trợ khách hàng</h2>
<p><strong>Đánh giá: ⭐⭐⭐⭐⭐ (5/5)</strong></p>
<ul>
<li>Hỗ trợ 24/7 qua nhiều kênh</li>
<li>Phản hồi nhanh, thân thiện</li>
<li>Chính sách đổi trả rõ ràng</li>
<li>Live Chat trực tiếp trên website</li>
</ul>

<h2>Khách hàng nói gì về LIKEFOOD?</h2>
<blockquote>
<p>"Nhờ LIKEFOOD mà gia đình tôi ở Mỹ vẫn được thưởng thức hương vị quê nhà. Sản phẩm chất lượng, đóng gói rất cẩn thận." - <strong>Chị Lê Huỳnh Nhiên, California</strong></p>
</blockquote>
<blockquote>
<p>"Mua hàng ở đây rất yên tâm, giao nhanh và hỗ trợ nhiệt tình. Tôi sẽ tiếp tục ủng hộ lâu dài." - <strong>Anh Trần Quốc Vũ, Texas</strong></p>
</blockquote>

<h2>Kết luận</h2>
<p>LIKEFOOD xứng đáng là <strong>nền tảng mua đặc sản Việt Nam hàng đầu tại Mỹ</strong>. Với sản phẩm chính gốc, trải nghiệm mua sắm tốt, giao hàng nhanh và dịch vụ khách hàng tận tâm, LIKEFOOD là lựa chọn tuyệt vời cho người Việt xa xứ.</p>

<p><strong>Tổng điểm: ⭐⭐⭐⭐⭐ (4.9/5)</strong></p>
<p><a href="/products">👉 Trải nghiệm LIKEFOOD ngay hôm nay! →</a></p>`,

    contentEn: `<h2>LIKEFOOD Review: Complete Platform Assessment</h2>
<p>A comprehensive review of LIKEFOOD - the Vietnamese specialty food e-commerce platform trusted by the Vietnamese community in the USA.</p>

<h3>Product Quality: ⭐⭐⭐⭐⭐ (5/5)</h3>
<p>Products are carefully selected from Vietnam's famous specialty regions. Own brand with professional packaging.</p>

<h3>Shopping Experience: ⭐⭐⭐⭐⭐ (5/5)</h3>
<p>Modern website, smart search, bilingual support, mobile-friendly, AI chatbot assistance.</p>

<h3>Delivery: ⭐⭐⭐⭐ (4.5/5)</h3>
<p>Nationwide U.S. shipping, 2-3 business days, careful packaging, free shipping from $500.</p>

<h3>Pricing & Deals: ⭐⭐⭐⭐⭐ (5/5)</h3>
<p>Competitive prices, Flash Sales up to 50% off, regular vouchers, LIKEFOOD points program.</p>

<h3>Customer Support: ⭐⭐⭐⭐⭐ (5/5)</h3>
<p>24/7 multi-channel support, fast friendly responses, clear return policy.</p>

<p><strong>Overall Score: ⭐⭐⭐⭐⭐ (4.9/5)</strong></p>
<p><a href="/products">👉 Try LIKEFOOD today! →</a></p>`,
    image: "/images/dacsan.png",
  },
];

async function seedSEOPosts() {
  console.log("🚀 Bắt đầu seed bài viết SEO...\n");

  for (const postData of SEO_POSTS) {
    try {
      // Check if post already exists
      const existing = await prisma.post.findUnique({
        where: { slug: postData.slug },
      });

      if (existing) {
        console.log(`⏭️  Bài "${postData.title}" đã tồn tại (slug: ${postData.slug}), bỏ qua.`);
        continue;
      }

      await prisma.post.create({
        data: {
          title: postData.title,
          titleEn: postData.titleEn,
          slug: postData.slug,
          summary: postData.summary,
          summaryEn: postData.summaryEn,
          content: postData.content,
          contentEn: postData.contentEn,
          image: postData.image,
          authorName: "LIKEFOOD",
          category: postData.category,
          categoryEn: postData.categoryEn,
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      console.log(`✅ Đã tạo: "${postData.title}" (slug: /${postData.slug})`);
    } catch (error) {
      console.error(`❌ Lỗi khi tạo "${postData.title}":`, error);
    }
  }

  console.log("\n🎉 Hoàn tất seed bài viết SEO!");
}

seedSEOPosts()
  .catch((e) => {
    console.error("Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
