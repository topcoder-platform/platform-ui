/**
 * PageDivider
 *
 * A Divider (line).
 */
import cn from "classnames";
import styles from "./styles.module.scss";

const PageDivider = ({ styleName, ...props }) => {
  return <div className={cn(styles["page-divider"], !!styleName ? styles[styleName] : undefined)} {...props}></div>;
};

export default PageDivider;
