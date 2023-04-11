import { WorkDetailDetailsPane } from "../../../../../components/work-details";

/**
 * Review Table Component
 */
const ReviewTable = ({ workItemConfig, formData }) => {
  const redirectUrl = `/self-service/work/new/${workItemConfig.basePath}/basic-info`;
  return (
    <WorkDetailDetailsPane
      formData={formData}
      isReviewPage={true}
      redirectUrl={redirectUrl}
    />
  );
};

export default ReviewTable;
