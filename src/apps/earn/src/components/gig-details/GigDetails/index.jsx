import styles from "./styles.scss";
import { useCallback, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import ReactHtmlParser from "react-html-parser";
import GigsButton from "../../GigsButton";
import { ReactComponent as IconLocation } from "../../../assets/icons/icon-location-crimson.svg";
import { ReactComponent as IconPayment } from "../../../assets/icons/icon-payment.svg";
import { ReactComponent as IconCalendar } from "../../../assets/icons/icon-calendar-medium.svg";
import { ReactComponent as IconHourglass } from "../../../assets/icons/icon-hourglass.svg";
import { ReactComponent as IconGlobe } from "../../../assets/icons/icon-globe-simple.svg";
import { ReactComponent as IconGear } from "../../../assets/icons/icon-gear-blue.svg";
import LoginModal from "../../LoginModal";
import GigNotes from "../GigNotes";
import GigWidgets from "../GigWidgets";
import * as selectors from "../../../reducers/gig-details/selectors";
import * as gigsSelectors from "../../../reducers/gigs/selectors";
import * as userSelectors from "../../../reducers/user/selectors";
import { formatPlural, formatPaymentAmount } from "../../../utils/gigs/formatting";
import { makeGigApplyPath } from "../../../utils/url";
import { FREQUENCY_TO_PERIOD, GIG_LIST_ROUTE } from "../../../constants";
import { getAppliedStorage, removeAppliedStorage } from "../../../utils/referral";

// Cleanup HTML from style tags
// so it won't affect other parts of the UI
const ReactHtmlParserOptions = {
  // eslint-disable-next-line consistent-return
  transform: (node) => {
    if (node.type === "style" && node.name === "style") {
      return null;
    }
  },
};

const GigDetails = () => {
  const details = useSelector(selectors.getDetails);
  const skillsError = useSelector(gigsSelectors.getSkillsError);
  const isLoggedIn = useSelector(userSelectors.getIsLoggedIn);
  const profile = useSelector(userSelectors.getProfile);
  const navigate = useNavigate();
  const [isOpenLoginModal, setIsOpenLoginModal] = useState(false);

  const {
    description,
    duration,
    hoursPerWeek = 0,
    jobExternalId,
    jobTimezone,
    location,
    payment,
    skills,
    synced = false,
    title,
  } = details;

  const periodName =
    FREQUENCY_TO_PERIOD[payment?.frequency?.toLowerCase()] || "week";
  const currency = payment?.currency || "$";
  const paymentAmount = formatPaymentAmount(
    payment?.min,
    payment?.max,
    currency,
    currency
  );

  const appliedGig = profile
    ? getAppliedStorage().indexOf(`${jobExternalId}${profile.userId}`) >= 0
    : false;

  useEffect(() => {
    if (synced && profile) {
      removeAppliedStorage(`${jobExternalId}${profile.userId}`);
    }
  }, [synced, jobExternalId, profile]);

  const onClickBtnApply = useCallback(() => {
    if (!isLoggedIn) {
      setIsOpenLoginModal(true);
    } else if (jobExternalId) {
      navigate(makeGigApplyPath(jobExternalId));
    }
  }, [isLoggedIn, jobExternalId]);

  const onClickBtnViewOther = useCallback(() => {
    navigate(GIG_LIST_ROUTE);
  }, []);

  const onCloseLoginModal = useCallback(() => {
    setIsOpenLoginModal(false);
  }, []);

  return (
    <div className={styles["container"]}>
      <h1 className={styles["title"]}>{title}</h1>
      <div className={styles["conditions"]}>
        <div className={styles["condition"]}>
          <div className={styles["condition-icon-placeholder"]}>
            <IconLocation
              className={cn(styles.conditionIcon, styles.locationIcon)}
            />
          </div>
          <div className={styles["condition-data"]}>
            <div className={styles["condition-label"]}>Location</div>
            <div className={styles["condition-value"]}>{location}</div>
          </div>
        </div>
        <div className={styles["condition"]}>
          <div className={styles["condition-icon-placeholder"]}>
            <IconPayment
              className={cn(styles.conditionIcon, styles.paymentIcon)}
            />
          </div>
          <div className={styles["condition-data"]}>
            <div className={styles["condition-label"]}>Compensation</div>
            <div className={styles["condition-value"]}>
              {paymentAmount === "-"
                ? "n/a"
                : `${paymentAmount} / ${periodName}`}
            </div>
          </div>
        </div>
        <div className={styles["condition"]}>
          <div className={styles["condition-icon-placeholder"]}>
            <IconCalendar
              className={cn(styles.conditionIcon, styles.durationIcon)}
            />
          </div>
          <div className={styles["condition-data"]}>
            <div className={styles["condition-label"]}>Duration</div>
            <div className={styles["condition-value"]}>
              {duration ? formatPlural(duration, "Week") : "n/a"}
            </div>
          </div>
        </div>
        <div className={styles["condition"]}>
          <div className={styles["condition-icon-placeholder"]}>
            <IconHourglass
              className={cn(styles.conditionIcon, styles.hoursIcon)}
            />
          </div>
          <div className={styles["condition-data"]}>
            <div className={styles["condition-label"]}>Hours</div>
            <div className={styles["condition-value"]}>
              {hoursPerWeek
                ? formatPlural(hoursPerWeek, "hour") + " / week"
                : "n/a"}
            </div>
          </div>
        </div>
        <div className={styles["condition"]}>
          <div className={styles["condition-icon-placeholder"]}>
            <IconGlobe
              className={cn(styles.conditionIcon, styles.timezoneIcon)}
            />
          </div>
          <div className={styles["condition-data"]}>
            <div className={styles["condition-label"]}>Working Hours</div>
            <div className={styles["condition-value"]}>
              {jobTimezone ? jobTimezone : "n/a"}
            </div>
          </div>
        </div>
      </div>
      <div className={styles["contents"]}>
        <div className={styles["text"]}>
          <div className={styles["skills"]}>
            <div className={styles["section-label"]}>Required Skills</div>
            <div className={styles["section-contents"]}>
              {skillsError ? (
                <span className={styles["skills-error"]}>{skillsError}</span>
              ) : (
                <>
                  <IconGear className={styles.skillsIcon} />
                  {skills?.length
                    ? skills.map(({ name }) => name).join(", ")
                    : "n/a"}
                </>
              )}
            </div>
          </div>
          <div className={styles["description"]}>
            <div className={styles["section-label"]}>Description</div>
            <div className={styles["section-contents"]}>
              <p>{ReactHtmlParser(description, ReactHtmlParserOptions)}</p>
            </div>
          </div>
          <GigNotes />
          <div className={styles["controls"]}>
            {!synced && !appliedGig && (
              <GigsButton isPrimary size="lg" onClick={onClickBtnApply}>
                APPLY TO THIS JOB
              </GigsButton>
            )}
            <GigsButton size="lg" onClick={onClickBtnViewOther}>
              VIEW OTHER JOBS
            </GigsButton>
          </div>
        </div>
        <GigWidgets className={styles.widgets} />
      </div>
      <LoginModal onClose={onCloseLoginModal} open={isOpenLoginModal} />
    </div>
  );
};

export default GigDetails;
