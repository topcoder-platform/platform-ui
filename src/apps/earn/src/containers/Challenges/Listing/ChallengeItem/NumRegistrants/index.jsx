import PT from "prop-types";
import { ReactComponent as IconRegistrant} from "../../../../../assets/icons/registrant.svg";

import styles from "./styles.scss";

const NumRegistrants = ({ numOfRegistrants }) => (
  <div className={styles.registrants}>
    <IconRegistrant /> {numOfRegistrants}
  </div>
);

NumRegistrants.propTypes = {
  numOfRegistrants: PT.number,
};

export default NumRegistrants;
