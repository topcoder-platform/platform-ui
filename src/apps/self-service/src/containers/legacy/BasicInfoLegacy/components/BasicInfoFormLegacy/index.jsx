import PT from "prop-types";
import _ from "lodash";
import React from "react";
/**
 * Basic Info Form component
 */
import { HELP_BANNER } from "../../../../../config";
import DeviceTypes from "../DeviceTypes";
import { WorkServicePrice } from "../../../../../components/work-service-price";
import { PageDivider, PageP, PageRow } from "../../../../../components/page-elements";
import { FormField, FormInputText } from "../../../../../components/form-elements";
import { RadioButton } from "../../../../../components/radio-button";
import { HelpBanner } from "../../../../../components/banners";

import styles from "./styles.module.scss";

const BasicInfoFormLegacy = ({
  formData,
  serviceType,
  onFormUpdate,
  onShowSupportModal,
  numOfPages,
  updateNumOfPages,
  estimate,
  pageListOptions,
}) => {
  const handleInputChange = (name, value, option = "") => {
    onFormUpdate({ ...formData, [name]: { ...formData[name], option, value } });
  };

  return (
    <div className={styles["basicInfoForm"]}>
      <WorkServicePrice
        stickerPrice={estimate?.stickerPrice}
        price={estimate?.total}
        duration={estimate?.totalDuration}
        serviceType={serviceType}
      />
      <div className={styles["infoAlert"]}>
        Your Website Design project includes up to 5 unique Visual Design
        solutions. Each solution will match your specified scope and device
        types. You will receive industry-standard source files to take forward
        to further design and/or development. Design deliverables will NOT
        include functional code.
      </div>

      <PageDivider />
      <PageRow className={styles["form-row"]}>
        <div>
          <PageP styleName="title">PROJECT TITLE</PageP>
          <PageP styleName="description">
            Give your project a descriptive title. This is what the designers
            will see when looking for your work.
          </PageP>
        </div>

        <div className={styles["formFieldWrapper"]}>
          <FormField label={"Project Title"}>
            <FormInputText
              placeholder={"Enter a descriptive title"}
              value={formData.projectTitle.value}
              name="projectTitle"
              onChange={(e) =>
                handleInputChange(e.target.name, e.target.value, e.target.value)
              }
            />
          </FormField>
        </div>
      </PageRow>

      <PageDivider />
      <PageRow className={styles["form-row"]}>
        <div>
          <PageP styleName="title">How many pages?</PageP>
          <PageP styleName="description">
            How many pages (individual screens) would you like designed?
          </PageP>
        </div>

        <div className={styles["formFieldWrapper"]}>
          <RadioButton
            onChange={(items, i) => {
              const newNumOfPages = _.findIndex(items, (i) => i.value);
              updateNumOfPages(newNumOfPages + 1);
            }}
            size="lg"
            options={pageListOptions}
          />
        </div>
      </PageRow>

      <PageDivider />
      <PageRow className={styles["form-row"]}>
        <div>
          <PageP styleName="title">Device Types</PageP>
          <PageP styleName="description">
            Your project includes designs for computers. You can add tablet and/
            or mobile device sizes as well. Designing for multiple devices,
            sizes or types is referred to as Responsive Design.
          </PageP>
        </div>

        <div className={styles["formFieldWrapper"]}>
          <DeviceTypes
            numOfPages={numOfPages}
            selectedOptions={formData?.selectedDevice?.value}
            onSelect={(selectedOption, option) => {
              handleInputChange("selectedDevice", selectedOption, option);
            }}
          />
        </div>
      </PageRow>
      <HelpBanner
        title={HELP_BANNER.title}
        description={HELP_BANNER.description}
        contactSupport={onShowSupportModal}
      />
    </div>
  );
};

BasicInfoFormLegacy.defaultProps = {
  serviceType: "",
};

BasicInfoFormLegacy.propTypes = {
  estimate: PT.shape().isRequired,
  serviceType: PT.string,
  onFormUpdate: PT.func,
  formData: PT.shape(),
};

export default BasicInfoFormLegacy;
