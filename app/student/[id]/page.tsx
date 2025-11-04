import Category from "../../../components/category";

const DetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <div>
      <Category studentId={id} />
    </div>
  );
};

export default DetailPage;
