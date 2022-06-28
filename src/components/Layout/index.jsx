import React from "react";
import PT from "prop-types";

/**
 * Block Layout
 */
const Layout = ({ PageComponent, ...routeProps }) => {
  return (
    <div>
      <main>
        <PageComponent {...routeProps} />
      </main>
    </div>
  );
};

Layout.propTypes = {
  PageComponent: PT.object,
  path: PT.string,
};

export default Layout;
