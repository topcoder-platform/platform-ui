/**
 * PageP
 *
 * page content paragraph tag
 */
import cn from "classnames";
import PT from "prop-types";
import styles from "./styles.module.scss";

const PageP = ({ children, styleName, ...props }) => {
  return (
    <p className={cn(styles["page-p"], !!styleName ? styles[styleName] : undefined)} {...props}>
      {children}
    </p>
  );
};

PageP.propTypes = {
  children: PT.node,
};

export default PageP;
