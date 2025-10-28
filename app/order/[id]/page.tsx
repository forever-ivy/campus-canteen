import Bill from "../../../components/Dishes/Bill";

const DetailPage = ({ params }: { params: { id: string } }) => {
  return (
    <div>
      <Bill order={{ id: params.id }} />
    </div>
  );
};

export default DetailPage;
