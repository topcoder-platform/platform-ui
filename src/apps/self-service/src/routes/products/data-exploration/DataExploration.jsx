import { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import { profileContext } from "~/libs/core";

import { SIGN_IN_URL, webWorkTypes } from "../../../config";
import { ReactComponent as DataExplorationIcon } from "../../../assets/images/data-exploration-icon.svg";
import { Review } from "../../../containers/products";
import { BasicInfo } from "../../../containers/products";
import { FeaturedWorkTypeBanner, HelpBanner } from "../../../components/banners";
import { WorkType } from "../../../lib";
import { WorkLoginPrompt } from "../../work-login-prompt";

export default function DataExploration() {
  const { profile } = useContext(profileContext);
  const isLoggedIn = !!profile;

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
        element={<WorkLoginPrompt
          previousPageUrl="/self-service/work/new/data-exploration/basic-info"
          nextPageUrl="/self-service/work/new/data-exploration/review"
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
          previousPageUrl="/self-service/work/new/data-exploration/basic-info"
          nextPageUrl={
            isLoggedIn
              ? "/self-service/work/new/data-exploration/thank-you"
              : SIGN_IN_URL
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
