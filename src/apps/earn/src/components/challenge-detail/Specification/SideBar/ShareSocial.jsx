/* eslint-disable jsx-a11y/anchor-is-valid */

import React from "react";

import { ReactComponent as TwitterIcon } from "../../../../assets/images/social/icon_twitter.svg";
import { ReactComponent as FacebookIcon } from "../../../../assets/images/social/icon_facebook.svg";
import { ReactComponent as PrintIcon } from "../../../../assets/images/social/icon_print.svg";
import { ReactComponent as EmailIcon } from "../../../../assets/images/social/icon_email.svg";
import { ReactComponent as MoreIcon } from "../../../../assets/images/social/icon_plus.svg";

import styles from "./social_media.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default class ShareSocial extends React.Component {
  componentDidMount() {
    /* TODO: This is some tooltip solution added in the related challenge,
     * it should be replaced by the standard tooltip component employed into
     * the repo. */
    if (window.addthis && window.addthis.init) {
      if (window.addthis.toolbox) {
        window.addthis.init();
        window.addthis.toolbox(".addthis_toolbox");
      }
    } else {
      const scriptNode = document.createElement("script");
      scriptNode.src =
        "https://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-52f22306211cecfc";
      this.shareDiv.appendChild(scriptNode);
    }
  }

  render() {
    return (
      <div
        ref={(htmlDiv) => {
          this.shareDiv = htmlDiv;
        }}
        className={styled("tc-share-social")}
      >
        <div className="addthis_toolbox addthis_default_style addthis_32x32_style">
          <a
            className="addthis_button_facebook"
            title="Facebook"
            aria-label="Share via Facebook"
            href="#"
          >
            <FacebookIcon className={styled("facebook-icon")} />
          </a>
          <a
            className="addthis_button_twitter"
            title="Twitter"
            aria-label="Share via Twitter"
            href="#"
          >
            <TwitterIcon />
          </a>
          <a
            className="addthis_button_print"
            title="Print"
            aria-label="Print this challenge"
            href="#"
          >
            <PrintIcon />
          </a>
          <a
            className="addthis_button_email"
            target="_blank"
            title="Email"
            aria-label="Email this challenge"
            href="#"
          >
            <EmailIcon />
          </a>
          <a
            className="addthis_button_compact"
            href="#"
            aria-label="More sharing options"
          >
            <MoreIcon />
          </a>
        </div>
      </div>
    );
  }
}
