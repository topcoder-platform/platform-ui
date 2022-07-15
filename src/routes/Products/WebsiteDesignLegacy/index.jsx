import { Route, Routes } from "react-router-dom";
import React from "react";
import ReviewLegacy from "../../ReviewLegacy";
import LoginPrompt from "../../LoginPrompt";
import BasicInfoLegacy from "../../BasicInfoLegacy";
import BrandingLegacy from "../../BrandingLegacy";
import PageDetailsLegacy from "../../PageDetailsLegacy";
import WebsitePurposeLegacy from "../../WebsitePurposeLegacy";
import WebsiteDesignBannerLegacy from "../../../components/Banners/WebsiteDesignBannerLegacy";

export default function WebsiteDesignLegacy({ isLoggedIn }) {
  return (
    <Routes>

      <Route
        element={<BasicInfoLegacy isLoggedIn={isLoggedIn} />}
        path="/basic-info"
      />

      <Route
        element={<WebsitePurposeLegacy isLoggedIn={isLoggedIn} />}
        path="/website-purpose"
      />

      <Route
        element={<PageDetailsLegacy isLoggedIn={isLoggedIn} />}
        path="/page-details"
      />

      <Route
        element={<LoginPrompt
          isLoggedIn={isLoggedIn}
          nextPageUrl="/self-service/work/new/website-design-legacy/branding"
        />}
        path="/login-prompt"
      />

      <Route
        element={<BrandingLegacy isLoggedIn={isLoggedIn} />}
        path="/branding"
      />

      <Route
        element={
          <ReviewLegacy
            showIcon
            introText="Your Website Design project includes up to 5 unique Visual Design solutions. Each solution will match your specified scope and device types. You will receive industry-standard source files to take take forward to further design and/or development. Design deliverables will NOT include functional code."
            banner={<WebsiteDesignBannerLegacy />}
            showProgress
            isLoggedIn={isLoggedIn}
          />
        }
        path="/review"
      />

    </Routes>
  );
}
