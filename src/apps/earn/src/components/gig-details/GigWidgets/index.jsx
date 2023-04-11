import styles from "./styles.scss";
import React from "react";
import PT from "prop-types";
import GigReferral from "../GigReferral";
import GigsSubscription from "../GigsSubscription";
import GigTips from "../GigTips";

/**
 * Displays gig's widgets in the sidebar.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const GigWidgets = ({ className }) => (
  <div className={className}>
    <GigReferral className={styles.gigReferral} />
    <GigsSubscription className={styles.gigSubscription} />
    <GigTips className={styles.gigTips} />
  </div>
);

GigWidgets.propTypes = {
  className: PT.string,
};

export default GigWidgets;
