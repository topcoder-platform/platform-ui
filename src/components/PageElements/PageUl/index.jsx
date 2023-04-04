/**
 * PageUl
 *
 * page content ul tag
 */
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageUl = ({ children, styledName, ...props }) => {
  return (
    <ul className={cn(styles["page-ul"], !!styledName ? styles[styledName] : undefined)} {...props}>
      {children}
    </ul>
  );
};

PageUl.propTypes = {
  children: PT.node,
};

export default PageUl;
