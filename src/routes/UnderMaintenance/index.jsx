import Page from "components/Page";
import PageContent from "components/PageContent";
import PageH2 from "components/PageElements/PageH2";
import React from "react";
import "./styles.module.scss";

/**
 * Under Maintenance Page
 */
const UnderMaintenance = () => {
  return (
    <>
      <Page>
        <PageContent>
          <div styleName="container">
            <div styleName="content">
              <PageH2>UNDER MAINTENANCE</PageH2>
              <p>
                The application is under maintenance. Please contact{" "}
                <a href="mailto:support@topcoder.com">support@topcoder.com</a>{" "}
                if you need help!
              </p>
            </div>
          </div>
        </PageContent>
      </Page>
    </>
  );
};

export default UnderMaintenance;
