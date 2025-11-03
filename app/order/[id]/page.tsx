import Bill from "../../../components/Bill";

const DetailPage = ({ params }: { params: { id: string } }) => (
  <Bill orderId={params.id} layout="page" />
);

export default DetailPage;
