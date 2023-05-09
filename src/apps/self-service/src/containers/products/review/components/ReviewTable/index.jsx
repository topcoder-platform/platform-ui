import { selfServiceRootRoute } from "../../../../../config";
import { WorkDetailDetailsPane } from "../../../../../components/work-details";

/**
 * Review Table Component
 */
const ReviewTable = ({ workItemConfig, formData }) => {
  const redirectUrl = `${selfServiceRootRoute}/new/${workItemConfig.basePath}/basic-info`;
  return (
    <WorkDetailDetailsPane
      formData={formData}
      isReviewPage={true}
      redirectUrl={redirectUrl}
    />
  );
};

export default ReviewTable;
