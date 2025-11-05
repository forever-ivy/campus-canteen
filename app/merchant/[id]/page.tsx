import MerchantDashboard from "../../../components/Merchant/merchant-dashboard";

const MerchantDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return (
    <div>
      <MerchantDashboard merchantId={id} />
    </div>
  );
};

export default MerchantDetailPage;
