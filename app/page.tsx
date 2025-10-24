"use client";
import { BackgroundPaths } from "@/components/ui/shadcn-io/background-paths";
import { useEffect } from "react";

export default function Home() {
  // 禁用滚动（仅在此页挂载期间生效）
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none"; // 防止滚动链（移动端弹性滚动）
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none"; // 禁止触摸平移

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
    };
  }, []);

  return (
    <>
      <BackgroundPaths title="燕山大学智慧食堂" />
    </>
  );
}
