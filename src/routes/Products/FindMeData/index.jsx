import { Router } from "@reach/router";
import React from "react";

import { WorkType } from "../../../../src-ts";

import Review from "../../Review";
import ThankYou from "../../ThankYou";
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
    <Router>
      <BasicInfo
        path="/basic-info"
        isLoggedIn={isLoggedIn}
        workItemConfig={findMeData}
        breadcrumb={findMeData.breadcrumbs.basic}
      />
      <LoginPrompt
        path="/login-prompt"
        isLoggedIn={isLoggedIn}
        previousPageUrl="/self-service/work/new/find-me-data/basic-info"
        nextPageUrl="/self-service/work/new/find-me-data/review"
      />
      <Review
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
        path="/review"
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
      />
      <ThankYou path="/thank-you" />
    </Router>
  );
}
