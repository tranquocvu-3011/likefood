/**
 * LIKEFOOD - FAQ Schema SEO Component (Server Component)
 * Renders FAQPage JSON-LD for Google Rich Results
 * Targets: "like food", "likefood", "đặc sản Việt Nam tại Mỹ"
 */

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://likefood.app";

const FAQ_ITEMS = [
  {
    question: "LIKEFOOD (Like Food) là gì?",
    answer: "LIKEFOOD (Like Food) là cửa hàng đặc sản Việt Nam uy tín #1 tại Mỹ. Chuyên cung cấp 100+ sản phẩm chính gốc từ Việt Nam: cá khô miền Tây, tôm khô Cà Mau, mực khô, trái cây sấy, mắm truyền thống, gia vị Việt. Giao hàng nhanh 2-3 ngày toàn nước Mỹ. Website: likefood.app",
  },
  {
    question: "Mua đặc sản Việt Nam ở đâu tại Mỹ?",
    answer: "Bạn có thể mua đặc sản Việt Nam chính gốc tại LIKEFOOD (likefood.app). LIKEFOOD ship toàn nước Mỹ trong 2-3 ngày, miễn phí ship đơn từ $500. Sản phẩm đảm bảo chất lượng FDA, đóng gói cẩn thận. Đặt hàng online 24/7 tại likefood.app.",
  },
  {
    question: "LIKEFOOD có ship toàn nước Mỹ không?",
    answer: "Có! LIKEFOOD giao hàng toàn bộ 50 tiểu bang nước Mỹ. Thời gian giao hàng 2-3 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ $500. Bạn có thể theo dõi đơn hàng real-time trên likefood.app.",
  },
  {
    question: "Các sản phẩm đặc sản Việt Nam bán chạy nhất tại LIKEFOOD là gì?",
    answer: "Top sản phẩm bán chạy tại LIKEFOOD gồm: cá khô miền Tây (khô cá lóc, khô cá sặc, khô cá tra), tôm khô Cà Mau nguyên con, mực khô, khô bò miếng, nước mắm Phú Quốc, trái cây sấy (xoài sấy, mít sấy), và các combo quà biếu đặc sản. Tất cả sản phẩm đều chính gốc từ Việt Nam.",
  },
  {
    question: "LIKEFOOD có chấp nhận thanh toán gì?",
    answer: "LIKEFOOD chấp nhận nhiều phương thức thanh toán: Credit Card, Debit Card, Stripe, Apple Pay, Google Pay. Tất cả giao dịch đều được bảo mật qua Stripe payment gateway. Bạn có thể thanh toán an toàn tại likefood.app.",
  },
  {
    question: "Làm sao để liên hệ LIKEFOOD?",
    answer: "Bạn có thể liên hệ LIKEFOOD qua: Điện thoại +1-402-315-8105, Email tranquocvu3011@gmail.com, hoặc chat trực tiếp với AI trợ lý trên website likefood.app. LIKEFOOD hỗ trợ cả Tiếng Việt và Tiếng Anh, hoạt động 24/7.",
  },
  {
    question: "Chất lượng sản phẩm LIKEFOOD có đảm bảo không?",
    answer: "Tất cả sản phẩm LIKEFOOD đều đạt tiêu chuẩn FDA (Food and Drug Administration) của Mỹ. Sản phẩm được kiểm tra chất lượng nghiêm ngặt, đóng gói hút chân không, và vận chuyển trong điều kiện bảo quản tối ưu. LIKEFOOD cam kết hoàn tiền 100% nếu sản phẩm không đạt chất lượng.",
  },
  {
    question: "LIKEFOOD có chương trình giảm giá không?",
    answer: "Có! LIKEFOOD thường xuyên có Flash Sale giảm giá đến 50%, mã Voucher giảm giá, và combo ưu đãi. Bạn có thể truy cập likefood.app/flash-sale để xem các deal hot nhất. Đăng ký tài khoản để nhận thông báo khuyến mãi đầu tiên.",
  },
];

export default function FAQSchema() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
