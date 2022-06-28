import { Router } from "@reach/router";
import React from "react";

import { WorkType } from "../../../../src-ts";

import Review from "../../Review";
import ThankYou from "../../ThankYou";
import LoginPrompt from "../../LoginPrompt";
import BasicInfo from "../components/BasicInfo";
import config from "../../../../config";
import { ReactComponent as DataAdvisoryIcon } from "../../../assets/images/data-advisory-icon.svg";
import HelpBanner from "../../../components/HelpBanner";
import FeaturedWorkTypeBanner from "../../../components/Banners/FeaturedWorkTypeBanner";
import { webWorkTypes } from "../../../constants/index";

export default function DataAdvisory({ isLoggedIn }) {
  const dataAdvisory = webWorkTypes.find(
    (workType) => workType.type === WorkType.problem
  );

  const { title, helperBannerTitle, helperBannerContent } =
    dataAdvisory;

  return (
    <Router>
      <BasicInfo
        path="/basic-info"
        isLoggedIn={isLoggedIn}
        workItemConfig={dataAdvisory}
        breadcrumb={dataAdvisory.breadcrumbs.basic}
      />
      <LoginPrompt
        path="/login-prompt"
        isLoggedIn={isLoggedIn}
        previousPageUrl="/self-service/work/new/data-advisory/basic-info"
        nextPageUrl="/self-service/work/new/data-advisory/review"
      />
      <Review
        banner={
          <FeaturedWorkTypeBanner
            title="REVIEW & PAYMENT"
            subTitle={title}
            workType={WorkType.problem}
          />
        }
        secondaryBanner={
          <HelpBanner defaultOpen title={helperBannerTitle} styles={["gray"]}>
            {helperBannerContent}
          </HelpBanner>
        }
        path="/review"
        previousPageUrl="/self-service/work/new/data-advisory/basic-info"
        nextPageUrl={
          isLoggedIn
            ? "/self-service/work/new/data-advisory/thank-you"
            : config.SIGN_IN_URL
        }
        icon={<DataAdvisoryIcon />}
        showIcon
        workItemConfig={dataAdvisory}
        breadcrumb={dataAdvisory.breadcrumbs.review}
      />
      <ThankYou path="/thank-you" />
    </Router>
  );
}
