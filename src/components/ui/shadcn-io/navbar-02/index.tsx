"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { BookOpenIcon, InfoIcon, LifeBuoyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/ui/shadcn-io/theme-switcher";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

// Simple logo component for the navbar
const Logo = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <img
      src="/ysu-logo.png"
      alt="YSU Logo"
      className="w-16 h-16"
      style={{
        filter:
          "brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(3500%) hue-rotate(210deg) brightness(90%) contrast(105%)",
      }}
      {...props}
    />
  );
};

// Hamburger icon component
const HamburgerIcon = ({
  className,
  ...props
}: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn("pointer-events-none", className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
    />
  </svg>
);

// Types
export interface Navbar02NavItem {
  href?: string;
  label: string;
  submenu?: boolean;
  type?: "description" | "simple" | "icon";
  items?: Array<{
    href: string;
    label: string;
    description?: string;
    icon?: string;
  }>;
}

export interface Navbar02Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar02NavItem[];
  signInText?: string;
  signInHref?: string;
  ctaText?: string;
  ctaHref?: string;
  onSignInClick?: () => void;
  onCtaClick?: () => void;
}

// Default navigation links
const defaultNavigationLinks: Navbar02NavItem[] = [
  { href: "/dashboard", label: "主页" },
  {
    label: "深度分析",
    submenu: true,
    type: "description",
    items: [
      {
        href: "/analytics/menu",
        label: "菜单分析",
        description: "分析菜品销量、销售额和受欢迎程度。",
      },
      {
        href: "/analytics/merchants",
        label: "商家分析",
        description: "评估各档口表现，查看商家排行榜。",
      },
      {
        href: "/analytics/sales",
        label: "销售趋势",
        description: "查看今日、本周、本月的销售趋势图。",
      },
    ],
  },
  { href: "/order", label: "订单管理" },
];

export const Navbar02 = React.forwardRef<HTMLElement, Navbar02Props>(
  (
    {
      className,
      logo = <Logo />,
      logoHref = "/",
      navigationLinks = defaultNavigationLinks,
      signInText = "Sign In",
      signInHref = "#signin",
      ctaText = "Get Started",
      ctaHref = "#get-started",
      onSignInClick,
      onCtaClick,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const router = useRouter();

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const { theme: currentTheme, setTheme: changeTheme } = useTheme();

    return (
      <header
        ref={combinedRef}
        className={cn(
          "sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-5 md:px-6 [&_*]:no-underline ",
          className
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                    variant="ghost"
                    size="icon"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-0">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          {link.submenu ? (
                            <>
                              <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                                {link.label}
                              </div>
                              <ul>
                                {link.items?.map((item, itemIndex) => (
                                  <li key={itemIndex}>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (item.href) {
                                          router.push(item.href);
                                        }
                                      }}
                                      className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                                    >
                                      {item.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (link.href) {
                                  router.push(link.href);
                                }
                              }}
                              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                            >
                              {link.label}
                            </button>
                          )}
                          {/* Add separator between different types of items */}
                          {index < navigationLinks.length - 1 &&
                            ((!link.submenu &&
                              navigationLinks[index + 1].submenu) ||
                              (link.submenu &&
                                !navigationLinks[index + 1].submenu) ||
                              (link.submenu &&
                                navigationLinks[index + 1].submenu &&
                                link.type !==
                                  navigationLinks[index + 1].type)) && (
                              <div
                                role="separator"
                                aria-orientation="horizontal"
                                className="bg-border -mx-1 my-1 h-px w-full"
                              />
                            )}
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Logo */}
            <button
              onClick={(e) => {
                e.preventDefault();
                if (logoHref) {
                  router.push(logoHref);
                }
              }}
              className="flex items-center px-4.5 space-x-2 text-foreground hover:text-primary/90 transition-colors cursor-pointer"
            >
              <div className="text-2xl">{logo}</div>
              <span className="hidden font-bold font-sans text-2xl  mx-5  sm:inline-block px-6 ">
                智慧食堂管理系统
              </span>
            </button>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-6">
            {/* Navigation menu moved to right */}
            {!isMobile && (
              <NavigationMenu className="flex ">
                <NavigationMenuList className="gap-1">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index}>
                      {link.submenu ? (
                        <>
                          <NavigationMenuTrigger>
                            {link.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            {link.type === "description" &&
                            link.label === "深度分析" ? (
                              <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <div className="row-span-3">
                                  <NavigationMenuLink asChild>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        router.push("/analytics");
                                      }}
                                      className="flex h-full w-full select-none flex-col justify-center items-center text-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer"
                                    >
                                      <div className="mb-3 text-xl font-medium">
                                        数据洞察
                                      </div>
                                      <p className="text-sm leading-tight text-muted-foreground">
                                        从多个维度深入分析食堂运营数据，为决策提供支持。
                                      </p>
                                    </button>
                                  </NavigationMenuLink>
                                </div>
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            ) : link.type === "simple" ? (
                              <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            ) : link.type === "icon" ? (
                              <div className="grid w-[400px] gap-3 p-4">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    icon={item.icon}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            ) : (
                              <div className="grid gap-3 p-4">
                                {link.items?.map((item, itemIndex) => (
                                  <ListItem
                                    key={itemIndex}
                                    title={item.label}
                                    href={item.href}
                                    type={link.type}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </div>
                            )}
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "cursor-pointer"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            if (link.href) {
                              router.push(link.href);
                            }
                          }}
                        >
                          {link.label}
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
            <ThemeSwitcher
              defaultValue="system"
              onChange={changeTheme}
              value={currentTheme as "light" | "dark" | "system"}
            />
            {/* Removed Sign In and Get Started buttons */}
          </div>
        </div>
      </header>
    );
  }
);

Navbar02.displayName = "Navbar02";

// ListItem component for navigation menu items
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string;
    href?: string;
    icon?: string;
    type?: "description" | "simple" | "icon";
    children?: React.ReactNode;
  }
>(({ className, title, children, icon, type, ...props }, ref) => {
  const renderIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    switch (iconName) {
      case "BookOpenIcon":
        return <BookOpenIcon className="h-5 w-5" />;
      case "LifeBuoyIcon":
        return <LifeBuoyIcon className="h-5 w-5" />;
      case "InfoIcon":
        return <InfoIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const router = useRouter();

  return (
    <NavigationMenuLink asChild>
      <a
        ref={ref}
        onClick={(e) => {
          e.preventDefault();
          if (props.href) {
            router.push(props.href);
          }
        }}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
          className
        )}
        {...props}
      >
        {type === "icon" && icon ? (
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {renderIconComponent(icon)}
            </div>
            <div className="space-y-1">
              <div className="text-base font-medium leading-tight">{title}</div>
              {children && (
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {children}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-base font-medium leading-none">{title}</div>
            {children && (
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                {children}
              </p>
            )}
          </>
        )}
      </a>
    </NavigationMenuLink>
  );
});
ListItem.displayName = "ListItem";

export { Logo, HamburgerIcon };
