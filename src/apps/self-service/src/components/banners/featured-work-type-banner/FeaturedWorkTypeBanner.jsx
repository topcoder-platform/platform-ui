/**
 *
 *  Featured Work Type banner
 */
import PT from "prop-types";
import styles from "./styles.module.scss";

export const FeaturedWorkTypeBanner = ({ title, subTitle, workType }) => {
  const styleType = workType
    .toLowerCase()
    .split(" ")
    .join("-")
    .split("&")
    .join("");
  return (
    <div className={`${styles.heroContainer} ${styles[styleType]}`}>
      <div
        className={`${styles.heroBackgroundContainer} ${styles[styleType]}`}
      ></div>
      <div className={styles.heroContent}>
        <div className={styles.heroHeader}>
          <div className={styles.heroHeaderContent}>
            <div className={styles.heroHeaderTitle}>{title}</div>
            <div className={styles.heroHeaderSubtitle}>{subTitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

FeaturedWorkTypeBanner.propTypes = {
  title: PT.string,
  subTitle: PT.string,
  workType: PT.string,
};

export default FeaturedWorkTypeBanner;
