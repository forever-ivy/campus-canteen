import OrderTable from "../../components/OrderTable";

const Order = () => {
  return (
    <div className=" w-full h-full flex-col ">
      <div className="flex-col justify-start items-center my-8 mx-10 ">
        <p className="font-bold text-4xl font-sans">订单管理</p>
        <p className="text-muted-foreground text-md my-4 mx-0.5 font-sans">
          查看和管理所有订单
        </p>
      </div>
      <div className="w-full h-auto my-1 flex justify-center">
        <div className="flex justify-center w-full">
          <OrderTable />
        </div>
      </div>
    </div>
  );
};

export default Order;
