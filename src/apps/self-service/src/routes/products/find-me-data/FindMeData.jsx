import { useContext } from "react";
import { Route, Routes } from "react-router-dom";

import { profileContext } from "~/libs/core";

import { ReactComponent as FindMeDataIcon } from "../../../assets/images/find-me-data-icon.svg";
import { SIGN_IN_URL, selfServiceRootRoute, webWorkTypes } from "../../../config";
import { WorkType } from "../../../lib";
import { BasicInfo, Review } from "../../../containers/products";
import { WorkLoginPrompt } from "../../work-login-prompt";
import { FeaturedWorkTypeBanner, HelpBanner } from "../../../components/banners";

export default function FindMeData() {
  const { profile } = useContext(profileContext);
  const isLoggedIn = !!profile;

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
        element={<WorkLoginPrompt
          isLoggedIn={isLoggedIn}
          previousPageUrl={`${selfServiceRootRoute}/new/find-me-data/basic-info`}
          nextPageUrl={`${selfServiceRootRoute}/new/find-me-data/review`}
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
          previousPageUrl={`${selfServiceRootRoute}/new/find-me-data/basic-info`}
          nextPageUrl={
            isLoggedIn
              ? `${selfServiceRootRoute}/new/find-me-data/thank-you`
              : SIGN_IN_URL
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
