import PT from "prop-types";

import styles from "./styles.scss";
import { IconOutline, LinkButton } from "~/libs/ui";

const Header = ({ title, challengeId }) => {
  return (
    <div className={styles.header}>
        <LinkButton
            link
            icon={IconOutline.ArrowLeftIcon}
            to={`/earn/challenges/${challengeId}`}
            size='lg'
        >
            Back to challenge
        </LinkButton>
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
