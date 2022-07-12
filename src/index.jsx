import React, { StrictMode } from "react";
import ReactDOM from 'react-dom'
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import ReduxToastr from "react-redux-toastr";

import {
  AppNextGen,
  PageFooter,
  ProfileProvider,
  RouteProvider,
  routeRootCustomer,
  routeRootLoggedOut,
  routeRootMember,
  toolsRoutes,
  utilsRoutes,
} from "../src-ts";

import App from "./App";
import store from "./store";

import "./styles/main.vendor.scss";

ReactDOM.render(
  <div className="root-container">
    <Provider store={store}>
      <ProfileProvider>

        <BrowserRouter>

          <RouteProvider
            rootCustomer={routeRootCustomer}
            rootLoggedOut={routeRootLoggedOut}
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

      </ProfileProvider>
    </Provider>
  </div>
  ,
  document.getElementById('root')
)
