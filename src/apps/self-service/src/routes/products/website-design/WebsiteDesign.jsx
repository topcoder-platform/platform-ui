import { useContext } from "react";
import { Route, Routes } from "react-router-dom";

import { profileContext } from "~/libs/core";

import { ReactComponent as DataExplorationIcon } from "../../../assets/images/data-exploration-icon.svg";
import { SIGN_IN_URL, webWorkTypes } from "../../../config";
import { WorkType } from "../../../lib";
import { BasicInfo, Review } from "../../../containers/products";
import { WorkLoginPrompt } from "../../work-login-prompt";
import { FeaturedWorkTypeBanner, HelpBanner } from "../../../components/banners";

export default function WebsiteDesign() {
  const { profile } = useContext(profileContext);
  const isLoggedIn = !!profile;

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
        element={<WorkLoginPrompt
          isLoggedIn={isLoggedIn}
          previousPageUrl="/self-service/work/new/website-design/basic-info"
          nextPageUrl="/self-service/work/new/website-design/review"
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
          previousPageUrl="/self-service/work/new/website-design/basic-info"
          nextPageUrl={
            isLoggedIn
              ? "/self-service/work/new/website-design/thank-you"
              : SIGN_IN_URL
          }
          icon={<DataExplorationIcon />}
          showIcon
          workItemConfig={websiteDesign}
          breadcrumb={websiteDesign.breadcrumbs.review}
          isLoggedIn={isLoggedIn}
        />}
        path="/review"
      />

    </Routes>
  );
}
