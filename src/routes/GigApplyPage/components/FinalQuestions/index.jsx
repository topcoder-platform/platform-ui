import styles from "./styles.scss";
import formStyles from "../ApplicationForm/styles.scss";
import React, { useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import cn from "classnames";
import Dropdown from "components/Dropdown";
import RadioButton from "components/RadioButton";
import * as applySelectors from "reducers/gigApply/selectors";
import * as detailsSelectors from "reducers/gigDetails/selectors";
import * as myGigsSelectors from "reducers/myGigsSelectors";
import applyActions from "actions/gigApply/creators";
import { getSelectedDropdownOption } from "utils";
import { formatPlural } from "utils/formatting";

const FinalQuestions = ({ className }) => {
  const hasProfile = useSelector(myGigsSelectors.getHasProfile);
  const referral = useSelector(applySelectors.getReferral);
  const agreedDuration = useSelector(applySelectors.getAgreedDuration);
  const agreedTimezone = useSelector(applySelectors.getAgreedTimezone);
  const { duration, jobTimezone } = useSelector(detailsSelectors.getDetails);

  const dispatch = useDispatch();

  const referralOptions = useMemo(() => {
    let options = [];
    for (let option of REFERRAL_OPTIONS) {
      if (option.label === referral.value) {
        options.push({ label: referral.value, selected: true });
      } else {
        options.push(option);
      }
    }
    return options;
  }, [referral.value]);

  const onChangeReferral = useCallback(
    (options) => {
      const option = getSelectedDropdownOption(options);
      dispatch(applyActions.setReferral(option.label));
    },
    [dispatch]
  );

  const onChangeAgreedDuration = useCallback(
    (options) => {
      let label = getSelectedLabel(options);
      dispatch(applyActions.setAgreedDuration(label));
    },
    [dispatch]
  );

  const onChangeAgreedTimezone = useCallback(
    (options) => {
      let label = getSelectedLabel(options);
      dispatch(applyActions.setAgreedTimezone(label));
    },
    [dispatch]
  );

  useEffect(() => {
    if (hasProfile) {
      dispatch(applyActions.touchReferral());
    }
  }, [hasProfile, dispatch]);

  return (
    <div className={cn(formStyles.section, className)}>
      <div className={formStyles.sectionTitle}>Final Questions</div>
      {!hasProfile && (
        <Dropdown
          className={styles.referralDropdown}
          label="How did you find out about Topcoder Gig Work?"
          name="referral"
          placeholder="How did you find out about Topcoder Gig Work?"
          required
          onChange={onChangeReferral}
          options={referralOptions}
          errorMsg={referral.error}
        />
      )}
      <div className={styles.questions}>
        <div className={styles.question}>
          <p>
            Are you able to work during the specified timezone? (
            <strong>{jobTimezone || "n/a"}</strong>) *
          </p>
          <RadioButton
            className={styles.options}
            layout="horizontal"
            onChange={onChangeAgreedTimezone}
            errorMsg={agreedTimezone.error}
            options={TIMEZONE_OPTIONS}
            size="lg"
          />
        </div>
        <div className={styles.question}>
          <p>
            Are you ok to work with the duration of the gig? (
            <strong>{duration ? formatPlural(duration, "Week") : "n/a"}</strong>
            ) *
          </p>
          <RadioButton
            className={styles.options}
            layout="horizontal"
            onChange={onChangeAgreedDuration}
            errorMsg={agreedDuration.error}
            options={DURATION_OPTIONS}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
};

export default FinalQuestions;

const DURATION_OPTIONS = [
  { label: "Yes", value: false },
  { label: "No", value: false },
];

const TIMEZONE_OPTIONS = [
  { label: "Yes", value: false },
  { label: "No", value: false },
];

const REFERRAL_OPTIONS = [
  { label: "Google", selected: false },
  { label: "LinkedIn", selected: false },
  { label: "Other Ad or Promotion", selected: false },
  { label: "Quora", selected: false },
  { label: "Referral", selected: false },
  { label: "Topcoder Newsletter", selected: false },
  { label: "Uprisor Podcast", selected: false },
  { label: "YouTube or Video Ad", selected: false },
];

function getSelectedLabel(options) {
  for (let option of options) {
    if (option.value) {
      return option.label;
    }
  }
  return null;
}
