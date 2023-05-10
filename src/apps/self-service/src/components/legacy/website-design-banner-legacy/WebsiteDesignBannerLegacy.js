/**
 *
 *  Website Design Banner
 */
import styles from "./styles.module.scss";
import { ReactComponent as IconWebsiteTools } from "../../../assets/images/design-tools.svg";

export const WebsiteDesignBannerLegacy = () => {
  return (
    <div className={styles["heroContainer"]}>
      <div className={styles["heroBackgroundContainer"]}></div>
      <div className={styles["heroContent"]}>
        <div className={styles["heroHeader"]}>
          <div className={styles["heroHeaderContent"]}>
            <div className={styles["heroHeaderTitle"]}>
              <div className={styles["heroIconContainer"]}>
                <IconWebsiteTools />
              </div>
              WEBSITE DESIGN LEGACY
            </div>
            <div className={styles["heroHeaderSubtitle"]}>
              Create a beautiful custom visual design for your website. and
              device types, your vision, and receive up to 5 modern modern
              modern designs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteDesignBannerLegacy;
