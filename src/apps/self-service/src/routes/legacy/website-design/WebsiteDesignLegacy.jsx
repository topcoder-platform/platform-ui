import { Route, Routes } from "react-router-dom";
import { useContext } from "react";

import { profileContext } from "~/libs/core";

import { Review, BasicInfo, PageDetails, WebsitePurpose, Branding } from "../../../containers/legacy";
import { WebsiteDesignBannerLegacy } from "../../../components/legacy";
import { WorkLoginPrompt } from "../../work-login-prompt";
import { ReactComponent as WebsiteDesignIcon} from "../../../assets/images/website-design.svg";
import { LoadingSpinner } from "~/libs/ui";

export default function WebsiteDesignLegacy() {
  const { profile, initialized } = useContext(profileContext);
  const isLoggedIn = !!profile;

  function renderRoutes() {
    return (
        <Routes>
            <Route
                element={<BasicInfo isLoggedIn={isLoggedIn} />}
                path="/basic-info"
            />

            <Route
                element={<WebsitePurpose isLoggedIn={isLoggedIn} />}
                path="/website-purpose"
            />

            <Route
                element={<PageDetails isLoggedIn={isLoggedIn} />}
                path="/page-details"
            />

            <Route
                element={<WorkLoginPrompt
                isLoggedIn={isLoggedIn}
                nextPageUrl="/self-service/work/new/website-design-legacy/branding"
                />}
                path="/login-prompt"
            />

            <Route
                element={<Branding isLoggedIn={isLoggedIn} />}
                path="/branding"
            />

            <Route
                element={
                <Review
                    showIcon
                    introText="Your Website Design project includes up to 5 unique Visual Design solutions. Each solution will match your specified scope and device types. You will receive industry-standard source files to take take forward to further design and/or development. Design deliverables will NOT include functional code."
                    banner={<WebsiteDesignBannerLegacy />}
                    showProgress
                    icon={<WebsiteDesignIcon />}
                    isLoggedIn={isLoggedIn}
                />
                }
                path="/review"
            />

        </Routes>
    )
  }

  return (
    <>
        <LoadingSpinner hide={initialized} />
        {initialized && renderRoutes()}
    </>
  );
}
