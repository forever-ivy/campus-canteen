import Bill from "../../../components/Bill";

const DetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <Bill orderId={id} />;
};

export default DetailPage;
