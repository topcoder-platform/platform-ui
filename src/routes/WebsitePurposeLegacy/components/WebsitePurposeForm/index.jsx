/**
 * Tab element
 */
import _ from "lodash";
import FormField from "components/FormElements/FormField";
import FormInputText from "components/FormElements/FormInputText";
import FormInputTextArea from "components/FormElements/FormInputTextArea";
import PageDivider from "components/PageDivider";
import PageP from "components/PageElements/PageP";
import PageRow from "components/PageElements/PageRow";
import Select from "components/ReactSelect";
import ServicePrice from "components/ServicePrice";
import { IndustryList } from "constants/";
import PT from "prop-types";
import React from "react";
import "./styles.module.scss";

const WebsitePurposeForm = ({
  formData,
  setFormData,
  price,
  serviceType,
  saveWebsitePurpose,
  estimate,
}) => {
  const handleInputChange = (name, value, option = null) => {
    setFormData((formData) => {
      const newFormData = {
        ...formData,
        [name]: { ...formData[name], option: option ? option : value, value },
      };
      saveWebsitePurpose(newFormData);
      return newFormData;
    });
  };

  return (
    <div styleName="websitePurposeForm">
      <ServicePrice
        price={estimate.total}
        duration={estimate.totalDuration}
        stickerPrice={estimate?.stickerPrice}
        serviceType={serviceType}
      />

      <PageDivider />
      <PageRow styleName="form-row">
        <div>
          <PageP styleName="title">Your industry</PageP>
          <PageP styleName="description">
            Knowing your industry will help our designers understand your
            audience, and the basic visual direction and overall tone to take
            for your website design.
          </PageP>
        </div>

        <div styleName="formFieldWrapper">
          <FormField label={"Your Industry"}>
            <Select
              value={formData?.industry?.value}
              onChange={(option) => {
                handleInputChange("industry", option, option.label);
              }}
              options={IndustryList}
              style2={true}
              placeholder={"Select industry"}
            />
          </FormField>
        </div>
      </PageRow>

      <PageDivider />
      <PageRow styleName="form-row">
        <div>
          <PageP styleName="title">DESCRIPTION</PageP>
          <PageP styleName="description">
            What is the purpose of your website? What do you want visitors to be
            able to do, e.g., see your work? Contact you? You can include a
            general description as well as goals of the website.{" "}
          </PageP>
          <br />
          <PageP styleName="description">
            <strong>Example:</strong> <br />A dog walking website that allows
            visitors to select dog walkers and schedule dog walking appointments
          </PageP>
        </div>

        <div styleName="formFieldWrapper">
          <FormField label={"Description"}>
            <FormInputTextArea
              value={formData?.description?.value}
              onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              styleName={"text-area"}
              name="description"
              placeholder={"Describe your website"}
            />
          </FormField>
        </div>
      </PageRow>

      <PageDivider />
      <PageRow styleName="form-row">
        <div>
          <PageP styleName="title">USERS</PageP>
          <PageP styleName="description">
            Describe your target audience—are they pharmaceutical reps?
            Middle-aged mechanical engineers? Beekeepers? Write their user
            story, using the format, “As a &lt;type of users&gt;, I want
            &lt;some goal&gt;, so that &lt;some reason&gt;.”
          </PageP>
          <br />
          <PageP styleName="description">
            <strong>Example:</strong> <br />
            “As a dog owner, I want someone trustworthy to walk my dog, so that
            he feels loved when I'm at work.“
          </PageP>
        </div>

        <div styleName="formFieldWrapper">
          <FormField label={"Users"}>
            <FormInputTextArea
              value={formData?.userStory?.value}
              onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              styleName={"text-area"}
              name="userStory"
              placeholder={"Enter your user story"}
            />
          </FormField>
        </div>
      </PageRow>

      <PageDivider />
      <PageRow styleName="form-row">
        <div>
          <PageP styleName="title">EXISTING WEBSITE?</PageP>
          <PageP styleName="description">
            If you have an existing website, please enter it here. Are we
            designing additional pages for your existing website? Or are we
            redesigning your current website? Please add additional information
            on how the designers should reference and use your existing website.
          </PageP>
        </div>

        <div styleName="formFieldWrapper">
          <FormField label={"Existing Website (Optional)"}>
            <FormInputText
              placeholder={"Enter website url. e.g. www.acme.com"}
              value={formData?.existingWebsite?.value}
              name="existingWebsite"
              onChange={(e) => handleInputChange(e.target.name, e.target.value)}
            />
          </FormField>
          <FormField label={"Existing Website Information (Optional)"}>
            <FormInputTextArea
              value={formData?.existingWebsiteInfo?.value}
              onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              styleName={"text-area"}
              name="existingWebsiteInfo"
              placeholder={
                "Anything we should know about your existing website"
              }
            />
          </FormField>
        </div>
      </PageRow>
    </div>
  );
};

WebsitePurposeForm.defaultProps = {
  price: 0,
  serviceType: "",
};

WebsitePurposeForm.propTypes = {
  estimate: PT.shape().isRequired,
  price: PT.string,
  serviceType: PT.string,
  formData: PT.shape(),
  setFormData: PT.func,
};

export default WebsitePurposeForm;
