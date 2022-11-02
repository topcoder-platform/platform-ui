import React, { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import ReduxToastr from "react-redux-toastr";

import {
  Analytics,
  AppNextGen,
  EnvironmentConfig,
  logInitialize,
  PageFooter,
  ProfileProvider,
  RouteProvider,
  routeRootCustomer,
  routeRootLoggedOut,
  routeRootMember,
  toolsRoutes,
  utilsRoutes,
} from "../src-ts";
// WARNING: this has to be imported from its specific directory bc it
// causes circular or missing references when added to the barrel files
import { WorkNotLoggedIn } from '../src-ts/tools/work/work-not-logged-in'

import App from "./App";
import store from "./store";

import "./styles/main.vendor.scss";

logInitialize(EnvironmentConfig);

const root = createRoot(document.getElementById("root"));
root.render(
  <div className="root-container">
    <Provider store={store}>
      <ProfileProvider>

        <BrowserRouter>

          <RouteProvider
            rootCustomer={routeRootCustomer}
            rootLoggedOut={routeRootLoggedOut}
            rootLoggedOutFC={WorkNotLoggedIn}
            rootMember={routeRootMember}
            toolsRoutes={[...toolsRoutes]}
            utilsRoutes={[...utilsRoutes]}
          >
            <StrictMode>
              <AppNextGen />
            </StrictMode>
          </RouteProvider>

          <App />
          <ReduxToastr
            timeOut={3000}
            newestOnTop={false}
            preventDuplicates
            position="top-right"
            getState={(state) => state.toastr}
            transitionIn="fadeIn"
            transitionOut="fadeOut"
            progressBar
            closeOnToastrClick
          />

        </BrowserRouter>

        <PageFooter />

        <Analytics />

      </ProfileProvider>
    </Provider>
  </div>
)
