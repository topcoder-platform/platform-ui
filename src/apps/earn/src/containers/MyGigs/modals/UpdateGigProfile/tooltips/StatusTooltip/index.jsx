import PT from "prop-types";
import { keys } from "lodash";

import { Tooltip } from "~/libs/ui";

import { GIG_STATUS_TOOLTIP } from "../../../../../../constants";

import styles from "./styles.scss";

const StatusTooltip = ({ children }) => {
  const Content = () => (
    <div className={styles["status-tooltip"]}>
      <ul>
        {keys(GIG_STATUS_TOOLTIP).map((status) => (
          <li className={styles["item"]} key={status}>
            <div>
              <div className={styles["caption"]}>{status}</div>
              <div className={styles["text"]}>{GIG_STATUS_TOOLTIP[status]}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Tooltip content={<Content />} place="bottom">
      {children}
    </Tooltip>
  );
};

StatusTooltip.propTypes = {
  children: PT.node,
};

export default StatusTooltip;
