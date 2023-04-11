import styles from "./styles.scss";
import React from "react";

const GigNotes = () => (
  <div className={styles["container"]}>
    <div className={styles["section-label"]}>Notes</div>
    <div className={styles["section-contents"]}>
      <strong>
        * Topcoder does not provide visa sponsorship nor will we work with
        Staffing Agencies.
      </strong>
      <strong>
        ** USA Visa Holders - Please consult an attorney before applying to any
        Topcoder Gig. Some visa statuses will or will not allow you to conduct
        freelance work with Topcoder.
      </strong>
      <strong>
        *** Topcoder and Wipro employees are not eligible for Gig work
        opportunities. Do not apply and send questions to{" "}
        <a href="mailto:support@topcoder.com">support@topcoder.com</a>.
      </strong>
    </div>
  </div>
);

export default GigNotes;
