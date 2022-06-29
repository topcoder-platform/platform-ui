import { Navigate, Route, Routes } from "react-router-dom";
import React, { useContext, useLayoutEffect } from "react";
import TagManager from "react-gtm-module";
import "react-responsive-modal/styles.css";

import { EnvironmentConfig, logInitialize, profileContext } from "../src-ts";

import { UNDER_MAINTENANCE, GA_ID } from "./constants";
import IntakeForm from "./IntakeForm";
import Home from "./routes/Home";
import WorkItem from "./routes/WorkItems";
import { ScrollToTop } from "./ScrollToTop";
import styles from "./styles/main.module.scss";
import UnderMaintenance from "./routes/UnderMaintenance";

logInitialize(EnvironmentConfig);

if (process.env.APPMODE === "production") {
  TagManager.initialize({
    gtmId: GA_ID,
  });
}

const App = () => {

  const { initialized, isLoggedIn } = useContext(profileContext)

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--navbarHeight", "80px");
    return () => {
      // --navbarHeight must be set to its default value,
      // removeProperty won't work
      document.documentElement.style.setProperty("--navbarHeight", "60px");
    };
  }, []);

  if (!initialized) {
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
      <ScrollToTop path="/">
        <Routes>
          <Route
            element={<IntakeForm />}
            path="/self-service/*"
          />
          {isLoggedIn && (
            <>
              <Route
                element={<WorkItem />}
                path="/self-service/work-items/:workItemId"
              />
              <Route
                element={<Navigate noThrow from="/self-service/*" to="/self-service" />}
                path="/self-service/*"
              />
            </>
          )}
          <Route
            element={<Home />}
            path="/self-service"
          />
        </Routes>
      </ScrollToTop>
    </div >
  );
};

export default App;
