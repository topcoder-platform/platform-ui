/**
 * PageUl
 *
 * page content ul tag
 */
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageUl = ({ children, styleName, ...props }) => {
  return (
    <ul className={cn(styles["page-ul"], !!styleName ? styles[styleName] : undefined)} {...props}>
      {children}
    </ul>
  );
};

PageUl.propTypes = {
  children: PT.node,
};

export default PageUl;
