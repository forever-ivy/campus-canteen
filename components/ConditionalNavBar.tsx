"use client";

import { usePathname } from "next/navigation";
import NavaBar from "./NavaBar";

const ConditionalNavBar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // 隐藏导航栏的路径列表
  const hideNavbarPaths = ["/student", "/merchant"];

  const shouldHideNavbar = hideNavbarPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (shouldHideNavbar) {
    return <main>{children}</main>;
  }

  return <NavaBar>{children}</NavaBar>;
};

export default ConditionalNavBar;
