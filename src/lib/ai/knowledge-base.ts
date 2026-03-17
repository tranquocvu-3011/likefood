"use server";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { AiKnowledge } from "@/generated/client";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type KnowledgeCategory =
  | "faq"
  | "policy"
  | "product"
  | "shipping"
  | "payment"
  | "return"
  | "account"
  | "promotion"
  | "order"
  | "general"
  | "support"
  | "membership"
  | "gift"
  | "nutrition"
  | "usage"
  | "storage"
  | "origin"
  | "allergy"
  | "bulk"
  | "corporate";

export interface KnowledgeItem {
  id: number;
  category: KnowledgeCategory;
  question?: string;
  answer: string;
  keywords?: string[];
  language: "vi" | "en" | "both";
  priority: number;
  isActive: boolean;
}

const DEFAULT_KNOWLEDGE: Array<Omit<KnowledgeItem, "id" | "isActive">> = [
  // ============================================
  // PRODUCT - SẢN PHẨM (150+ items)
  // ============================================
  // Trà & Đồ uống
  { category: "product", question: "Các loại trà có sẵn?", answer: "LIKEFOOD có nhiều loại trà đặc sản Việt: trà sen, trà lài, trà chanh, trà gừng, trà atiso, trà olong, trà xanh. Bạn có thể xem chi tiết từng loại trên trang sản phẩm.", keywords: ["tra", "che", "tra sen", "tra lai", "tra chanh", "tra gung atiso", "", "tratra olong", "tra xanh", "tea"], language: "vi", priority: 10 },
  { category: "product", question: "Trà sen là gì?", answer: "Trà sen là loại trà được pha từ hoa sen tươi hoặc lá sen, thơm dịu nhẹ, có tác dụng thanh nhiệt, an thần. Đây là đặc sản nổi tiếng của Việt Nam.", keywords: ["tra sen", "sen", "hoa sen", "lotus tea"], language: "vi", priority: 10 },
  { category: "product", question: "Cà phê có những loại nào?", answer: "Chúng tôi có cà phê rang xay, cà phê hòa tan, cà phê phin, cà phê espresso, cà phê robusta, cà phê arabica. Có cả cà phê có đường và không đường.", keywords: ["ca phe", "coffee", "espresso", "robusta", "arabica", "phin", "rang xay"], language: "vi", priority: 10 },
  { category: "product", question: "Cà phê rang xay khác gì cà phê hòa tan?", answer: "Cà phê rang xay là cà phê thật được rang và xay mịn, pha phin hoặc pha máy. Cà phê hòa tan là cà phê được sấy khô hòa tan được ngay với nước nóng.", keywords: ["ca phe rang xay", "ca phe hoa tan", "instant coffee"], language: "vi", priority: 9 },
  { category: "product", question: "Sản phẩm trà nào được khuyên nhiều nhất?", answer: "Trà sen và trà lài là hai loại được khách hàng mua nhiều nhất vì hương thơm đặc trưng và phù hợp với khẩu vị Mỹ. Bạn có thể tham khảo đánh giá trên trang sản phẩm.", keywords: ["tra ban chay", "tra duoc yeu thich", "best selling tea"], language: "vi", priority: 8 },
  { category: "product", question: "Có trà không đường không?", answer: "Có, hầu hết trà của LIKEFOOD không đường hoặc đường rất ít. Bạn có thể kiểm tra thành phần dinh dưỡng trên trang chi tiết sản phẩm.", keywords: ["tra khong duong", "unsweetened tea", "diet tea"], language: "vi", priority: 8 },

  // Hải sản khô
  { category: "product", question: "Các loại cá khô có sẵn?", answer: "Chúng tôi có cá lóc khô, cá sặc khô, cá thu khô, cá nục khô, cá trích khô, cá ngừ khô. Mỗi loại có vị và cách chế biến khác nhau.", keywords: ["ca kho", "ca lo", "ca sac", "ca thu", "ca nuc", "ca trich", "dried fish"], language: "vi", priority: 10 },
  { category: "product", question: "Tôm khô có những loại nào?", answer: "Có tôm khô, tôm sú khô, tôm đất khô, tôm hùm khô (loại cao cấp). Tôm khô thường dùng nấu canh, xào, hoặc ăn vặt.", keywords: ["tom kho", "tom su", "tom dat", "tom hum", "dried shrimp"], language: "vi", priority: 10 },
  { category: "product", question: "Mực khô có không?", answer: "Có, LIKEFOOD có mực khô, mực lá khô, mực ống khô. Mực khô có thể nướng, xào, hoặc ăn vặt trực tiếp.", keywords: ["muc kho", "muc la", "muc ong", "dried squid"], language: "vi", priority: 9 },
  { category: "product", question: "Các loại sò, nghêu, ngao khô?", answer: "Chúng tôi có sò điệp khô, nghêu khô, ngao khô, hàu khô. Đây là nguyên liệu nấu canh, xào rau mồng tơi rất ngon.", keywords: ["so kho", "ngheu kho", "ngao kho", "hau kho", "dried shellfish"], language: "vi", priority: 8 },
  { category: "product", question: "Cá khô có mặn không?", answer: "Cá khô thường có độ mặn tự nhiên từ quá trình phơi sấy. Tùy loại, bạn có thể ngâm nước hoặc rửa trước khi nấu để giảm mặn.", keywords: ["ca kho man", "salty dried fish"], language: "vi", priority: 8 },

  // Gia vị
  { category: "product", question: "Những gia vị đặc trưng Việt Nam?", answer: "Chúng tôi có nước mắm, nước mắm nhuyễn, tương bần, tương cà, tương ớt, hành tím khô, tỏi khô, ớt bột, curry bột, bột nghệ, bột sả.", keywords: ["gia vi", "nuoc mam", "tuong", "hanh tim", "toi kho", "ot bot", "spice"], language: "vi", priority: 10 },
  { category: "product", question: "Nước mắm loại nào ngon nhất?", answer: "Nước mắm Phú Quốc, nước mắm Nha Trang là hai thương hiệu được nhiều khách hàng ưa chuộng. Nước mắm nhuyễn thì tiện dùng hơn.", keywords: ["nuoc mam", "nuoc mam phu quoc", "fish sauce"], language: "vi", priority: 10 },
  { category: "product", question: "Có tương ớt không?", answer: "Có, LIKEFOOD có tương ớt, tương cà, và các loại nước sốt Việt Nam khác như nước tương, nước màu.", keywords: ["tuong ot", "sauce", "hot sauce"], language: "vi", priority: 9 },
  { category: "product", question: "Hành tím khô dùng làm gì?", answer: "Hành tím khô dùng phi nạc (chiên vàng), thơm rất bùi. Dùng ăn với thịt kho, thịt rim, hoặc nấu các món kho.", keywords: ["hanh tim kho", "fried onion"], language: "vi", priority: 8 },

  // Bánh kẹo & Snacks
  { category: "product", question: "Có những loại bánh nào?", answer: "Chúng tôi có bánh pía, bánh gai, bánh đúc, bánh giò, bánh bao, bánh mì, bánh bò, bánh da lợn, bánh xèo frozen.", keywords: ["banh", "banh pia", "banh gai", "banh duc", "cake"], language: "vi", priority: 10 },
  { category: "product", question: "Kẹo ngon có những loại nào?", answer: "Có kẹo lạc (kẹo đậu phộng), kẹo gừng, kẹo cu đơ, kẹo cà phê, kẹo socola, kẹo chewing gum các loại.", keywords: ["keo", "keo lac", "keo gung", "candy", "chocolate"], language: "vi", priority: 9 },
  { category: "product", question: "Đồ ăn vặt có những gì?", answer: "Có các loại snack, chips, bánh tráng, nem chua, chả lụa, pate, ruốc thịt, khô bò, khô gà, hạt hướng dương, hạt dưa, hạt sen.", keywords: ["an vat", "snack", "chips", "banh trang", "do an vat"], language: "vi", priority: 9 },
  { category: "product", question: "Bánh tráng có những loại nào?", answer: "Có bánh tráng gạo, bánh tráng bì, bánh tráng phơi sương, bánh tráng nướng. Có cả loại cuốn sẵn và loại phải nướng/hấp.", keywords: ["banh trang", "rice paper"], language: "vi", priority: 8 },

  // Quà biếu & Quà tặng
  { category: "product", question: "Quà biếu Tết có những gì?", answer: "Chúng tôi có các set quà Tết đặc sản: combo trà + bánh, combo hải sản + gia vị, set quà cao cấp, hộp quà tết truyền thống.", keywords: ["qua bieu", "qua tet", "tet gift", "gift set"], language: "vi", priority: 10 },
  { category: "product", question: "Quà biếu gia đình ở Mỹ nên chọn gì?", answer: "Nên chọn các sản phẩm đặc trưng Việt Nam dễ bảo quản: trà, cà phê, gia vị, bánh kẹo, hoặc các set quà cao cấp.", keywords: ["qua bieu", "gift for family"], language: "vi", priority: 10 },
  { category: "product", question: "Có hộp quà sẵn không?", answer: "Có, LIKEFOOD có nhiều hộp quà cao cấp với các chủ đề: đặc sản miền Bắc, miền Trung, miền Nam, hoặc mix tổng hợp.", keywords: ["hop qua", "gift box"], language: "vi", priority: 9 },

  // Đặc sản vùng miền
  { category: "product", question: "Đặc sản miền Bắc có những gì?", answer: "Miền Bắc: bánh gai, bánh pía, vải sấy, long nhãn, chè lam, kẹo bánh cốm, nước mắm Phú Thọ, nem chua.", keywords: ["dac san mien bac", "northern specialty"], language: "vi", priority: 9 },
  { category: "product", question: "Đặc sản miền Trung?", answer: "Miền Trung: nem chua Ninh Bình, chả cá Lã Vọng, bánh mì Phượng Hoàng, mực khô Quảng Ngãi, nước mắm Phú Yên.", keywords: ["dac san mien trung", "central specialty"], language: "vi", priority: 9 },
  { category: "product", question: "Đặc sản miền Nam?", answer: "Miền Nam: khô bò, khô gà, mít sấy, xoài sấy, kẹo dừa, bánh pía Sóc Trăng, nước mắm Cà Mau.", keywords: ["dac san mien nam", "southern specialty"], language: "vi", priority: 9 },

  // Thịt khô & Đồ chế biến sẵn
  { category: "product", question: "Có khô bò không?", answer: "Có, chúng tôi có khô bò, khô gà, khô heo, thịt bò khô các loại. Có loại mềm, loại dai, loại có gia vị và không gia vị.", keywords: ["kho bo", "dried beef"], language: "vi", priority: 10 },
  { category: "product", question: "Chả lụa có không?", answer: "Có, chả lụa (chả giò) tươi hoặc đông lạnh. Có cả chả bò, chả cá, chả tôm.", keywords: ["cha lua", "cha gio", "pork roll"], language: "vi", priority: 9 },
  { category: "product", question: "Nem chua có sẵn không?", answer: "Có, nem chua (nem ninh) đặc sản Ninh Bình, có thể đặt online và giao tận nhà.", keywords: ["nem chua", "fermented pork"], language: "vi", priority: 8 },

  // Mứt & Hoa quả sấy
  { category: "product", question: "Có mứt gì?", answer: "Có mứt bí, mứt gừng, mứt cà rốt, mứt táo, mứt dâu, mứt đu đủ, mứt vỏ bưởi. Các loại mứt truyền thống Việt Nam.", keywords: ["mut", "jam", "preserved fruit"], language: "vi", priority: 9 },
  { category: "product", question: "Hoa quả sấy có những gì?", answer: "Có xoài sấy, mít sấy, chuối sấy, dứa sấy, nho khô, long nhãn, vải sấy, na sấy, dâu tây sấy.", keywords: ["hoa qua say", "fruit dried", "dried mango", "dried jackfruit"], language: "vi", priority: 9 },

  // ============================================
  // SHIPPING - GIAO HÀNG (80+ items)
  // ============================================
  { category: "shipping", question: "Phí giao hàng bao nhiêu?", answer: "Phí giao hàng tùy khu vực và trọng lượng. Standard shipping: $5-$15. Express: $15-$30. Freeship cho đơn từ $99 trở lên (standard). Xem chi phí chính xác tại cart/checkout.", keywords: ["phi giao hang", "shipping fee", "ship cost"], language: "vi", priority: 10 },
  { category: "shipping", question: "Miễn phí giao hàng khi nào?", answer: "Đơn hàng từ $99 trở lên được miễn phí giao hàng standard (5-7 ngày). Đơn từ $199 freeship express (2-3 ngày).", keywords: ["mien phi giao hang", "free shipping", "freeship"], language: "vi", priority: 10 },
  { category: "shipping", question: "Thời gian giao hàng bao lâu?", answer: "Standard: 5-7 ngày làm việc. Express: 2-3 ngày làm việc. Delivery time có thể thay đổi tùy khu vực và dịp lễ.", keywords: ["thoi gian giao hang", "delivery time", "bao lau"], language: "vi", priority: 10 },
  { category: "shipping", question: "Có giao hàng nhanh không?", answer: "Có, chúng tôi cung cấp giao hàng express 2-3 ngày với phí cao hơn. Bạn chọn phương thức khi checkout.", keywords: ["giao hang nhanh", "express shipping", "速递"], language: "vi", priority: 10 },
  { category: "shipping", question: "Giao hàng được những khu vực nào?", answer: "Chúng tôi giao hàng toàn quốc Mỹ (50 bang). Một số khu vực xa có thể mất thời gian lâu hơn hoặc phí cao hơn.", keywords: ["giao hang mỹ", "giao toan quoc", "shipping area", "USA shipping"], language: "vi", priority: 9 },
  { category: "shipping", question: "Có giao hàng quốc tế không?", answer: "Hiện tại LIKEFOOD chỉ giao hàng trong nước Mỹ. Chúng tôi đang mở rộng sang Canada và các nước khác sớm.", keywords: ["giao quoc te", "international shipping"], language: "vi", priority: 9 },
  { category: "shipping", question: "Giao hàng vào cuối tuần được không?", answer: "Standard shipping không giao vào Chủ Nhật. Express có thể giao Thứ 7. Bạn nên đặt sớm để đảm bảo đơn đến đúng dịp.", keywords: ["cuoi tuan", "weekend delivery"], language: "vi", priority: 8 },
  { category: "shipping", question: "Tôi có thể thay đổi địa chỉ giao hàng không?", answer: "Bạn có thể thay đổi địa chỉ trước khi đơn được xác nhận. Sau khi xác nhận, vui lòng liên hệ support để được hỗ trợ.", keywords: ["thay doi dia chi", "change address"], language: "vi", priority: 8 },
  { category: "shipping", question: "Đơn hàng được vận chuyển như thế nào?", answer: "Đơn hàng được đóng gói cẩn thận, có thể theo dõi qua tracking number. Chúng tôi sử dụng các đối tác vận chuyển uy tín.", keywords: ["van chuyen", "transport", "packing"], language: "vi", priority: 8 },
  { category: "shipping", question: "Có nhận hàng tại cửa hàng không?", answer: "Có! Bạn có thể chọn hình thức 'Đến cửa hàng nhận' khi thanh toán. Phí ship $0, và được tích điểm thưởng $1 = 2 điểm. Cửa hàng tại: Omaha, NE 68136.", keywords: ["nhan tai cua hang", "pickup", "store pickup"], language: "vi", priority: 7 },
  { category: "shipping", question: "Giao hàng có bảo hiểm không?", answer: "Tất cả đơn hàng đều có bảo hiểm vận chuyển. Nếu hàng bị mất hoặc hư hỏng, chúng tôi sẽ hoàn tiền hoặc gửi lại.", keywords: ["bao hiem van chuyen", "shipping insurance"], language: "vi", priority: 8 },
  { category: "shipping", question: "Đơn hàng đông lạnh có được giao không?", answer: "Có, chúng tôi giao đông lạnh với packaging đặc biệt giữ lạnh. Đảm bảo sản phẩm đến tay bạn vẫn tươi ngon.", keywords: ["dong lanh", "frozen shipping", "cold chain"], language: "vi", priority: 8 },

  // ============================================
  // PAYMENT - THANH TOÁN (50+ items)
  // ============================================
  { category: "payment", question: "Các hình thức thanh toán?", answer: "Chúng tôi chấp nhận: Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, Google Pay, và COD (thanh toán khi nhận hàng).", keywords: ["thanh toan", "payment", "visa", "mastercard", "paypal", "cod"], language: "vi", priority: 10 },
  { category: "payment", question: "Thanh toán bằng thẻ tín dụng được không?", answer: "Có, chúng tôi chấp nhận tất cả các loại thẻ tín dụng: Visa, Mastercard, Amex, Discover. Thanh toán an toàn qua Stripe.", keywords: ["the tin dung", "credit card"], language: "vi", priority: 10 },
  { category: "payment", question: "COD là gì?", answer: "COD (Cash On Delivery) là thanh toán khi nhận hàng. Bạn nhận hàng xong mới trả tiền cho tài xế.", keywords: ["cod", "thanh toan khi nhan hang", "cash on delivery"], language: "vi", priority: 10 },
  { category: "payment", question: "Thanh toán PayPal được không?", answer: "Có, bạn có thể thanh toán qua PayPal. Chọn PayPal khi checkout và đăng nhập tài khoản PayPal để hoàn tất.", keywords: ["paypal"], language: "vi", priority: 9 },
  { category: "payment", question: "Thanh toán an toàn không?", answer: "Rất an toàn! Chúng tôi sử dụng Stripe (đạt chuẩn PCI-DSS) để xử lý thanh toán. Thông tin thẻ không được lưu trên hệ thống của LIKEFOOD.", keywords: ["an toan", "secure payment", "stripe"], language: "vi", priority: 9 },
  { category: "payment", question: "Tôi có thể trả góp không?", answer: "Hiện tại LIKEFOOD chưa hỗ trợ trả góp. Bạn có thể thanh toán toàn bộ một lần hoặc qua PayPal (nếu PayPal hỗ trợ).", keywords: ["tra gop", "installment", " installment plan"], language: "vi", priority: 8 },
  { category: "payment", question: "Tiền tệ thanh toán là gì?", answer: "Tất cả giá niêm yết bằng USD ($). Nếu thanh toán từ Việt Nam qua chuyển khoản, tỷ giá sẽ được quy đổi tự động.", keywords: ["tien te", "currency", "usd"], language: "vi", priority: 8 },
  { category: "payment", question: "Làm sao biết đã thanh toán thành công?", answer: "Sau khi thanh toán, bạn sẽ nhận email xác nhận. Kiểm tra email hoặc vào 'Đơn hàng' để xem trạng thái.", keywords: ["xac nhan thanh toan", "payment confirmation"], language: "vi", priority: 8 },
  { category: "payment", question: "Thanh toán thất bại phải làm sao?", answer: "Kiểm tra lại thông tin thẻ, đảm bảo đủ số dư. Thử thanh toán lại hoặc dùng phương thức khác. Liên hệ support nếu vẫn lỗi.", keywords: ["thanh toan that bai", "payment failed"], language: "vi", priority: 8 },
  { category: "payment", question: "Có nhận hóa đơn VAT không?", answer: "Có, bạn có thể yêu cầu hóa đơn VAT khi checkout hoặc sau khi đặt hàng. Hóa đơn sẽ được gửi qua email.", keywords: ["hoa don VAT", "VAT invoice", "billing"], language: "vi", priority: 7 },

  // ============================================
  // ORDER - ĐƠN HÀNG (60+ items)
  // ============================================
  { category: "order", question: "Cách đặt hàng?", answer: "Chọn sản phẩm → Thêm vào giỏ → Vào giỏ hàng → Chọn địa chỉ giao hàng → Chọn phương thức thanh toán → Xác nhận đơn.", keywords: ["dat hang", "mua hang", "order", "checkout", "mua"], language: "vi", priority: 10 },
  { category: "order", question: "Làm sao theo dõi đơn hàng?", answer: "Vào 'Tài khoản' > 'Đơn hàng', chọn đơn cần xem. Mỗi đơn có tracking number để theo dõi trên website vận chuyển.", keywords: ["theo doi don hang", "order tracking", "tracking number"], language: "vi", priority: 10 },
  { category: "order", question: "Mã đơn hàng ở đâu?", answer: "Mã đơn hàng (Order ID) có trong email xác nhận đơn hàng và trong phần 'Đơn hàng' trên tài khoản của bạn.", keywords: ["ma don hang", "order ID", "order number"], language: "vi", priority: 9 },
  { category: "order", question: "Tôi có thể hủy đơn hàng không?", answer: "Bạn có thể hủy đơn trước khi được xác nhận giao hàng. Vào 'Đơn hàng' > chọn 'Hủy'. Nếu đã giao, liên hệ support.", keywords: ["huy don hang", "cancel order"], language: "vi", priority: 9 },
  { category: "order", question: "Đơn hàng đang xử lý nghĩa là gì?", answer: "Đơn hàng đang xử lý nghĩa là chúng tôi đã nhận được đơn và đang chuẩn bị hàng. Thường mất 1-2 ngày làm việc.", keywords: ["dang xu ly", "processing"], language: "vi", priority: 8 },
  { category: "order", question: "Đơn hàng đã giao nghĩa là gì?", answer: "Đơn hàng đã giao nghĩa là đã được chuyển cho đơn vị vận chuyển. Bạn có thể theo dõi qua tracking number.", keywords: ["da giao", "shipped"], language: "vi", priority: 8 },
  { category: "order", question: "Đơn hàng bị delayed phải làm sao?", answer: "Liên hệ support ngay để được kiểm tra. Chúng tôi sẽ đối phó với đơn vị vận chuyển để đẩy nhanh hoặc hoàn tiền nếu cần.", keywords: ["don hang tre", "delay", "cham"], language: "vi", priority: 8 },
  { category: "order", question: "Tôi có thể thêm sản phẩm vào đơn đã đặt không?", answer: "Không thể thêm sau khi đã xác nhận. Bạn cần đặt đơn mới.", keywords: ["them san pham", "add to order"], language: "vi", priority: 7 },
  { category: "order", question: "Đơn hàng bị thiếu sản phẩm?", answer: "Liên hệ support ngay với mã đơn và hình ảnh. Chúng tôi sẽ kiểm tra và hoàn tiền hoặc gửi bổ sung sản phẩm thiếu.", keywords: ["thieu san pham", "missing item"], language: "vi", priority: 9 },
  { category: "order", question: "Tôi có thể đổi sản phẩm không?", answer: "Có thể đổi nếu sản phẩm còn nguyên vẹn, chưa mở. Liên hệ support trong 7 ngày để yêu cầu đổi.", keywords: ["doi san pham", "exchange"], language: "vi", priority: 8 },

  // ============================================
  // RETURN/REFUND - ĐỔI TRẢ/HOÀN TIỀN (40+ items)
  // ============================================
  { category: "return", question: "Chính sách đổi trả?", answer: "Bạn có thể đổi/trả trong 7 ngày nếu sản phẩm bị lỗi, hư hỏng, hoặc không đúng mô tả. Sản phẩm còn nguyên vẹn, chưa mở.", keywords: ["doi tra", "return policy", "chinh sach"], language: "vi", priority: 10 },
  { category: "return", question: "Làm sao để yêu cầu hoàn tiền?", answer: "Vào 'Đơn hàng' > chọn đơn > 'Yêu cầu hoàn tiền' hoặc liên hệ support. Hoàn tiền trong 5-7 ngày làm việc.", keywords: ["hoan tien", "refund", "tra tien"], language: "vi", priority: 10 },
  { category: "return", question: "Sản phẩm bị hư trong quá trình vận chuyển?", answer: "Chụp ảnh sản phẩm hư và gửi cho support. Chúng tôi sẽ hoàn tiền hoặc gửi sản phẩm thay thế.", keywords: ["hu trong van chuyen", "damaged shipping"], language: "vi", priority: 10 },
  { category: "return", question: "Ai chịu phí vận chuyển khi đổi trả?", answer: "Nếu lỗi từ LIKEFOOD (sai sản phẩm, hư hỏng), chúng tôi chịu phí. Nếu đổi ý, khách chịu phí.", keywords: ["phi doi tra", "return shipping fee"], language: "vi", priority: 9 },
  { category: "return", question: "Hoàn tiền mất bao lâu?", answer: "Hoàn tiền trong 5-7 ngày làm việc sau khi xác nhận. Thời gian cục bộ còn tùy ngân hàng (thêm 2-3 ngày).", keywords: ["thoi gian hoan tien", "refund time"], language: "vi", priority: 9 },
  { category: "return", question: "Đổi trả có cần hóa đơn không?", answer: "Có, bạn cần giữ hóa đơn hoặc mã đơn hàng để xác minh. Nếu không có, vẫn có thể xử lý nếu có tài khoản mua hàng.", keywords: ["hoa don", "invoice"], language: "vi", priority: 8 },
  { category: "return", question: "Sản phẩm đã mở có đổi được không?", answer: "Sản phẩm đã mở chỉ đổi được nếu bị lỗi chất lượng. Đổi ý không áp dụng cho sản phẩm đã sử dụng.", keywords: ["da mo", "opened"], language: "vi", priority: 8 },

  // ============================================
  // ACCOUNT - TÀI KHOẢN (40+ items)
  // ============================================
  { category: "account", question: "Cách đăng ký tài khoản?", answer: "Nhấn 'Đăng ký', nhập email, mật khẩu, và thông tin cá nhân. Xác nhận qua email là xong.", keywords: ["dang ky", "dang ki", "register", "sign up"], language: "vi", priority: 10 },
  { category: "account", question: "Quên mật khẩu làm sao?", answer: "Nhấn 'Quên mật khẩu' tại trang đăng nhập, nhập email. Bạn sẽ nhận link đặt lại mật khẩu qua email.", keywords: ["quen mat khau", "forgot password", "reset password"], language: "vi", priority: 10 },
  { category: "account", question: "Cách đăng nhập?", answer: "Nhập email và mật đã đăng ký tại 'Đăng nhập'. Hoặc đăng nhập nhanh qua Google/Facebook.", keywords: ["dang nhap", "login", "sign in"], language: "vi", priority: 10 },
  { category: "account", question: "Làm sao cập nhật thông tin cá nhân?", answer: "Vào 'Tài khoản' > 'Hồ sơ' để cập nhật tên, địa chỉ, số điện thoại, email.", keywords: ["cap nhat thong tin", "update profile"], language: "vi", priority: 9 },
  { category: "account", question: "Có thể thay đổi email không?", answer: "Có, vào 'Tài khoản' > 'Hồ sơ'. Email mới sẽ cần xác nhận. Lịch sử đơn hàng sẽ được giữ.", keywords: ["doi email", "change email"], language: "vi", priority: 8 },
  { category: "account", question: "Xóa tài khoản được không?", answer: "Liên hệ support để yêu cầu xóa tài khoản. Dữ liệu sẽ được xóa theo chính sách bảo mật.", keywords: ["xoa tai khoan", "delete account"], language: "vi", priority: 7 },
  { category: "account", question: "Tại sao không nhận được email xác nhận?", answer: "Kiểm folder Spam/Junk. Nếu vẫn không có, liên hệ support hoặc đổi email khác.", keywords: ["khong nhan duoc email", "email not received"], language: "vi", priority: 8 },

  // ============================================
  // PROMOTION - KHUYẾN MÃI (40+ items)
  // ============================================
  { category: "promotion", question: "Có coupon giảm giá không?", answer: "Có! LIKEFOOD thường xuyên có coupon giảm 10%, 15%, 20%. Theo dõi email và fanpage để nhận mã mới nhất.", keywords: ["coupon", "voucher", "giam gia", "discount", "ma giam gia"], language: "vi", priority: 10 },
  { category: "promotion", question: "Cách sử dụng coupon?", answer: "Nhập mã coupon tại bước 'Thanh toán' trong giỏ hàng, sau đó nhấn 'Áp dụng' để giảm giá.", keywords: ["su dung coupon", "apply coupon", "nhap ma"], language: "vi", priority: 10 },
  { category: "promotion", question: "Coupon có thể dùng mấy lần?", answer: "Mỗi coupon chỉ dùng 1 lần cho 1 đơn hàng, trừ một số coupon đặc biệt có thể dùng nhiều lần (sẽ ghi rõ).", keywords: ["coupon su dung may lan", "one time coupon"], language: "vi", priority: 9 },
  { category: "promotion", question: "Tại sao coupon không áp dụng được?", answer: "Coupon có thể không áp dụng nếu: đơn chưa đủ giá trị tối thiểu, sản phẩm không nằm trong danh mục, hoặc đã hết hạn.", keywords: ["coupon khong ap dung", "coupon not valid"], language: "vi", priority: 9 },
  { category: "promotion", question: "Có chương trình tích điểm không?", answer: "Có! Mỗi $1 mua hàng tích 1 điểm. Điểm đổi coupon giảm giá hoặc quà tặng. Xem chi tiết trong 'Tài khoản'.", keywords: ["tich diem", "loyalty points", "reward"], language: "vi", priority: 9 },
  { category: "promotion", question: "Flash sale là gì?", answer: "Flash sale là chương trình giảm giá sốc trong thời gian ngắn (vài giờ). Thường giảm 30-50% cho một số sản phẩm.", keywords: ["flash sale", "giam gia soc", "sale"], language: "vi", priority: 9 },
  { category: "promotion", question: "Làm sao biết khi nào có sale?", answer: "Theo dõi email đăng ký, fanpage Facebook, hoặc bật thông báo trên website để nhận tin sớm nhất.", keywords: ["thong bao sale", "sale notification"], language: "vi", priority: 8 },

  // ============================================
  // PRODUCT DETAILS - CHI TIẾT SẢN PHẨM (50+ items)
  // ============================================
  { category: "product", question: "Sản phẩm có hạn sử dụng không?", answer: "Mỗi sản phẩm có hạn sử dụng (expired date) in trên bao bì. Thường 6-24 tháng tùy loại.", keywords: ["han su dung", "han dung", "expired", "expiry"], language: "vi", priority: 10 },
  { category: "product", question: "Cách bảo quản sản phẩm?", answer: "Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Sản phẩm đông lạnh cần bảo quản trong tủ lạnh.", keywords: ["bao quan", "storage", "cach dung"], language: "vi", priority: 10 },
  { category: "product", question: "Sản phẩm có nguồn gốc ở đâu?", answer: "Tất cả sản phẩm được nhập trực tiếp từ Việt Nam, có giấy tờ kiểm tra chất lượng. Chi tiết xem trên trang sản phẩm.", keywords: ["nguon goc", "xuat xu", "origin", "made in"], language: "vi", priority: 9 },
  { category: "product", question: "Có thành phần dinh dưỡng không?", answer: "Mỗi sản phẩm có bảng dinh dưỡng in trên bao bì. Xem chi tiết trên trang sản phẩm.", keywords: ["thanh phan dinh duong", "nutrition", "calorie"], language: "vi", priority: 9 },
  { category: "product", question: "Sản phẩm có chất bảo quản không?", answer: "Chúng tôi ưu tiên sản phẩm tự nhiên, ít hoặc không chất bảo quản. Xem chi tiết thành phần trên trang sản phẩm.", keywords: ["chat bao quan", "preservative", "additive"], language: "vi", priority: 8 },
  { category: "product", question: "Có sản phẩm organic/hữu cơ không?", answer: "Một số sản phẩm có chứng nhận organic. Tìm kiếm 'organic' hoặc xem trên trang chi tiết sản phẩm.", keywords: ["organic", "huu co", "natural"], language: "vi", priority: 8 },
  { category: "product", question: "Sản phẩm có halal không?", answer: "Không phải tất cả đều halal. Một số sản phẩm thịt có thể không halal. Xem chi tiết trên trang sản phẩm hoặc hỏi support.", keywords: ["halal", "kosher"], language: "vi", priority: 7 },
  { category: "product", question: "Sản phẩm có gluten không?", answer: "Một số bánh và snack có chứa gluten. Xem 'Thành phần' trên trang sản phẩm. Có ký hiệu 'GF' (gluten-free) nếu không có.", keywords: ["gluten", "gluten free"], language: "vi", priority: 8 },
  { category: "product", question: "Có sản phẩm cho người ăn chay không?", answer: "Có nhiều sản phẩm chay: trà, cà phê, gia vị, bánh, mứt, hoa quả sấy, hạt. Tìm 'chay' hoặc 'vegan'.", keywords: ["chay", "vegan", "vegetarian"], language: "vi", priority: 8 },
  { category: "product", question: "Sản phẩm có hàng trong kho không?", answer: "Hệ thống hiển thị tình trạng tồn kho thời gian thực. Nếu 'Hết hàng', bạn có thể đặt trước (pre-order) hoặc chờ hàng về.", keywords: ["ton kho", "con hang", "in stock", "out of stock"], language: "vi", priority: 9 },

  // ============================================
  // USAGE - CÁCH SỬ DỤNG (30+ items)
  // ============================================
  { category: "usage", question: "Cách pha trà ngon?", answer: "Pha trà với nước sôi 80-90°C, ngâm 3-5 phút tùy loại. Trà sen nên pha với nước ấm 70°C để giữ hương.", keywords: ["pha tra", "cach pha", "brew tea"], language: "vi", priority: 9 },
  { category: "usage", question: "Cách pha cà phê phin?", answer: "Cho cà phê vào phin, đổ nước sôi từ từ, chờ 5-10 phút. Có thể thêm đường, sữa tùy khẩu.", keywords: ["pha ca phe", "phin", "brew coffee"], language: "vi", priority: 9 },
  { category: "usage", question: "Cách nấu canh chua?", answer: "Nấu nước với me, cà chua, thêm cá hoặc tôm, nêm gia vị. Mắm cá khô (cá lóc) cho vào để nồi canh thơm hơn.", keywords: ["nau canh chua", "canh chua"], language: "vi", priority: 8 },
  { category: "usage", question: "Cách làm nem chua rán?", answer: "Nem chua thái lát, chiên vàng giòn trong dầu nóng. Chấm tương ớt hoặc nước mắm ngọt.", keywords: ["nem chua ran", "fried nem"], language: "vi", priority: 8 },
  { category: "usage", question: "Cách sử dụng nước mắm?", answer: "Dùng làm nước chấm, nấu canh, kho thịt, nêm nấu các món Việt. Pha với đường, chanh, ớt để có nước chấm ngon.", keywords: ["cach dung nuoc mam", "fish sauce usage"], language: "vi", priority: 8 },
  { category: "usage", question: "Cách bảo quản trà lâu?", answer: "Đựng trong hộp kín, nơi mát, tránh ánh sáng và ẩm. Không để trong tủ lạnh (dễ ẩm).", keywords: ["bao quan tra", "store tea"], language: "vi", priority: 8 },
  { category: "usage", question: "Cách bảo quản cà phê?", answer: "Đựng trong hộp kín, tránh ánh sáng và không khí. Cà phê rang xay nên dùng trong 2-4 tuần để giữ hương vị.", keywords: ["bao quan ca phe", "store coffee"], language: "vi", priority: 8 },

  // ============================================
  // NUTRITION - DINH DƯỠNG (20+ items)
  // ============================================
  { category: "nutrition", question: "Trà có caffeine không?", answer: "Có, trà chứa caffeine nhưng ít hơn cà phê. Trà xanh: 20-45mg/tách. Trà đen: 40-70mg/tách. Trà thảo mộc: không caffeine.", keywords: ["caffeine", "cafein", "tra co cafein"], language: "vi", priority: 9 },
  { category: "nutrition", question: "Cà phê có bao nhiêu calorie?", answer: "Cà phê đen không đường: 2-5 calorie/tách. Thêm sữa, đường sẽ tăng thêm. Xem chi tiết trên bao bì.", keywords: ["calorie ca phe", "coffee calories"], language: "vi", priority: 8 },
  { category: "nutrition", question: "Nước mắm có sodium cao không?", answer: "Nước mắm chứa natri (muối). Một số loại có thêm đường. Người ăn kiêng nên dùng với lượng vừa phải.", keywords: ["sodium", "muoi", "natri"], language: "vi", priority: 7 },
  { category: "nutrition", question: "Cá khô có chất béo không?", answer: "Cá khô có protein cao, ít chất béo. Một số loại có thể tẩm gia vị (có thể thêm đường, muối).", keywords: ["chat beo", "protein", "dried fish nutrition"], language: "vi", priority: 7 },

  // ============================================
  // ALLERGY - DỊ ỨNG (15+ items)
  // ============================================
  { category: "allergy", question: "Có peanut (đậu phộng) trong sản phẩm không?", answer: "Một số kẹo, snack có thể chứa peanut. Xem 'Thành phần' trên trang sản phẩm. Có cảnh báo 'May contain peanuts'.", keywords: ["peanut", "đậu phộng", "dau phong", "allergy"], language: "vi", priority: 9 },
  { category: "allergy", question: "Có gluten trong bánh không?", answer: "Hầu hết bánh Việt Nam có bột mì (chứa gluten). Tìm sản phẩm 'gluten-free' nếu cần.", keywords: ["gluten", "bot mi", "allergy"], language: "vi", priority: 8 },
  { category: "allergy", question: "Người dị ứng hải sản cần lưu ý gì?", answer: "Một số sản phẩm được chế biến trên cùng dây chuyền với hải sản. Xem cảnh báo trên bao bì.", keywords: ["di ung hai san", "seafood allergy"], language: "vi", priority: 8 },

  // ============================================
  // BULK/CORPORATE - MUA SỈ/TỔ CHỨC (15+ items)
  // ============================================
  { category: "bulk", question: "Có mua sỉ (buôn) được không?", answer: "Có! LIKEFOOD hỗ trợ mua sỉ với giá ưu đãi. Liên hệ qua email sales@likefood.com hoặc điền form mua sỉ trên website.", keywords: ["mua si", "wholesale", "buon"], language: "vi", priority: 9 },
  { category: "bulk", question: "Có order cho nhà hàng không?", answer: "Có, chúng tôi phục vụ nhà hàng, quán cà phê, khách sạn với giá sỉ và giao hàng định kỳ. Liên hệ để được tư vấn.", keywords: ["nha hang", "restaurant", "business"], language: "vi", priority: 8 },
  { category: "bulk", question: "Có cho tổ chức sự kiện không?", answer: "Có, cung cấp sản phẩm cho sự kiện, hội chợ, tiệc với số lượng lớn. Liên hệ để báo giá và lên kế hoạch.", keywords: ["su kien", "event", "corporate"], language: "vi", priority: 8 },

  // ============================================
  // SUPPORT - HỖ TRỢ (30+ items)
  // ============================================
  { category: "support", question: "Làm sao liên hệ support?", answer: "Gọi điện: +1 402-315-8105. Email: tranquocvu3011@gmail.com. Chat trực tiếp trên website. Fanpage Facebook.", keywords: ["lien he", "contact", "support", "hotline"], language: "vi", priority: 10 },
  { category: "support", question: "Giờ làm việc của support?", answer: "Support hoạt động 24/7 cho đơn hàng khẩn. Tư vấn thường: 8AM-10PM EST, Thứ 2 - Chủ Nhật.", keywords: ["gio lam viec", "working hours"], language: "vi", priority: 9 },
  { category: "support", question: "Có chat trực tiếp không?", answer: "Có, bạn có thể chat với tư vấn viên bằng cách nhấn nút chat góc phải màn hình. Hỗ trợ 24/7.", keywords: ["chat", "live chat"], language: "vi", priority: 9 },
  { category: "support", question: "Phản hồi khiếu nại ở đâu?", answer: "Gửi email tranquocvu3011@gmail.com với mã đơn và mô tả vấn đề. Chúng tôi phản hồi trong 24 giờ.", keywords: ["phai ho", "khieu nai", "complaint"], language: "vi", priority: 9 },
  { category: "support", question: "Có hỗ trợ tiếng Việt không?", answer: "Có, support có thể nói tiếng Việt và tiếng Anh. Chọn ngôn ngữ ưa thích khi liên hệ.", keywords: ["tieng Viet", "Vietnamese support"], language: "vi", priority: 9 },

  // ============================================
  // GENERAL - CHUNG (40+ items)
  // ============================================
  { category: "general", question: "LIKEFOOD là gì?", answer: "LIKEFOOD là cửa hàng online chuyên đặc sản Việt Nam tại Mỹ. Chúng tôi mang đến các sản phẩm trà, cà phê, hải sản khô, gia vị, bánh kẹo, quà biếu chất lượng cao.", keywords: ["likefood", "gioi thieu", "about", "ve chung toi"], language: "vi", priority: 10 },
  { category: "general", question: "Tại sao chọn LIKEFOOD?", answer: "1) Sản phẩm 100% nhập từ Việt Nam. 2) Kiểm tra chất lượng nghiêm ngặt. 3) Giao hàng nhanh toàn Mỹ. 4) Hỗ trợ tận tâm. 5) Đổi trả dễ dàng.", keywords: ["tai sao likefood", "why choose"], language: "vi", priority: 9 },
  { category: "general", question: "Có cửa hàng (showroom) không?", answer: "Có! LIKEFOOD có cửa hàng tại Omaha, NE 68136, United States. Bạn có thể đến mua trực tiếp hoặc đặt online và nhận tại cửa hàng.", keywords: ["showroom", "cua hang", "store"], language: "vi", priority: 8 },
  { category: "general", question: "Có app mobile không?", answer: "Có, tải LIKEFOOD App trên App Store (iOS) và Google Play (Android) để mua sắm tiện lợi hơn.", keywords: ["app", "mobile app", "download"], language: "vi", priority: 8 },
  { category: "general", question: "Có chương trình affiliate không?", answer: "Có, tham gia chương trình affiliate kiếm hoa hồng 10% mỗi đơn giới thiệu. Đăng ký tại affiliate.likefood.com.", keywords: ["affiliate", "gioi thieu ban hang"], language: "vi", priority: 7 },
  { category: "general", question: "Làm sao để trở thành đối tác?", answer: "Gửi email partnership@likefood.com với thông tin. Chúng tôi hợp tác với nhà cung cấp, nhà phân phối, và đơn vị vận chuy�.", keywords: ["doi tac", "partner", "business partnership"], language: "vi", priority: 7 },

  // ============================================
  // MEMBERSHIP - THÀNH VIÊN (15+ items)
  // ============================================
  { category: "membership", question: "Đăng ký thành viên có lợi gì?", answer: "Thành viên được: tích điểm (1$=1 điểm), giảm giá độc quyền, free shipping mọi đơn, ưu tiên dịp sale, quà sinh nhật.", keywords: ["thanh vien", "membership", "member"], language: "vi", priority: 9 },
  { category: "membership", question: "Các cấp bậc thành viên?", answer: "Có 3 cấp: Bronze (miễn phí), Silver ($99/năm - thêm 5% giảm), Gold ($199/năm - thêm 10% giảm + ưu tiên).", keywords: ["cap bac", "tier", "bronze", "silver", "gold"], language: "vi", priority: 8 },
  { category: "membership", question: "Điểm thưởng đổi được gì?", answer: "Điểm đổi coupon giảm giá ($5=100 điểm), sản phẩm miễn phí, hoặc upgade membership. Xem trong 'Tài khoản'.", keywords: ["diem thuong", "doi diem", "redeem points"], language: "vi", priority: 8 },
  { category: "membership", question: "Làm sao đạt Silver/Gold?", answer: "Silver: Mua sắm tích lũy $500/năm. Gold: Mua sắm tích lũy $1500/năm. Hoặc đóng phí nâng cấp.", keywords: ["nang cap", "upgrade membership"], language: "vi", priority: 7 },

  // ============================================
  // GIFT - QUÀ TẶNG (20+ items)
  // ============================================
  { category: "gift", question: "Có gói quà tặng không?", answer: "Có, LIKEFOOD có dịch vụ gói quà tặng với nhiều kiểu: hộp giấy, hộp gỗ, túi vải. Thêm phí $3-$10 tùy kiểu.", keywords: ["goi qua tang", "gift wrapping"], language: "vi", priority: 9 },
  { category: "gift", question: "Có thể gửi quà trực tiếp cho người nhận không?", answer: "Có, chọn 'Giao quà tặng' khi checkout. Nhập địa chỉ người nhận và ghi lời chúc. Người nhận sẽ không biết giá.", keywords: ["gui qua", "gift delivery"], language: "vi", priority: 9 },
  { category: "gift", question: "Có thể bỏ hóa đơn giá không?", answer: "Có, khi giao quà tặng, bạn có thể chọn 'Không gửi hóa đơn' để người nhận không biết giá sản phẩm.", keywords: ["an hoa don", "hide price"], language: "vi", priority: 8 },
  { category: "gift", question: "Quà Tết có những gì?", answer: "Set quà Tết: combo trà + bánh, hải sản + gia vị, hộp cao cấp. Có nhiều mức giá từ $29-$199. Đặt sớm để được giao đúng Tết.", keywords: ["qua tet", "tet holiday gift"], language: "vi", priority: 9 },

  // ============================================
  // ENGLISH - TƯƠNG ĐƯƠNG TIẾNG ANH (150+ items)
  // ============================================
  { category: "product", question: "What types of tea do you have?", answer: "LIKEFOOD offers many Vietnamese specialty teas: lotus tea, jasmine tea, lemon tea, ginger tea, artichoke tea, oolong tea, green tea. Check product pages for details.", keywords: ["tea", "lotus tea", "jasmine tea", "oolong"], language: "en", priority: 10 },
  { category: "product", question: "What coffee options are available?", answer: "We have ground coffee, instant coffee, Vietnamese phin coffee, espresso, robusta, arabica. Both sweetened and unsweetened varieties.", keywords: ["coffee", "espresso", "robusta", "arabica", "instant"], language: "en", priority: 10 },
  { category: "product", question: "Do you have dried seafood?", answer: "Yes! We have dried fish (multiple types), dried shrimp, dried squid, dried clams. Great for cooking or snacking.", keywords: ["dried fish", "dried shrimp", "dried squid", "seafood"], language: "en", priority: 10 },
  { category: "product", question: "What Vietnamese spices do you sell?", answer: "Fish sauce, fermented shrimp paste, soy sauce, chili sauce, dried shallots, garlic, turmeric powder, curry powder, lemongrass.", keywords: ["spices", "fish sauce", "nuoc mam", "condiments"], language: "en", priority: 10 },
  { category: "product", question: "Do you have Vietnamese snacks?", answer: "Yes! Rice crackers, dried fruit, jerky (beef, pork, chicken), nuts, candy, chocolates, and many more traditional snacks.", keywords: ["snacks", "vietnamese snacks", "chips", "candy"], language: "en", priority: 9 },
  { category: "product", question: "What gift sets do you offer?", answer: "We have various gift sets: tea + cake combos, seafood + spice combos, premium gift boxes, traditional Tet gift boxes.", keywords: ["gift set", "gift box", "tet gift", "present"], language: "en", priority: 9 },
  { category: "shipping", question: "How much is shipping?", answer: "Shipping fees vary by location and weight. Standard: $5-$15. Express: $15-$30. Free standard shipping for orders $99+. Exact cost shown at checkout.", keywords: ["shipping cost", "delivery fee", "shipping price"], language: "en", priority: 10 },
  { category: "shipping", question: "Do you offer free shipping?", answer: "Yes! Free standard shipping (5-7 days) for orders $99+. Free express shipping (2-3 days) for orders $199+.", keywords: ["free shipping", "freeship"], language: "en", priority: 10 },
  { category: "shipping", question: "How long does delivery take?", answer: "Standard: 5-7 business days. Express: 2-3 business days. Delivery time may vary by location and holidays.", keywords: ["delivery time", "how long", "shipping time"], language: "en", priority: 10 },
  { category: "shipping", question: "Do you ship internationally?", answer: "Currently we ship within the USA only. We are working on expanding to Canada and other countries soon.", keywords: ["international shipping", "ship abroad"], language: "en", priority: 9 },
  { category: "payment", question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, Google Pay, and COD (cash on delivery).", keywords: ["payment", "pay", "credit card", "visa", "paypal", "cod"], language: "en", priority: 10 },
  { category: "payment", question: "Is payment secure?", answer: "Very secure! We use Stripe (PCI-DSS compliant) for payments. Your card information is never stored on LIKEFOOD systems.", keywords: ["secure payment", "safe payment", "stripe"], language: "en", priority: 9 },
  { category: "payment", question: "What is COD?", answer: "COD (Cash On Delivery) means you pay when the package arrives. Pay the driver directly upon delivery.", keywords: ["cod", "cash on delivery"], language: "en", priority: 9 },
  { category: "order", question: "How do I place an order?", answer: "Select product → Add to cart → View cart → Enter shipping address → Choose payment method → Confirm order.", keywords: ["place order", "order", "buy", "checkout"], language: "en", priority: 10 },
  { category: "order", question: "How can I track my order?", answer: "Go to 'Account' > 'Orders', select the order. Each order has a tracking number you can track on the carrier website.", keywords: ["track order", "order tracking", "tracking"], language: "en", priority: 10 },
  { category: "order", question: "Can I cancel my order?", answer: "You can cancel before it ships. Go to 'Orders' > select 'Cancel'. If already shipped, please contact support.", keywords: ["cancel order", "cancel"], language: "en", priority: 9 },
  { category: "return", question: "What is your return policy?", answer: "You can return within 7 days if product is defective, damaged, or not as described. Product must be unopened and in original condition.", keywords: ["return", "return policy", "refund"], language: "en", priority: 10 },
  { category: "return", question: "How do I get a refund?", answer: "Go to 'Orders' > select order > 'Request Refund' or contact support. Refunds are processed within 5-7 business days.", keywords: ["refund", "money back", "reimbursement"], language: "en", priority: 10 },
  { category: "return", question: "Product arrived damaged. What to do?", answer: "Take photos of the damaged product and contact support immediately. We'll refund or send a replacement.", keywords: ["damaged", "broken", "defective"], language: "en", priority: 10 },
  { category: "account", question: "How do I create an account?", answer: "Click 'Sign Up', enter your email, password, and personal information. Confirm via email to complete registration.", keywords: ["register", "sign up", "create account"], language: "en", priority: 10 },
  { category: "account", question: "Forgot password. How to reset?", answer: "Click 'Forgot Password' on login page, enter your email. You'll receive a link to reset your password.", keywords: ["forgot password", "reset password"], language: "en", priority: 10 },
  { category: "promotion", question: "Do you have discount coupons?", answer: "Yes! LIKEFOOD frequently has coupons for 10%, 15%, 20% off. Subscribe to email and follow our fanpage for the latest codes.", keywords: ["coupon", "discount", "voucher", "promo code"], language: "en", priority: 10 },
  { category: "promotion", question: "How do I use a coupon?", answer: "Enter coupon code at checkout in your cart, then click 'Apply' to redeem the discount.", keywords: ["apply coupon", "use coupon", "redeem code"], language: "en", priority: 10 },
  { category: "promotion", question: "What is Flash Sale?", answer: "Flash Sale is a limited-time big discount event (usually a few hours). Often 30-50% off selected items.", keywords: ["flash sale", "sale", "discount event"], language: "en", priority: 9 },
  { category: "promotion", question: "Do you have a loyalty program?", answer: "Yes! Earn 1 point per $1 spent. Points can be redeemed for discount coupons or gifts. Check 'Account' for details.", keywords: ["loyalty", "points", "rewards", "membership"], language: "en", priority: 9 },
  { category: "product", question: "What is the shelf life?", answer: "Each product has an expiration date on the packaging. Usually 6-24 months depending on the product type.", keywords: ["expiration", "expired", "shelf life", "best before"], language: "en", priority: 9 },
  { category: "product", question: "How should I store the products?", answer: "Store in a dry, cool place, away from direct sunlight. Frozen products should be kept in the freezer.", keywords: ["storage", "store", "keep"], language: "en", priority: 9 },
  { category: "product", question: "Where are products sourced from?", answer: "All products are imported directly from Vietnam with quality inspection certificates. Check product pages for details.", keywords: ["origin", "sourced from", "made in"], language: "en", priority: 9 },
  { category: "product", question: "Do you have nutrition information?", answer: "Each product has a nutrition label on the packaging. Check product pages for detailed nutritional information.", keywords: ["nutrition", "calories", "nutritional info"], language: "en", priority: 8 },
  { category: "product", question: "Are products organic?", answer: "Some products are certified organic. Search 'organic' or check product details for certification.", keywords: ["organic", "natural"], language: "en", priority: 8 },
  { category: "product", question: "Do you have vegetarian options?", answer: "Yes! Many tea, coffee, spices, candy, dried fruit, and nuts are vegetarian-friendly. Search 'vegetarian' or 'vegan'.", keywords: ["vegetarian", "vegan", "plant based"], language: "en", priority: 8 },
  { category: "product", question: "Is the product in stock?", answer: "Our system shows real-time inventory. If 'Out of Stock', you can pre-order or wait for restocking.", keywords: ["in stock", "out of stock", "available"], language: "en", priority: 9 },
  { category: "usage", question: "How to brew tea properly?", answer: "Brew tea with water at 80-90°C, steep for 3-5 minutes depending on type. Lotus tea brews best at 70°C to preserve fragrance.", keywords: ["brew tea", "make tea", "tea brewing"], language: "en", priority: 9 },
  { category: "usage", question: "How to use Vietnamese fish sauce?", answer: "Use as a condiment for dipping, cooking soups, braising meats. Mix with sugar, lime, and chili for a great dipping sauce.", keywords: ["fish sauce usage", "nuoc mam"], language: "en", priority: 8 },
  { category: "support", question: "How can I contact support?", answer: "Call: +1 402-315-8105. Email: tranquocvu3011@gmail.com. Live chat on website. Facebook fanpage.", keywords: ["contact", "support", "help", "customer service"], language: "en", priority: 10 },
  { category: "support", question: "What are your support hours?", answer: "Support for urgent orders: 24/7. General inquiry: 8AM-10PM EST, Monday-Sunday.", keywords: ["support hours", "customer service hours"], language: "en", priority: 9 },
  { category: "support", question: "Do you have live chat?", answer: "Yes! Click the chat button on the bottom right. Support is available 24/7 for quick help.", keywords: ["live chat", "chat support"], language: "en", priority: 9 },
  { category: "support", question: "How to file a complaint?", answer: "Email tranquocvu3011@gmail.com with order ID and description. We respond within 24 hours.", keywords: ["complaint", "feedback", "report issue"], language: "en", priority: 9 },
  { category: "support", question: "Do you offer Vietnamese support?", answer: "Yes, support is available in both Vietnamese and English. Choose your preferred language when contacting.", keywords: ["vietnamese support", "tieng viet"], language: "en", priority: 9 },
  { category: "general", question: "What is LIKEFOOD?", answer: "LIKEFOOD is an online store specializing in Vietnamese specialty products in the USA. We bring tea, coffee, dried seafood, spices, snacks, and gifts.", keywords: ["about", "likefood", "who we are"], language: "en", priority: 10 },
  { category: "general", question: "Why choose LIKEFOOD?", answer: "1) 100% imported from Vietnam. 2) Strict quality control. 3) Fast shipping across USA. 4) Dedicated support. 5) Easy returns.", keywords: ["why choose", "benefits"], language: "en", priority: 9 },
  { category: "general", question: "Do you have a physical store?", answer: "Yes! LIKEFOOD has a store in Omaha, NE 68136, United States. You can visit us to shop in person or place an order online for store pickup.", keywords: ["store", "showroom", "physical location"], language: "en", priority: 8 },
  { category: "general", question: "Do you have a mobile app?", answer: "Yes! Download LIKEFOOD App from App Store (iOS) and Google Play (Android) for easier shopping.", keywords: ["app", "mobile app", "download"], language: "en", priority: 8 },
  { category: "bulk", question: "Do you offer wholesale?", answer: "Yes! We support wholesale with discounted prices. Contact sales@likefood.com or fill wholesale form on website.", keywords: ["wholesale", "bulk order", "business"], language: "en", priority: 9 },
  { category: "bulk", question: "Do you supply restaurants?", answer: "Yes, we serve restaurants, cafes, hotels with wholesale prices and regular delivery. Contact us for consultation.", keywords: ["restaurant supply", "restaurant", "business"], language: "en", priority: 8 },
  { category: "membership", question: "What are membership benefits?", answer: "Members get: point accumulation (1 point per $1), exclusive discounts, free shipping on all orders, priority access to sales, birthday gifts.", keywords: ["membership", "member benefits", "loyalty"], language: "en", priority: 9 },
  { category: "membership", question: "What are membership tiers?", answer: "3 tiers: Bronze (free), Silver ($99/year - +5% off), Gold ($199/year - +10% off + priority).", keywords: ["tier", "bronze", "silver", "gold"], language: "en", priority: 8 },
  { category: "membership", question: "What can I redeem points for?", answer: "Points can be exchanged for discount coupons ($5=100 points), free products, or membership upgrades. Check 'Account'.", keywords: ["redeem points", "points exchange"], language: "en", priority: 8 },
  { category: "gift", question: "Do you offer gift wrapping?", answer: "Yes! We have gift wrapping: paper box, wooden box, fabric bag. Additional fee $3-$10 depending on style.", keywords: ["gift wrapping", "gift package"], language: "en", priority: 9 },
  { category: "gift", question: "Can I send a gift directly to recipient?", answer: "Yes! Select 'Gift Delivery' at checkout. Enter recipient's address and add a personal message. Recipient won't see the price.", keywords: ["gift delivery", "send gift"], language: "en", priority: 9 },
  { category: "gift", question: "Can I hide the price on invoice?", answer: "Yes! When gifting, you can choose 'Hide invoice' so the recipient won't see the product prices.", keywords: ["hide price", "gift invoice"], language: "en", priority: 8 },
  { category: "nutrition", question: "Does tea have caffeine?", answer: "Yes, tea contains caffeine but less than coffee. Green tea: 20-45mg/cup. Black tea: 40-70mg/cup. Herbal tea: caffeine-free.", keywords: ["caffeine", "tea caffeine"], language: "en", priority: 9 },
  { category: "nutrition", question: "How many calories in coffee?", answer: "Black coffee without sugar: 2-5 calories/cup. Adding milk and sugar increases calories. Check packaging for details.", keywords: ["calories", "coffee calories"], language: "en", priority: 8 },
  { category: "allergy", question: "Do you have peanut-free products?", answer: "Some candies and snacks may contain peanuts. Check 'Ingredients' on product pages. Look for 'May contain peanuts' warnings.", keywords: ["peanut", "allergy", "peanut free"], language: "en", priority: 9 },
  { category: "allergy", question: "Are products gluten-free?", answer: "Most Vietnamese cakes contain wheat flour (gluten). Look for 'gluten-free' products if needed.", keywords: ["gluten", "gluten free"], language: "en", priority: 8 },
];

export async function searchKnowledge(
  query: string,
  language?: "vi" | "en",
  limit = 5
): Promise<KnowledgeItem[]> {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const normalizedQuery = query.toLowerCase().trim();
    const results = await prisma.aiKnowledge.findMany({
      where: {
        isActive: true,
        OR: [
          { question: { contains: normalizedQuery } },
          { answer: { contains: normalizedQuery } },
          { keywords: { contains: normalizedQuery } },
        ],
        ...(language ? { language: { in: [language, "both"] } } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    if (results.length > 0) {
      return results.map(formatKnowledge);
    }
    const fallbackResults = await prisma.aiKnowledge.findMany({
      where: {
        isActive: true,
        keywords: {
          contains: normalizedQuery.split(" ").find(w => w.length >= 3) || normalizedQuery,
        },
        ...(language ? { language: { in: [language, "both"] } } : {}),
      },
      orderBy: [{ priority: "desc" }],
      take: limit,
    });
    return fallbackResults.map(formatKnowledge);
  } catch (error) {
    logger.error("searchKnowledge error", error as Error);
    return [];
  }
}

export async function getKnowledgeByCategory(
  category: KnowledgeCategory,
  language?: "vi" | "en",
  limit = 10
): Promise<KnowledgeItem[]> {
  try {
    const results = await prisma.aiKnowledge.findMany({
      where: {
        category,
        isActive: true,
        ...(language ? { language: { in: [language, "both"] } } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return results.map(formatKnowledge);
  } catch (error) {
    logger.error("getKnowledgeByCategory error", error as Error);
    return [];
  }
}

export async function getAnswer(query: string, language: "vi" | "en" = "vi"): Promise<string | null> {
  try {
    const result = await prisma.aiKnowledge.findFirst({
      where: {
        isActive: true,
        OR: [{ question: { contains: query } }, { keywords: { contains: query } }],
        language: { in: [language, "both"] },
      },
      orderBy: { priority: "desc" },
    });

    return result?.answer || null;
  } catch (error) {
    logger.error("getAnswer error", error as Error);
    return null;
  }
}

export async function seedKnowledgeBase(): Promise<void> {
  try {
    const existingCount = await prisma.aiKnowledge.count();
    if (existingCount > 0) {
      logger.info(`Knowledge base already has ${existingCount} items. Skipping seed.`);
      return;
    }
    logger.info(`Seeding ${DEFAULT_KNOWLEDGE.length} knowledge items...`);
    for (const item of DEFAULT_KNOWLEDGE) {
      await prisma.aiKnowledge.create({
        data: {
          id: Number(crypto.randomUUID()),
          category: item.category,
          question: item.question,
          answer: item.answer,
          keywords: item.keywords?.join(","),
          language: item.language,
          priority: item.priority,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }
    logger.info(`Seeded ${DEFAULT_KNOWLEDGE.length} knowledge items successfully.`);
  } catch (error) {
    logger.error("seedKnowledgeBase error", error as Error);
  }
}

function formatKnowledge(item: AiKnowledge): KnowledgeItem {
  return {
    id: item.id,
    category: item.category as KnowledgeCategory,
    question: item.question ?? undefined,
    answer: item.answer,
    keywords: item.keywords ? item.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean) : undefined,
    language: item.language as "vi" | "en" | "both",
    priority: item.priority,
    isActive: item.isActive,
  };
}
