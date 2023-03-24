import { Route, Routes } from "react-router-dom";
import React, { useContext, useLayoutEffect } from "react";
import "react-responsive-modal/styles.css";

import { profileContext } from "../src-ts";

import { UNDER_MAINTENANCE } from "./constants";
import { ScrollToTop } from "./ScrollToTop";
import styles from "./styles/main.module.scss";
import { lazyLoad, LoadingSpinner } from "../src-ts/lib";
import { Suspense } from "react";

const WorkItem = lazyLoad(() => import("./routes/WorkItems"));
const IntakeForm = lazyLoad(() => import("./IntakeForm"));
const UnderMaintenance = lazyLoad(() => import("./routes/UnderMaintenance"));

const App = () => {

  const { initialized } = useContext(profileContext)

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
      <div className={styles["topcoder-platform-ui"]}>
        <UnderMaintenance />
      </div>
    );
  }

  return (
    <div className={styles["topcoder-platform-ui"]}>
      <ScrollToTop path="/">
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route
                    element={<IntakeForm />}
                    path="/self-service/*"
                />
                <Route
                    element={<WorkItem />}
                    path="/self-service/work-items/:workItemId"
                />
            </Routes>
        </Suspense>
      </ScrollToTop>
    </div >
  );
};

export default App;
