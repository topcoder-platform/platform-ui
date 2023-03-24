import styles from "./styles.scss";
import formStyles from "../ApplicationForm/styles.scss";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import cn from "classnames";
import TextField from "components/TextField";
import * as selectors from "reducers/gigApply/selectors";
import actions from "actions/gigApply/creators";
import { useUpdateEffect } from "utils/hooks/useUpdateEffect";

const PayExpectations = () => {
  const payment = useSelector(selectors.getPayment);

  const dispatch = useDispatch();

  const onChangePayment = useCallback(
    (value) => {
      dispatch(actions.setPayment(value));
    },
    [dispatch]
  );

  const onFocusPayment = useCallback(() => {
    dispatch(actions.touchPayment());
  }, [dispatch]);

  const validatePayment = useCallback(
    debounce(
      () => {
        dispatch(actions.validatePayment());
      },
      300,
      { leading: false }
    ),
    [dispatch]
  );

  useUpdateEffect(validatePayment, [payment.value]);

  return (
    <div className={formStyles.section}>
      <div className={formStyles.sectionTitle}>
        Share Your Weekly Pay Expectations
      </div>
      <div className={formStyles.fieldRowList}>
        <div className={formStyles.fieldRow}>
          <TextField
            className={cn(formStyles.field, styles.paymentField)}
            label="Weekly Pay Expectation *"
            name="salary_expectation"
            placeholder="Weekly Pay Expectations in $ (e.g. 500) *"
            size="large"
            onChange={onChangePayment}
            onFocus={onFocusPayment}
            value={payment.value}
            error={payment.error}
          />
        </div>
      </div>
    </div>
  );
};

export default PayExpectations;
