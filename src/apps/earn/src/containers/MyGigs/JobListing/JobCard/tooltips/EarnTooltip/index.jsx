import PT from "prop-types";

import { Tooltip } from "~/libs/ui";

import styles from "./styles.scss";

const EarnTooltip = ({ children }) => {
  const Content = () => (
    <div className={styles["earn-tooltip"]}>
      Amount may not reflect any pending payments
    </div>
  );

  return (
    <Tooltip
        content={<Content />}
        place="bottom"
    >
      {children}
    </Tooltip>
  );
};

EarnTooltip.propTypes = {
  children: PT.node,
};

export default EarnTooltip;
