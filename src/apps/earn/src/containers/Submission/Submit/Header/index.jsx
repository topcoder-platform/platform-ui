import PT from "prop-types";
import config from "../../../../config";

import styles from "./styles.scss";

const Header = ({ title, challengeId }) => {
  return (
    <div className={styles.header}>
      <a
        href={`${config.URL.PLATFORM_WEBSITE}/earn/challenges/${challengeId}`}
      >
        <span>&#x2039;</span>
        <p>Back to challenge</p>
      </a>
      <h1>{title}</h1>
    </div>
  );
};

Header.defaultProps = {};

Header.propTypes = {
  title: PT.string,
  challengeId: PT.string,
};

export default Header;
