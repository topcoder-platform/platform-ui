import styles from "./styles.scss";
import { Link } from "react-router-dom";
import PT from "prop-types";
import cn from "classnames";
import { ReactComponent as IconMark } from "../../../assets/icons/icon-location-mark.svg";
import { formatPaymentAmount } from "../../../utils/gigs/formatting";
import { makeGigPath } from "../../../utils/url";
import { FREQUENCY_TO_PERIOD } from "../../../constants";

/**
 * Displays hot gig item.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const GigHotItem = ({
  className,
  index,
  gig: { jobExternalId, location, payment, title },
}) => {
  const periodName =
    FREQUENCY_TO_PERIOD[payment?.frequency?.toLowerCase()] || "week";
  const currency = payment?.currency || "$";
  return (
    <Link
      className={cn(
        styles.container,
        styles[`gig-hot-${index + 1}`],
        className
      )}
      to={makeGigPath(jobExternalId)}
    >
      <div className={styles["location"]}>
        <IconMark className={styles.locationMark} />
        <span className={styles["location-text"]}>{location}</span>
      </div>
      <div className={styles["name"]}>{title}</div>
      <div className={styles["payment"]}>
        {formatPaymentAmount(payment?.min, payment?.max, currency, currency)} /{" "}
        {periodName}
      </div>
    </Link>
  );
};

GigHotItem.propTypes = {
  className: PT.string,
  index: PT.number.isRequired,
  gig: PT.object.isRequired,
};

export default GigHotItem;
