import _ from "lodash";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from "@stripe/react-stripe-js";
import PT from "prop-types";
import { useState, useContext } from "react";

import { profileContext } from "~/libs/core";
import { ReactSelect } from "~/libs/ui";

import { COUNTRY_OPTIONS } from "../../../../../config";
import { FormField, FormInputCheckbox, FormInputText } from "../../../../../components/form-elements";

import styles from "./styles.module.scss";

/**
 * Payment Form Page
 */
const PaymentForm = ({ formData, setFormData, onOpenContractModal }) => {
  const handleInputChange = (name, value) =>
    setFormData((formData) => ({ ...formData, [name]: value }));

  const [cardNumberError, setCardNumberError] = useState("");
  const [cardExpiryError, setCardExpiryError] = useState("");
  const [cvcError, setCvcError] = useState("");
  const { profile } = useContext(profileContext);
  const email = profile?.email;

  // set the email, if it exists
  if (formData && !formData.email && email) {
    setFormData({
      ...formData,
      email,
    });
  }

  const getFieldError = (data) => data?.error?.message || "";

  const onCardNumberChange = (data) => {
    const errorMessage = getFieldError(data);
    setCardNumberError(errorMessage);
    if (_.isEmpty(errorMessage)) {
      handleInputChange("cardNumber", data?.complete);
    }
  };

  const onExpirationChange = (data) => {
    const errorMessage = getFieldError(data);
    setCardExpiryError(errorMessage);
    if (_.isEmpty(errorMessage)) {
      handleInputChange("expiryDate", data?.complete);
    }
  };

  const onCvcChange = (data) => {
    const errorMessage = getFieldError(data);
    setCvcError(errorMessage);
    handleInputChange("cvc", !errorMessage && data?.complete);
  };

  return (
    <div className={styles.paymentForm}>
      <div className={styles.formHeader}>Contact Information</div>

      <FormField label="Email">
        <div className={styles.cardElement}>
          <FormInputText name="email" value={email}></FormInputText>
        </div>
      </FormField>

      <div className={styles.formHeader}>Card Information</div>

      <FormField label="Card Number">
        <div className={styles.cardElement}>
          <CardNumberElement
            options={{
              classes: {
                base: styles.cardElement,
              },
            }}
            required
            onChange={(data) => onCardNumberChange(data)}
          />
        </div>
        {!!String(cardNumberError).length && (
          <span className={styles.error}>{cardNumberError}</span>
        )}
      </FormField>

      <div className={styles.halfWidth}>
        <FormField label={"Expiration Date"}>
          <div className={styles.cardElement}>
            <CardExpiryElement
              options={{
                classes: {
                  base: styles.cardElement,
                },
              }}
              required
              onChange={(data) => onExpirationChange(data)}
            />
          </div>
          {!!String(cardExpiryError).length && (
            <span className={styles.error}>{cardExpiryError}</span>
          )}
        </FormField>

        <FormField label={"CVC"}>
          <div className={styles.cardElement}>
            <CardCvcElement
              options={{
                classes: {
                  base: styles.cardElement,
                },
              }}
              required
              onChange={(data) => onCvcChange(data)}
            />
          </div>
          {!!String(cvcError).length && (
            <span className={styles.error}>{cvcError}</span>
          )}
        </FormField>
      </div>

      <FormField label="Name On Card">
        <div className={styles.cardElement}>
          <FormInputText
            options={{
              classes: {
                base: styles.cardElement,
              },
            }}
            name="cardName"
            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
          ></FormInputText>
        </div>
      </FormField>

      <FormField label="Country or Region">
        <ReactSelect
          value={formData?.country}
          onChange={(option) => handleInputChange("country", option)}
          options={COUNTRY_OPTIONS}
          style2={true}
        ></ReactSelect>
      </FormField>

      <FormField label="Zip Code">
        <div className={styles.cardElement}>
          <FormInputText
            name="zipCode"
            placeholder="12345"
            onChange={(e) => handleInputChange(e.target.name, e.target.value)}
          ></FormInputText>
        </div>
      </FormField>
      <div className={styles["contract"]}>
        <div className={styles["checkbox"]}>
          <FormInputCheckbox
            label=""
            checked={formData.checked}
            onChange={(e) => handleInputChange("checked", e.target.checked)}
            inline
          />
        </div>
        <div>
          Yes, I understand and agree to Topcoder's&nbsp;
          <span
            role="button"
            tabIndex={0}
            className={styles["link"]}
            onClick={() => onOpenContractModal(true)}
          >
            Order Contract
          </span>
        </div>
      </div>

      <div className={styles["infoBox"]}>
        <div className={styles["confirmationBox"]}>
          A hold will be placed on your card for the full amount of the project.
          Once your work is live on the Topcoder platform, you will be charged.
        </div>
      </div>
    </div>
  );
};

PaymentForm.defaultProps = {};

PaymentForm.propTypes = {
  formData: PT.shape(),
  onFormUpdate: PT.func,
  setFormData: PT.func.isRequired,
};

export default PaymentForm;
