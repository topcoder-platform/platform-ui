import styles from "./styles.scss";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../../reducers/gigs/gigs/selectors";
import Button from "../../components/Button";
import CurrencyField from "../../components/CurrencyField";
import Dropdown from "../../components/Dropdown";
import MultiSelect from "../../components/MultiSelect";
import actions from "../../actions/gigs/gigs/creators";
import { getSelectedDropdownOption } from "../../utils/gigs";
import { preventDefault } from "../../utils/gigs/misc";
import Select from "react-select";

/**
 * Displays filter controls for Gigs listing page.
 *
 * @returns {JSX.Element}
 */
const GigsFilter = () => {
  const skillsAll = useSelector(selectors.getSkillsAll);
  const locations = useSelector(selectors.getLocations);
  const { location, skills } = useSelector(selectors.getFilters);
  const { paymentMax, paymentMin } = useSelector(selectors.getValues);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const locationOptions = useMemo(
    () =>
      locations.map((value) => ({
        value,
        label: value,
        selected: value === location,
      })),
    [location, locations]
  );

  const onPaymentRangeError = useCallback(
    (msg) => {
      setError(msg);
    },
    [setError]
  );

  const onChangeLocation = useCallback(
    (options) => {
      const option = getSelectedDropdownOption(options);
      dispatch(actions.setLocation(option.value));
    }
  );

  const onChangePaymentMax = useCallback(
    (value) => {
      dispatch(actions.setPaymentMaxValue(value));
    },
    [dispatch]
  );

  const onChangePaymentMin = useCallback(
    (value) => {
      dispatch(actions.setPaymentMinValue(value));
    },
    [dispatch]
  );

  const onCommitPaymentMax = useCallback(
    (value) => {
      dispatch(actions.setPaymentMax(value));
    },
    [dispatch]
  );

  const onCommitPaymentMin = useCallback(
    (value) => {
      dispatch(actions.setPaymentMin(value));
    },
    [dispatch]
  );

  const onChangeSkills = useCallback(
    (skills) => {
      dispatch(actions.setSkills(skills));
    },
    [dispatch]
  );

  const onClickClearBtn = useCallback(() => {
    setError("");
    dispatch(actions.resetFilters());
  }, [dispatch]);

  return (
    <form className={styles["container"]} action="#" onSubmit={preventDefault}>
      <div className={styles["top-section"]}>
        <Dropdown
          className={styles.locationDropdown}
          label="Location"
          onChange={onChangeLocation}
          options={locationOptions}
          searchable={true}
          size="xs"
        />
      </div>
      <div className={styles["section"]}>
        <MultiSelect
          className={styles.skillsSelect}
          label="Skills/Technologies"
          onChange={onChangeSkills}
          options={skillsAll}
          optLabelKey="name"
          optValueKey="id"
          placeholder="Type to add skill"
          value={skills}
        />
      </div>
      <div className={styles["section"]}>
        <div className={styles["section-title"]}>Weekly Payment</div>
        <div className={styles["payment-range"]}>
          <CurrencyField
            className={styles.paymentMinField}
            currency="USD"
            id="filter-weekly-payment-min"
            label="From"
            maxValue={paymentMax}
            name="payment_min"
            rangeError={error}
            onError={onPaymentRangeError}
            onChange={onChangePaymentMin}
            onCommit={onCommitPaymentMin}
            required={true}
            value={paymentMin}
          />
          <span className={styles["payment-range-separator"]}>-</span>
          <CurrencyField
            className={styles.paymentMaxField}
            currency="USD"
            id="filter-weekly-payment-max"
            label="To"
            minValue={paymentMin}
            name="payment_max"
            rangeError={error}
            onError={onPaymentRangeError}
            onChange={onChangePaymentMax}
            onCommit={onCommitPaymentMax}
            required={true}
            value={paymentMax}
          />
        </div>
        {error && <div className={styles["payment-error"]}>{error}</div>}
      </div>
      <div className={styles["controls"]}>
        <Button onClick={onClickClearBtn}>CLEAR FILTER</Button>
        {/* <Button>SAVE FILTER</Button> */}
      </div>
    </form>
  );
};

export default GigsFilter;
