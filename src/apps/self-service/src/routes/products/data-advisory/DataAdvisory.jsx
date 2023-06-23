import { useContext } from "react";
import { Route, Routes } from "react-router-dom";

import { profileContext } from "~/libs/core";

import { ReactComponent as DataAdvisoryIcon } from "../../../assets/images/data-advisory-icon.svg";
import { BasicInfo, Review } from "../../../containers/products";
import { WorkLoginPrompt } from "../../work-login-prompt";
import { webWorkTypes, SIGN_IN_URL, selfServiceRootRoute } from "../../../config";
import { FeaturedWorkTypeBanner, HelpBanner } from "../../../components/banners";
import { WorkType } from "../../../lib";

export default function DataAdvisory() {
  const { profile } = useContext(profileContext);
  const isLoggedIn = !!profile;

  const dataAdvisory = webWorkTypes.find(
    (workType) => workType.type === WorkType.problem
  );

  const { title, helperBannerTitle, helperBannerContent } =
    dataAdvisory;

  return (
    <Routes>

      <Route
        element={<BasicInfo
          isLoggedIn={isLoggedIn}
          workItemConfig={dataAdvisory}
          breadcrumb={dataAdvisory.breadcrumbs.basic}
        />}
        path="/basic-info"
      />

      <Route
        element={<WorkLoginPrompt
          isLoggedIn={isLoggedIn}
          previousPageUrl={`${selfServiceRootRoute}/new/data-advisory/basic-info`}
          nextPageUrl={`${selfServiceRootRoute}/new/data-advisory/review`}
        />}
        path="/login-prompt"
      />

      <Route
        element={<Review
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
          previousPageUrl={`${selfServiceRootRoute}/new/data-advisory/basic-info`}
          nextPageUrl={
            isLoggedIn
              ? `${selfServiceRootRoute}/new/data-advisory/thank-you`
              : SIGN_IN_URL
          }
          icon={<DataAdvisoryIcon />}
          showIcon
          workItemConfig={dataAdvisory}
          breadcrumb={dataAdvisory.breadcrumbs.review}
          isLoggedIn={isLoggedIn}
        />}
        path="/review"
      />

    </Routes>
  );
}
