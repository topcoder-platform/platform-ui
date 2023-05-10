
import React from 'react';

import { ReactComponent as TwitterIcon } from '@earn/assets/images/social/icon_twitter.svg';
import { ReactComponent as FacebookIcon } from '@earn/assets/images/social/icon_facebook.svg';
import { ReactComponent as MoreIcon } from '@earn/assets/images/social/icon_plus.svg';

import styles from "./social_media.scss";

export default class ShareSocial extends React.Component {
  componentDidMount() {
    /* TODO: This is some tooltip solution added in the related challenge,
     * it should be replaced by the standard tooltip component employed into
     * the repo. */
    if (window.addthis && window.addthis.init) {
      if (window.addthis.toolbox) {
        window.addthis.init();
        window.addthis.toolbox('.addthis_toolbox');
      }
    } else {
      const scriptNode = document.createElement('script');
      const scriptNodeConfig = document.createElement('script');

      scriptNode.type = 'text/javascript';
      scriptNodeConfig.type = 'text/javascript';
      scriptNode.src = 'https://s7.addthis.com/js/300/addthis_widget.js#pubid=ra-52f22306211cecfc';
      scriptNodeConfig.text = "var addthis_config = { services_exclude: 'email' };";

      this.shareDiv.appendChild(scriptNode);
      this.shareDiv.appendChild(scriptNodeConfig);
    }
  }

  render() {
    return (
      <div ref={(htmlDiv) => { this.shareDiv = htmlDiv; }} className={styles['tc-share-social']}>
        <div className="addthis_toolbox addthis_default_style">
          <a
            className="addthis_button_facebook"
            title="Facebook"
            aria-label="Share via Facebook"
            href="#"
          >
            <FacebookIcon />
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
