import PT from "prop-types";
import _ from "lodash";
import React from "react";
/**
 * Basic Info Form component
 */
import FormField from "../../../../components/FormElements/FormField";
import FormInputText from "../../../../components/FormElements/FormInputText";
import HelpBanner from "../../../../components/HelpBanner";
import PageDivider from "../../../../components/PageDivider";
import PageP from "../../../../components/PageElements/PageP";
import PageRow from "../../../../components/PageElements/PageRow";
import RadioButton from "../../../../components/RadioButton";
import ServicePrice from "../../../../components/ServicePrice";
import { HELP_BANNER } from "../../../../constants/";
import DeviceTypes from "../DeviceTypes";

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
      <ServicePrice
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
          <PageP styledName="title">PROJECT TITLE</PageP>
          <PageP styledName="description">
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
          <PageP styledName="title">How many pages?</PageP>
          <PageP styledName="description">
            How many pages (individual screens) would you like designed?
          </PageP>
        </div>

        <div className={styles["formFieldWrapper"]}>
          <RadioButton
            onChange={(items, i) => {
              const newNumOfPages = _.findIndex(items, (i) => i.value);
              updateNumOfPages(newNumOfPages + 1);
            }}
            size="large"
            options={pageListOptions}
          />
        </div>
      </PageRow>

      <PageDivider />
      <PageRow className={styles["form-row"]}>
        <div>
          <PageP styledName="title">Device Types</PageP>
          <PageP styledName="description">
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
