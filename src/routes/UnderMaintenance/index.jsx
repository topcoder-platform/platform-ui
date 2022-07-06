import React from "react";

import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import PageH2 from "../../components/PageElements/PageH2";

import styles from "./styles.module.scss";

/**
 * Under Maintenance Page
 */
const UnderMaintenance = () => {
  const contentStyle = styles.content
  return (
    <>
      <Page>
        <PageContent>
          <div className={["container"]}>
            <div className={contentStyle}>
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
