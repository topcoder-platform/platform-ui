import { Route, Routes } from "react-router-dom";
import React from "react";

import { WorkType } from "../../../../src-ts";

import Review from "../../Review";
import ThankYou from "../../ThankYou";
import LoginPrompt from "../../LoginPrompt";
import BasicInfo from "../components/BasicInfo";
import config from "../../../../config";
import { ReactComponent as DataExplorationIcon } from "../../../assets/images/data-exploration-icon.svg";
import HelpBanner from "../../../components/HelpBanner";
import FeaturedWorkTypeBanner from "../../../components/Banners/FeaturedWorkTypeBanner";
import { webWorkTypes } from "../../../constants/index";

export default function WebsiteDesign({ isLoggedIn }) {
  const websiteDesign = webWorkTypes.find(
    (workType) => workType.type === WorkType.design
  );

  const { title, helperBannerTitle, helperBannerContent } =
    websiteDesign;

  return (
    <Routes>

      <Route
        element={<BasicInfo
          isLoggedIn={isLoggedIn}
          workItemConfig={websiteDesign}
          breadcrumb={websiteDesign.breadcrumbs.basic}
        />}
        path="/basic-info"
      />

      <Route
        element={<LoginPrompt
          isLoggedIn={isLoggedIn}
          previousPageUrl="/self-service/work/new/website-design-new/basic-info"
          nextPageUrl="/self-service/work/new/website-design-new/review"
        />}
        path="/login-prompt"
      />

      <Route
        element={<Review
          banner={
            <FeaturedWorkTypeBanner
              title="REVIEW & PAYMENT"
              subTitle={title}
              workType={WorkType.design}
            />
          }
          secondaryBanner={
            <HelpBanner defaultOpen title={helperBannerTitle} styles={["gray"]}>
              {helperBannerContent}
            </HelpBanner>
          }
          previousPageUrl="/self-service/work/new/website-design-new/basic-info"
          nextPageUrl={
            isLoggedIn
              ? "/self-service/work/new/website-design-new/thank-you"
              : config.SIGN_IN_URL
          }
          icon={<DataExplorationIcon />}
          showIcon
          workItemConfig={websiteDesign}
          breadcrumb={websiteDesign.breadcrumbs.review}
        />}
        path="/review"
      />

      <Route
        element={<ThankYou />}
        path="/thank-you"
      />

    </Routes>
  );
}
