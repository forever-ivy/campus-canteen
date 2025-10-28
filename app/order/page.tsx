import Table from "../../components/Table";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Table2 from "../../components/Table2";

const Order = () => {
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
            placeholder="输入订单号或学生 ID搜索"
            className="pl-10"
          />
        </div>
      </div>
      <div className="w-full h-auto my-5 flex justify-center">
        <div className="w-15/16">
          <Table2 />
        </div>
      </div>
    </div>
  );
};

export default Order;
