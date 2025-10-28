import dynamic from "next/dynamic";
// import { AnimatedTestimonials } from "@/components/ui/shadcn-io/animated-testimonials";
const testimonials = [
  {
    quote: "招牌菜 口感麻辣鲜香 配料丰富 很下饭",
    name: "宫保鸡丁",
    designation: "中餐 · 热菜",
    src: "/dishes/1.jpg",
  },
  {
    quote: "汤浓味足 牛肉鲜嫩 面条劲道",
    name: "红烧牛肉面",
    designation: "面食 · 牛肉面",
    src: "/dishes/2.jpg",
  },
  {
    quote: "麻辣鲜香 食材丰富 口感层次分明",
    name: "麻辣香锅",
    designation: "川菜 · 香锅",
    src: "/dishes/3.jpg",
  },
  {
    quote: "鲜嫩多汁 外脆内嫩 营养丰富",
    name: "香煎三文鱼",
    designation: "西餐 · 海鲜",
    src: "/dishes/4.jpg",
  },
  {
    quote: "酸甜适口 外酥里嫩 色泽诱人",
    name: "糖醋里脊",
    designation: "家常菜 · 甜酸味",
    src: "/dishes/5.jpg",
  },
  {
    quote: "清香下饭 肉丝细嫩 青椒爽脆",
    name: "青椒肉丝",
    designation: "家常菜 · 热炒",
    src: "/dishes/6.jpg",
  },
];
const AnimatedTestimonials = dynamic(
  () =>
    import("@/components/ui/shadcn-io/animated-testimonials").then(
      (m) => m.AnimatedTestimonials
    ),
  { ssr: false }
);

export default function AnimatedTestimonialsDemo() {
  return <AnimatedTestimonials testimonials={testimonials} />;
}
