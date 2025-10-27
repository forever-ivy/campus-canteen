import Bill from "../../../components/Bill";

const DetailPage = ({ params }: { params: { id: string } }) => {
  return (
    <div>
      {/* <h1>订单详情</h1>
      <p>订单ID: {params.id}</p> */}
      <Bill order={{ id: params.id }} />
    </div>
  );
};

export default DetailPage;
