import { Route, Routes } from "react-router-dom";
import React from "react";

import { WorkType } from "../../../../src-ts";

import Review from "../../Review";
import LoginPrompt from "../../LoginPrompt";
import BasicInfo from "../components/BasicInfo";
import config from "../../../../config";
import { ReactComponent as FindMeDataIcon } from "../../../assets/images/find-me-data-icon.svg";
import HelpBanner from "../../../components/HelpBanner";
import { webWorkTypes } from "../../../constants/index";
import FeaturedWorkTypeBanner from "../../../components/Banners/FeaturedWorkTypeBanner";

export default function FindMeData({ isLoggedIn }) {
  const findMeData = webWorkTypes.find(
    (workType) => workType.type === WorkType.findData
  );

  const { title, helperBannerTitle, helperBannerContent } =
    findMeData;

  return (
    <Routes>

      <Route
        element={<BasicInfo
          isLoggedIn={isLoggedIn}
          workItemConfig={findMeData}
          breadcrumb={findMeData.breadcrumbs.basic}
        />}
        path="/basic-info"
      />

      <Route
        element={<LoginPrompt
          isLoggedIn={isLoggedIn}
          previousPageUrl="/self-service/work/new/find-me-data/basic-info"
          nextPageUrl="/self-service/work/new/find-me-data/review"
        />}
        path="/login-prompt"
      />

      <Route
        element={<Review
          banner={
            <FeaturedWorkTypeBanner
              title="REVIEW & PAYMENT"
              subTitle={title}
              workType={WorkType.findData}
            />
          }
          secondaryBanner={
            <HelpBanner defaultOpen title={helperBannerTitle} styles={["gray"]}>
              {helperBannerContent}
            </HelpBanner>
          }
          previousPageUrl="/self-service/work/new/find-me-data/basic-info"
          nextPageUrl={
            isLoggedIn
              ? "/self-service/work/new/find-me-data/thank-you"
              : config.SIGN_IN_URL
          }
          icon={<FindMeDataIcon />}
          showIcon
          workItemConfig={findMeData}
          breadcrumb={findMeData.breadcrumbs.review}
          isLoggedIn={isLoggedIn}
        />}
        path="/review"
      />

    </Routes>
  );
}
