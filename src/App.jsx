import { Redirect, Router } from "@reach/router";
import {
  getAuthUserTokens,
  disableNavigationForRoute,
} from "@topcoder/mfe-header";
import React, { useLayoutEffect, useState } from "react";
import { UNDER_MAINTENANCE, GA_ID } from "./constants";
import IntakeForm from "./IntakeForm";
import Home from "./routes/Home";
import WorkItems from "./routes/WorkItems";
import Layout from "components/Layout";
import TagManager from "react-gtm-module";
import { ScrollToTop } from "./ScrollToTop";

import "react-responsive-modal/styles.css";

import styles from "./styles/main.module.scss";
import UnderMaintenance from "./routes/UnderMaintenance";

import { EnvironmentConfig, logInitialize } from "../src-ts";

logInitialize(EnvironmentConfig);

if (process.env.APPMODE === "production") {
  TagManager.initialize({
    gtmId: GA_ID,
  });
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useLayoutEffect(() => {
    const checkIsLoggedIn = async () => {
      const { tokenV3 } = await getAuthUserTokens();
      setIsLoggedIn(!!tokenV3);
    };
    disableNavigationForRoute("/self-service/*");
    checkIsLoggedIn();
    document.documentElement.style.setProperty("--navbarHeight", "80px");
    return () => {
      // --navbarHeight must be set to its default value,
      // removeProperty won't work
      document.documentElement.style.setProperty("--navbarHeight", "60px");
    };
  }, []);

  if (isLoggedIn == null) {
    return null;
  }

  if (UNDER_MAINTENANCE) {
    return (
      <div className={styles["topcoder-mfe-customer-work"]}>
        <UnderMaintenance />
      </div>
    );
  }

  return (
    <div className={styles["topcoder-mfe-customer-work"]}>
      <Router primary={false}>
        <ScrollToTop path="/">
          <IntakeForm path="/self-service/*" />
          {isLoggedIn && (
            <>
              <Layout
                path="/self-service/work-items/:workItemId"
                PageComponent={WorkItems}
              />
              <Redirect noThrow from="/self-service/*" to="/self-service" />
            </>
          )}
          <Home path="/self-service" />
        </ScrollToTop>
      </Router>
    </div>
  );
};

export default App;
