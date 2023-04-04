/**
 * PageDivider
 *
 * A Divider (line).
 */
import cn from "classnames";
import styles from "./styles.module.scss";

const PageDivider = ({ styledName, ...props }) => {
  return <div className={cn(styles["page-divider"], !!styledName ? styles[styledName] : undefined)} {...props}></div>;
};

export default PageDivider;
