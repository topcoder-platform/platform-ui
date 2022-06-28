import { Router } from "@reach/router";
import React from "react";
import Review from "../../Review";
import ThankYou from "../../ThankYou";
import LoginPrompt from "../../LoginPrompt";
import BasicInfo from "../components/BasicInfo";
import config from "../../../../config";
import DataExplorationIcon from "../../../assets/images/data-exploration-icon.svg";
import HelpBanner from "components/HelpBanner";
import FeaturedWorkTypeBanner from "../../../components/Banners/FeaturedWorkTypeBanner";
import { webWorkTypes } from "../../../constants/index";
import { WorkType } from "../../../../src-ts";

export default function DataExploration({ isLoggedIn }) {
  const dataExploration = webWorkTypes.find(
    (workType) => workType.type === WorkType.data
  );

  const { title, subTitle, helperBannerTitle, helperBannerContent } =
    dataExploration;

  return (
    <Router>
      <BasicInfo
        path="/basic-info"
        isLoggedIn={isLoggedIn}
        workItemConfig={dataExploration}
        breadcrumb={dataExploration.breadcrumbs.basic}
      />
      <LoginPrompt
        path="/login-prompt"
        isLoggedIn={isLoggedIn}
        previousPageUrl="/self-service/work/new/data-exploration/basic-info"
        nextPageUrl="/self-service/work/new/data-exploration/review"
      />
      <Review
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
        path="/review"
        previousPageUrl="/self-service/work/new/data-exploration/basic-info"
        nextPageUrl={
          isLoggedIn
            ? "/self-service/work/new/data-exploration/thank-you"
            : config.SIGN_IN_URL
        }
        icon={<DataExplorationIcon />}
        showIcon
        workItemConfig={dataExploration}
        breadcrumb={dataExploration.breadcrumbs.review}
      />
      <ThankYou path="/thank-you" />
    </Router>
  );
}
