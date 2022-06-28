/**
 * Tab element
 */
import PageRow from "../PageElements/PageRow";
import PT from "prop-types";
import React from "react";
import styles from "./styles.module.scss";
import { ReactComponent as WebsiteDesignIcon} from "../../assets/images/website-design.svg";
import HelpIcon from "../HelpIcon";
import { currencyFormat } from "../../utils/";

const ServicePrice = ({
  stickerPrice,
  showIcon,
  icon,
  serviceType,
  price,
  duration = 1,
  hideTitle = false,
}) => {
  return (
    <div className={styles["container"]}>
      <PageRow className={styles["inline"]}>
        <div className={styles["iconWrapper"]}>{showIcon && icon && <>{icon}</>}</div>
        {showIcon && !icon && <WebsiteDesignIcon />}
        <div>
          {!hideTitle && <p className={styles["serviceTitle"]}>{serviceType}</p>}
          <div className={styles["priceAndDuration"]}>
            {stickerPrice && (
              <span className={styles["stickerPrice"]}>
                {currencyFormat(stickerPrice)}
              </span>
            )}
            <span className={styles["discount"]}>{currencyFormat(price)}</span>
            <span className={styles["separator"]} />
            <span className={styles["days"]}>{duration}&nbsp;Days</span>
            <div className={styles["filler"]} />
            <HelpIcon>
              The price and project length is dynamic and dependent on the
              variables selected as you define your work.
            </HelpIcon>
          </div>
        </div>
      </PageRow>
    </div>
  );
};

ServicePrice.defaultProps = {
  price: 0,
};

ServicePrice.propTypes = {
  price: PT.number,
};

export default ServicePrice;
