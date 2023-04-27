import classNames from "classnames";
import { ReactComponent as HintIcon} from "../../assets/images/icon-hint-green.svg";

import styles from"./styles.module.scss";
import { Tooltip } from "~/libs/ui";

const HelpIcon = ({
  children,
  inverted = false,
}) => (
  <div className={styles["help-icon"]}>
    <Tooltip
      className={classNames(styles.tooltip, inverted && styles.inverted)}
      content={children}
      place="bottom"
    >
      <HintIcon />
    </Tooltip>
  </div>
);

export default HelpIcon;
