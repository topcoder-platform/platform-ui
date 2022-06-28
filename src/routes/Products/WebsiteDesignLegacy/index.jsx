import { Router } from "@reach/router";
import React from "react";
import ReviewLegacy from "../../ReviewLegacy";
import ThankYou from "../../ThankYou";
import LoginPrompt from "../../LoginPrompt";
import BasicInfoLegacy from "../../BasicInfoLegacy";
import BrandingLegacy from "../../BrandingLegacy";
import PageDetailsLegacy from "../../PageDetailsLegacy";
import WebsitePurposeLegacy from "../../WebsitePurposeLegacy";
import WebsiteDesignBannerLegacy from "../../../components/Banners/WebsiteDesignBannerLegacy";

export default function WebsiteDesignLegacy({ isLoggedIn }) {
  return (
    <Router>
      <BasicInfoLegacy path="/basic-info" />
      <WebsitePurposeLegacy path="/website-purpose" />
      <PageDetailsLegacy path="/page-details" />
      <LoginPrompt
        path="/login-prompt"
        isLoggedIn={isLoggedIn}
        nextPageUrl="/self-service/work/new/website-design/branding"
      />
      <BrandingLegacy path="/branding" />
      <ReviewLegacy
        path="/review"
        showIcon
        introText="Your Website Design project includes up to 5 unique Visual Design solutions. Each solution will match your specified scope and device types. You will receive industry-standard source files to take take forward to further design and/or development. Design deliverables will NOT include functional code."
        banner={<WebsiteDesignBannerLegacy />}
        showProgress
      />
      <ThankYou path="/thank-you" />
    </Router>
  );
}
