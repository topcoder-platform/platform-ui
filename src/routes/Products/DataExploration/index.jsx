import { Routes, Route } from "react-router-dom";
import React from "react";

import { WorkType } from "../../../../src-ts";

import Review from "../../Review";
import LoginPrompt from "../../LoginPrompt";
import BasicInfo from "../components/BasicInfo";
import config from "../../../../config";
import { ReactComponent as DataExplorationIcon } from "../../../assets/images/data-exploration-icon.svg";
import HelpBanner from "../../../components/HelpBanner";
import FeaturedWorkTypeBanner from "../../../components/Banners/FeaturedWorkTypeBanner";
import { webWorkTypes } from "../../../constants/index";
import { selfServiceRootRoute } from "../../../../src-ts/tools/work";

export default function DataExploration({ isLoggedIn }) {
  const dataExploration = webWorkTypes.find(
    (workType) => workType.type === WorkType.data
  );

  const { title, helperBannerTitle, helperBannerContent } =
    dataExploration;

  return (
    <Routes>

      <Route
        element={<BasicInfo
          isLoggedIn={isLoggedIn}
          workItemConfig={dataExploration}
          breadcrumb={dataExploration.breadcrumbs.basic}
        />}
        path="/basic-info"
      />

      <Route
        element={<LoginPrompt
          isLoggedIn={isLoggedIn}
          previousPageUrl={`${selfServiceRootRoute}/new/data-exploration/basic-info`}
          nextPageUrl={`${selfServiceRootRoute}/new/data-exploration/review`}
        />}
        path="/login-prompt"
      />

      <Route
        element={<Review
          banner={
            <FeaturedWorkTypeBanner
              title="REVIEW & PAYMENT"
              subTitle={title}
              workType={WorkType.data}
            />
          }
          secondaryBanner={
            <HelpBanner defaultOpen title={helperBannerTitle} styles={["gray"]}>
              {helperBannerContent}
            </HelpBanner>
          }
          previousPageUrl={`${selfServiceRootRoute}/new/data-exploration/basic-info`}
          nextPageUrl={
            isLoggedIn
              ? `${selfServiceRootRoute}/new/data-exploration/thank-you`
              : config.SIGN_IN_URL
          }
          icon={<DataExplorationIcon />}
          showIcon
          workItemConfig={dataExploration}
          breadcrumb={dataExploration.breadcrumbs.review}
          isLoggedIn={isLoggedIn}
        />}
        path="/review"
      />

    </Routes>
  );
}
