import React from "react";
import { WorkDetailDetailsPane } from "../../../../../src-ts";
import { selfServiceRootRoute } from "../../../../../src-ts/tools/work";

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
