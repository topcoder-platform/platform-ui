import styles from "./styles.scss";
import formStyles from "../ApplicationForm/styles.scss";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import cn from "classnames";
import debounce from "lodash/debounce";
import Dropdown from "components/Dropdown";
import TextField from "components/TextField";
import * as myGigsSelectors from "reducers/myGigsSelectors";
import * as lookupSelectors from "reducers/lookupSelectors";
import * as applySelectors from "reducers/gigApply/selectors";
import applyActions from "actions/gigApply/creators";
import { getSelectedDropdownOption } from "utils";
import { useUpdateEffect } from "utils/hooks/useUpdateEffect";
import { DEBOUNCE_ON_CHANGE_TIME } from "constants";

const PersonalInfo = () => {
  const countryOptionsAll = useSelector(lookupSelectors.getCountryOptions);
  const { email, firstName, lastName, hasProfile } = useSelector(
    myGigsSelectors.getProfile
  );
  const city = useSelector(applySelectors.getCity);
  const country = useSelector(applySelectors.getCountry);
  const phone = useSelector(applySelectors.getPhone);

  const dispatch = useDispatch();

  const countryOptions = useMemo(() => {
    const value = country.value;
    const options = [];
    for (let option of countryOptionsAll) {
      if (option.value === value) {
        options.push({ label: value, value, selected: true });
      } else {
        options.push(option);
      }
    }
    return options;
  }, [country.value, countryOptionsAll]);

  const onChangeCity = useCallback(
    (value) => {
      dispatch(applyActions.setCity(value));
    },
    [dispatch]
  );

  const onChangeCountry = useCallback(
    (options) => {
      const option = getSelectedDropdownOption(options);
      dispatch(applyActions.setCountry(option.value));
    },
    [dispatch]
  );

  const onChangePhone = useCallback(
    (value) => {
      dispatch(applyActions.setPhone(value));
    },
    [dispatch]
  );

  const touchCity = useCallback(() => {
    dispatch(applyActions.touchCity());
  }, [dispatch]);

  const validateCity = useCallback(
    debounce(
      () => {
        dispatch(applyActions.validateCity());
      },
      DEBOUNCE_ON_CHANGE_TIME,
      { leading: false }
    ),
    [dispatch]
  );

  const validateCountry = useCallback(
    debounce(
      () => {
        dispatch(applyActions.validateCountry());
      },
      DEBOUNCE_ON_CHANGE_TIME,
      { leading: false }
    ),
    [dispatch]
  );

  const validatePhone = useCallback(
    debounce(
      () => {
        dispatch(applyActions.validatePhone());
      },
      DEBOUNCE_ON_CHANGE_TIME,
      { leading: false }
    ),
    [dispatch]
  );

  useUpdateEffect(validateCity, [city.value]);

  useUpdateEffect(validateCountry, [country.value]);

  useUpdateEffect(validatePhone, [phone.value]);

  return (
    <div className={formStyles.section}>
      <div className={formStyles.sectionTitle}>Personal Information</div>
      {!hasProfile && (
        <div className={formStyles.sectionDescription}>
          Welcome to Topcoder Gigs! We’d like to get to know you.
        </div>
      )}
      <div className={formStyles.fieldRowList}>
        <div className={formStyles.fieldRow}>
          <TextField
            className={formStyles.field}
            label="First Name"
            name="first_name"
            size="large"
            isReadonly
            isRequired
            value={firstName}
          />
          <TextField
            className={formStyles.field}
            label="Last Name"
            name="last_name"
            size="large"
            isReadonly
            isRequired
            value={lastName}
          />
        </div>
        <div className={formStyles.fieldRow}>
          <TextField
            className={formStyles.field}
            label="Email"
            name="email"
            size="large"
            isReadonly
            isRequired
            value={email}
          />
          <TextField
            className={formStyles.field}
            label="Phone"
            name="contact_number"
            size="large"
            placeholder="Phone Including Country Code *"
            isRequired
            onChange={onChangePhone}
            value={phone.value}
            error={phone.error}
          />
        </div>
        <div className={formStyles.fieldRow}>
          <TextField
            className={formStyles.field}
            label="City"
            name="city"
            placeholder="City *"
            size="large"
            isRequired
            onChange={onChangeCity}
            onFocus={touchCity}
            value={city.value}
            error={city.error}
          />
          <Dropdown
            className={cn(formStyles.field, styles.countryDropdown)}
            label="Country"
            name="locality"
            placeholder="Country"
            required
            onChange={onChangeCountry}
            options={countryOptions}
            errorMsg={country.error}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
