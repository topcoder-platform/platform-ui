/**
 *
 *  Website Design Banner
 */
import React from "react";
import "./styles.module.scss";
import { IconWebsiteTools } from "../../../assets/images/design-tools.svg";

export const WebsiteDesignBannerLegacy = () => {
  return (
    <div styleName="heroContainer">
      <div styleName="heroBackgroundContainer"></div>
      <div styleName="heroContent">
        <div styleName="heroHeader">
          <div styleName="heroHeaderContent">
            <div styleName="heroHeaderTitle">
              <div styleName="heroIconContainer">
                <IconWebsiteTools />
              </div>
              WEBSITE DESIGN
            </div>
            <div styleName="heroHeaderSubtitle">
              Create a beautiful custom visual design for your website. and
              device types, your vision, and receive up to 5 modern modern
              modern designs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteDesignBannerLegacy;
