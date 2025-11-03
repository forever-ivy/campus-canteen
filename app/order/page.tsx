"use client";

import { Suspense, useEffect, useState } from "react";
import Table from "../../components/Table";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Order = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState<string>("");

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setKeyword(q);
  }, [searchParams]);

  const updateQuery = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className=" w-full h-full flex-col ">
      <div className="flex-col justify-start items-center my-8 mx-10 ">
        <p className="font-bold text-4xl font-sans">订单管理</p>
        <p className="text-muted-foreground text-md my-4 mx-1 font-sans">
          查看和管理所有订单
        </p>
      </div>
      <div className="flex justify-start items-center my-8 mx-10">
        <div className="relative w-full px-0.5 max-w-dvw">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="输入订单号,学生ID,档口编号进行搜索"
            className="pl-10"
            value={keyword}
            onChange={(e) => {
              const v = e.target.value;
              setKeyword(v);
              // 实时更新URL中的 q 参数
              updateQuery({ q: v || null, page: "1" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setKeyword("");
                updateQuery({ q: null, page: "1" });
              }
            }}
          />
        </div>
      </div>
      <div className="w-full h-auto my-5 flex justify-center">
        <div className="w-15/16">
          <Suspense fallback={<div>Loading...</div>}>
            <Table />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Order;
