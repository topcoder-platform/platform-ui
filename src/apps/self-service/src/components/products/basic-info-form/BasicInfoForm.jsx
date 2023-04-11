/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Basic Info Form component
 */
import { useEffect, useState } from "react";
import classNames from "classnames";
import PT from "prop-types";
import _ from "lodash";

import { HelpBanner } from "../../banners";
import { HelpIcon } from "../../help-icon";
import { RadioButton } from "../../radio-button";
import { ColorOptions, FormField, FormInputText, FormInputTextArea } from "../../form-elements";
import { HELP_BANNER, PrimaryDataChallengeOptions, ColorOptionsItems } from "../../../config";
import { ReactComponent as DataExplorationIcon } from "../../../assets/images/data-exploration-icon.svg";
import { ReactComponent as FindMeDataIcon } from "../../../assets/images/find-me-data-icon.svg";
import { ReactComponent as AddWebsiteIcon } from "../../../assets/images/add-website-icon.svg";
import { StylesOptionsModal } from "../styles-options-modal";
import { StyleOptions } from "../style-options";
import { WorkServicePrice } from "../../work-service-price";
import { PageDivider, PageP, PageRow } from "../../page-elements";
import { WorkType, WorkTypeCategoryDesignIcon } from "../../../lib";

import styles from "./styles.module.scss";

const BasicInfoForm = ({
  formData,
  serviceType,
  onFormUpdate,
  onShowSupportModal,
  estimate,
  bannerData,
  saveForm,
}) => {
  const handleInputChange = (name, value, option = "") => {
    onFormUpdate({ ...formData, [name]: { ...formData[name], option, value } });
  };
  const [primaryDataChallenge, setPrimaryDataChallenge] = useState(
    PrimaryDataChallengeOptions
  );
  const [selectedStyleOption, setSelectedStyleOption] = useState(null);

  let selectedColor = formData.colorOption;

  const {
    title,
    type,
    helperBannerTitle,
    helperBannerContent,
    aboutBannerTitle,
    aboutBannerContent,
  } = bannerData;

  const isDataExploration = type === WorkType.data;
  const isDataAdvisory = type === WorkType.problem;
  const isFindMeData = type === WorkType.findData;
  const isWebsiteDesign = type === WorkType.design;
  const isOtherOptionSelected = formData?.primaryDataChallenge?.value !== 3;

  const handleArrayInputChange = (index, name, key, value, option = null) => {
    onFormUpdate((formData) => {
      const newFormData = {
        ...formData,
      };

      if (!newFormData[name]) {
        newFormData[name] = [
          {
            website: { name, value, option: option ? option : value },
            feedback: { name, value, option: option ? option : value },
          },
        ];
      }

      newFormData[name][index][key] = {
        name,
        value,
        option: option ? option : value,
      };

      return newFormData;
    });
  };

  const addWebsite = () => {
    onFormUpdate((formData) => {
      const newFormData = {
        ...formData,
        inspiration: [
          ...(formData.inspiration || []),
          {
            website: { name: "Website", value: "", option: "" },
            feedback: { name: "Feedback", value: "", option: "" },
          },
        ],
      };

      return newFormData;
    });
  };

  const removeWebsite = (index) => {
    onFormUpdate((formData) => {
      const newFormData = {
        ...formData,
      };
      newFormData.inspiration.splice(index, 1);

      return newFormData;
    });
  };

  useEffect(() => {
    const itemSelected = formData?.primaryDataChallenge;

    if (itemSelected?.option && primaryDataChallenge[0]) {
      const newDeliverableOptions = primaryDataChallenge.map((o) => {
        o.value = o.label === itemSelected.option;
        return o;
      });
      setPrimaryDataChallenge(newDeliverableOptions);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.primaryDataChallenge]);

  useEffect(() => {
    if (
      isOtherOptionSelected &&
      formData?.primaryDataChallengeOther?.value?.trim().length
    ) {
      handleInputChange("primaryDataChallengeOther", "", "");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDataChallenge, setPrimaryDataChallenge]);

  let servicePriceIcon;
  switch (title) {
    case WorkType.data:
    case WorkType.problem:
      servicePriceIcon = <DataExplorationIcon />;
      break;
    case WorkType.findData:
      servicePriceIcon = <FindMeDataIcon />;
      break;
    case WorkType.design:
      servicePriceIcon = <WorkTypeCategoryDesignIcon />;
      break;
    default:
      break;
  }

  return (
    <div className={styles["basicInfoForm"]}>
      <WorkServicePrice
        price={estimate?.total}
        stickerPrice={estimate?.stickerPrice}
        duration={estimate?.totalDuration}
        serviceType={serviceType}
        hideTitle
        showIcon
        icon={servicePriceIcon}
      />
      <HelpBanner defaultOpen title={helperBannerTitle} styles={["gray"]}>
        {helperBannerContent}
      </HelpBanner>

      <HelpBanner title={aboutBannerTitle} styles={["turqoise"]}>
        {aboutBannerContent}
      </HelpBanner>

      <PageDivider />

      <PageRow className={styles["form-row"]}>
        <div>
          <PageP styleName="title">PROJECT TITLE</PageP>
          {isWebsiteDesign && (
            <PageP styleName="description">
              Give your project a descriptive title. This is the name designers
              will see when looking for your work.
            </PageP>
          )}
          {(isDataExploration || isFindMeData || isDataAdvisory) && (
            <PageP styleName="description">
              Give your project a descriptive title. This is what the data
              scientists will see when looking for your work.
            </PageP>
          )}
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
              onBlur={() => saveForm(false, true)}
            />
          </FormField>
        </div>
      </PageRow>

      <PageDivider />

      {isDataExploration && (
        <>
          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">Share Your Data (optional)</PageP>
              <PageP styleName="description">
                Add links (separate multiple links with commas) or upload your
                data files here. Not ready or able to share? No problem, we'll
                work with you on that later.
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <div className={styles["assets"]}>
                <FormField label={"Shareable URL Link(s)"}>
                  <FormInputText
                    placeholder={"www.example-share-link.com"}
                    value={formData?.assetsUrl?.value}
                    name="assetsUrl"
                    onChange={(e) =>
                      handleInputChange(
                        e.target.name,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">{"what would you like to learn?"}</PageP>
              <PageP styleName="description">
                Describe your data and what you would like to learn about it. If
                you have a formal problem statement, please share it.
              </PageP>
              <HelpBanner title="Example" styles={["gray"]}>
                <br />
                <PageP>
                  I spend money on marketing for my website, but it's hard to
                  know which marketing option works best. I make money from
                  advertising, so the more people that visit my site and engage
                  with something, the more ad money I can make. I shared the
                  reports I have from the past year for each of my 3 marketing
                  channels. I'd like to know how that data can help understand
                  where to focus my marketing spend.
                </PageP>
              </HelpBanner>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <FormField label={"Goals & Data Description"}>
                <FormInputTextArea
                  value={formData?.goals?.value}
                  onChange={(e) =>
                    handleInputChange(
                      e.target.name,
                      e.target.value,
                      e.target.value
                    )
                  }
                  name="goals"
                  placeholder={"Enter your goals and descriptions here"}
                />
              </FormField>
            </div>
          </PageRow>
        </>
      )}

      {isFindMeData && (
        <>
          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">{"What Data Do You Need?"}</PageP>
              <PageP styleName="description">
                Briefly describe the analysis you want to do, and the type of
                data you're looking for to do it. Be sure to include any
                critical data requirements, such as specific geographies,
                demographics, date ranges and/or key variables needed for your
                analysis.{" "}
              </PageP>
              <HelpBanner title="Example" styles={["gray"]}>
                <br />
                <PageP>
                  I'm a real estate investor & want to diversify into other
                  cities in Texas. Currently, we only invest in Dallas Fort
                  Worth. We're looking for 3-5 other cities in Texas to invest.
                  I'd like to evaluate rental demand and occupancy rates,
                  property price vs. avg rental payments, job and population
                  growth compared to state and national averages, and the trends
                  of renter-occupied households compared to homeowners. I think
                  there's data on sites like{" "}
                  <a target="_blank" href="https://www.zillow.com/" rel="noreferrer">
                    {" "}
                    zillow.com
                  </a>{" "}
                  and{" "}
                  <a target="_blank" href="https://www.hotpads.com/" rel="noreferrer">
                    {" "}
                    hotpads.com
                  </a>
                  , but it's hard to find and organize.
                </PageP>
                <br />
                <PageP>
                  Not sure what data you need? Consider{" "}
                  <a target="_blank" href="https://topcoder.com" rel="noreferrer">
                    {" "}
                    Problem Statement & Data Advisory
                  </a>{" "}
                  to get clarity on the best data & approach for your goals.
                </PageP>
              </HelpBanner>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <FormField label={"Analysis & Data Description"}>
                <FormInputTextArea
                  value={formData?.analysis?.value}
                  onChange={(e) =>
                    handleInputChange(
                      e.target.name,
                      e.target.value,
                      e.target.value
                    )
                  }
                  name="analysis"
                  placeholder={
                    "Describe your analysis goal and data requirements"
                  }
                />
              </FormField>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">{"Primary Data Challenge"}</PageP>
              <PageP styleName="description">
                Select the primary data challenge you're facing.
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <RadioButton
                onChange={(items) => {
                  const selectedOption = items.findIndex((item) => item.value);
                  const foundOption = items.find((item) => item.value);
                  handleInputChange(
                    "primaryDataChallenge",
                    selectedOption,
                    foundOption.label
                  );
                }}
                size="lg"
                options={primaryDataChallenge}
              />
              <br />
              <FormField
                label={"Primary Data Challenge"}
                disabled={isOtherOptionSelected}
              >
                <FormInputText
                  placeholder={"Specify your primary data challenge"}
                  value={formData?.primaryDataChallengeOther?.value}
                  name="primaryDataChallengeOther"
                  onChange={(e) =>
                    handleInputChange(
                      e.target.name,
                      e.target.value,
                      e.target.value
                    )
                  }
                  disabled={isOtherOptionSelected}
                />
              </FormField>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">Sample Data</PageP>
              <PageP styleName="description">
                Sample data helps us understand your data needs. Often this is a
                simple CSV/Excel table that shows the data labels (usually the
                title of each column or row) and two or more rows of example
                input data. Example: FName is a data label, 'Ankit' is input
                data.
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <div className={styles["assets"]}>
                <FormField label={"Shareable URL Link(s)"}>
                  <FormInputText
                    placeholder={"www.example-share-link.com"}
                    value={formData?.sampleData?.value}
                    name="sampleData"
                    onChange={(e) =>
                      handleInputChange(
                        e.target.name,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>
            </div>
          </PageRow>
        </>
      )}

      {isDataAdvisory && (
        <>
          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">{"what’s your goal?"}</PageP>
              <PageP styleName="description">
                Describe what you want to do or learn with the help of data
                science. What will this information or ability help improve?
                Keep in mind that data science typically answers a question.
                Good questions are specific, measurable and clarify important
                context. This ensures that when your question is answered, you
                learn something valuable and actionable.
              </PageP>
              <HelpBanner title="Description Tips" styles={["gray"]}>
                <br />
                <PageP>
                  How can I increase profit? How can I get more customers? How
                  can I do computer vision? These questions alone are too vague.
                  Which piece of equipment is going to fail first? Which of my
                  marketing channels produces the most customers per dollar? How
                  can I automatically review pictures or documents to for
                  specific content? These questions along with relevant data
                  and/or context enable our experts to shape your question into
                  something actionable. Don't worry, we'll help you along the
                  way. So let's get started!
                </PageP>
              </HelpBanner>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <FormField label={"Your Goal"}>
                <FormInputTextArea
                  value={formData?.goals?.value}
                  onChange={(e) =>
                    handleInputChange(
                      e.target.name,
                      e.target.value,
                      e.target.value
                    )
                  }
                  name="goals"
                  placeholder={"Describe your goal"}
                />
              </FormField>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">What data do you have?</PageP>
              <PageP styleName="description">
                The data you have available helps determine your data science
                approach. Briefly describe the data you have in mind for your
                project. What is it and how do you use it today? How much do you
                have, and how/how often do you get more? Once you've described
                the data, please upload a sample.
                <br />
                <div className={styles["helpText"]}>
                  No data?&nbsp;
                  <HelpIcon>
                    No problem. Based on your goals we'll recommend the type(s)
                    of data you need.
                  </HelpIcon>
                </div>
                <div className={styles["helpText"]}>
                  Can't share/upload?&nbsp;
                  <HelpIcon>
                    Try sharing a sample. Samples can be just the headers,
                    labels or titles of your data set. Our experts need to
                    understand the type, volume and structure of your data, not
                    the contents themselves.
                  </HelpIcon>
                </div>
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <div className={styles["assets"]}>
                <FormField label={"Shareable URL Link(s)"}>
                  <FormInputText
                    placeholder={"www.example-share-link.com"}
                    value={formData?.sampleData?.value}
                    name="sampleData"
                    onChange={(e) =>
                      handleInputChange(
                        e.target.name,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>
              <FormField label={"Data Description"}>
                <FormInputTextArea
                  value={formData?.assetsDescription?.value}
                  onChange={(e) =>
                    handleInputChange(
                      e.target.name,
                      e.target.value,
                      e.target.value
                    )
                  }
                  name="assetsDescription"
                  placeholder={"Describe your data"}
                />
              </FormField>
            </div>
          </PageRow>
        </>
      )}

      {isWebsiteDesign && (
        <>
          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">{"Description"}</PageP>
              <PageP styleName="description">
                What is the purpose of your website? What do you want visitors
                to be able to do, e.g., see your work? Contact you? You should
                include a general description as well as goals of the website.
                You may also describe your audience and what you would like them
                to do at your website.{" "}
              </PageP>
              <HelpBanner title="Example" styles={["gray"]}>
                <br />
                <PageP>
                  <PageP>
                    I would like a design for a dog walking website that allows
                    visitors to select dog walkers and schedule dog walking
                    appointments.
                  </PageP>
                  <PageP>
                    The audience for my website will be dog owners. As a dog
                    owner, I want someone trustworthy to walk my dog, so he
                    feels loved while I’m at work.
                  </PageP>
                  <PageP>
                    Home Page:
                    <br />I would like to see a landing screen to welcome our
                    customers and make them feel welcome and warm. We love their
                    dog and we want them to feel it! We really want our audience
                    to do one core action and that’s to get started finding
                    their perfect “Walkie” which is what we call our
                    professional dog walkers.
                  </PageP>
                  <PageP>
                    Information Pages:
                    <br />
                    Our customers should be able to reach information about: Our
                    Services, Our Walkies, and Locations We Serve. Also, a user
                    must be able to Create an Account.
                  </PageP>
                  <PageP>
                    Our Services include: dog walking, doggie day care, dog
                    feeding, basic grooming.
                  </PageP>
                  <PageP>
                    Our Walkies information should show a photo of the Walkie,
                    their name and a little bit about them. It’s important for
                    customers to see a badge of some sort that indicates all of
                    our dog walkers are insured.
                  </PageP>
                  <PageP>
                    Locations We Serve: We have 3 locations in the greater
                    Seattle area.
                  </PageP>
                  <PageP>
                    Each page should include a testimonial from one of our
                    users. For example: “WalkieDoggie is perfect. They are
                    always professional and they take amazing care of our dog,
                    Beefcake. - Victoria B. from Tacoma, Washington”
                  </PageP>
                </PageP>
              </HelpBanner>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <FormField label={"Description"}>
                <FormInputTextArea
                  value={formData?.analysis?.value}
                  onChange={(e) =>
                    handleInputChange(
                      e.target.name,
                      e.target.value,
                      e.target.value
                    )
                  }
                  name="analysis"
                  placeholder={"Describe your website"}
                />
              </FormField>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">Your industry</PageP>
              <PageP styleName="description">
                Knowing your industry will help our designers understand you and
                your audience. For example, some common industries are: Business
                & Consulting, Construction, Entertainment & Arts, Healthcare,
                Retail, and Technology.
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <div>
                <FormField label={"Your Industry"}>
                  <FormInputText
                    placeholder={"Enter your industry"}
                    value={formData?.yourIndustry?.value}
                    name="yourIndustry"
                    onChange={(e) =>
                      handleInputChange(
                        e.target.name,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">inspiration</PageP>
              <PageP styleName="description">
                Are there websites that you love, from which our designers may
                draw inspiration? Share the website URLs and tell us what you
                like about them.
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              {_.map(_.get(formData, "inspiration", []), (entry, index) => (
                <div key={index}>
                  {index ? (
                    <div
                      role="button"
                      tabIndex="0"
                      className={styles["remove-website"]}
                      onClick={() => removeWebsite(index)}
                    >
                      Remove Website
                    </div>
                  ) : null}
                  <FormField label={"Website Address (optional)"}>
                    <FormInputText
                      placeholder={"Enter website url. e.g. www.acme.com"}
                      value={entry.website.value}
                      name="website"
                      onChange={(e) =>
                        handleArrayInputChange(
                          index,
                          "inspiration",
                          e.target.name,
                          e.target.value
                        )
                      }
                    />
                  </FormField>
                  <FormField label={"What Do You Like (optional)"}>
                    <FormInputTextArea
                      value={entry.feedback.value}
                      onChange={(e) =>
                        handleArrayInputChange(
                          index,
                          "inspiration",
                          e.target.name,
                          e.target.value
                        )
                      }
                      name="feedback"
                      placeholder={"Describe what you like about this website"}
                    />
                  </FormField>
                </div>
              ))}
              <button className={styles["addWebsiteButton"]} onClick={addWebsite}>
                {" "}
                <AddWebsiteIcon />
                Add Another Website
              </button>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <PageP styleName="title">STYLE &amp; THEME</PageP>
          </PageRow>

          <PageRow className={styles["form-row"]}>
            <div className={classNames(styles["formFieldWrapper"], styles["style-picker"])}>
              <PageP styleName="label">
                Let us know the visual styles you like or dislike (optional):
              </PageP>
              <div className={styles["styles"]}>
                <StyleOptions
                  likes={formData?.likedStyles?.value}
                  dislikes={formData?.dislikedStyles?.value}
                  onSelect={(style) => setSelectedStyleOption(style)}
                  onLike={(likes) => {
                    handleInputChange("likedStyles", likes, likes);
                  }}
                  onDislike={(dislikes) => {
                    handleInputChange("dislikedStyles", dislikes, dislikes);
                  }}
                />
              </div>
              <PageRow className={styles["form-row"]}>
                <div>
                  <PageP styleName="label">
                    Additional details about your look & feel preferences:
                  </PageP>
                </div>
                <div className={styles["formFieldWrapper"]}>
                  <FormField label={`Style Preferences (optional)`}>
                    <FormInputTextArea
                      value={formData?.stylePreferences?.value}
                      onChange={(e) =>
                        handleInputChange(e.target.name, e.target.value)
                      }
                      name="stylePreferences"
                      placeholder={"Describe your ideal look & feel"}
                    />
                  </FormField>
                </div>
              </PageRow>
            </div>
          </PageRow>

          {selectedStyleOption && (
            <StylesOptionsModal
              style={selectedStyleOption}
              likes={formData?.likedStyles?.value}
              dislikes={formData?.dislikedStyles?.value}
              onLike={(likes) => {
                handleInputChange("likedStyles", likes, likes);
              }}
              onDislike={(dislikes) => {
                handleInputChange("dislikedStyles", dislikes, dislikes);
              }}
              onDismiss={() => setSelectedStyleOption(null)}
            />
          )}

          <PageRow className={styles["form-row"]}>
            <div className={classNames(styles["formFieldWrapper"], styles["color-picker"])}>
              <PageP styleName="label">
                Choose colors you would like our designers to use in your site
                design:
              </PageP>
              <div className={styles["colors"]}>
                <ColorOptions
                  colors={ColorOptionsItems}
                  selectedColor={selectedColor}
                  onSelect={(index, colorName) => {
                    handleInputChange("colorOption", index, colorName);
                  }}
                />
              </div>
              <PageRow className={styles["form-row"]}>
                <div>
                  <PageP styleName="label">
                    List any specific colors you would like used in your design:
                  </PageP>
                </div>
                <div className={styles["formFieldWrapper"]}>
                  <FormField
                    label={`List Specific Colors ${selectedColor?.value?.length > 0 ? "(optional)" : ""
                      }`}
                  >
                    <FormInputTextArea
                      value={formData?.specificColor?.value}
                      onChange={(e) =>
                        handleInputChange(e.target.name, e.target.value)
                      }
                      name="specificColor"
                      placeholder={
                        "Specify colors using their value in RGB, CMYK, or Hex"
                      }
                    />
                  </FormField>
                </div>
              </PageRow>
            </div>
          </PageRow>

          <PageDivider />

          <PageRow className={styles["form-row"]}>
            <div>
              <PageP styleName="title">share your brand or style assets</PageP>
              <PageP styleName="description">
                If you have them, gather and upload any assets that you think
                might be helpful for our designers. Let us know if there is
                anything you would like to communicate about these items. <br />
                Assets could be:
                <ul className={styles["list"]}>
                  <li>your logo</li>
                  <li>your brand guide</li>
                  <li>mood boards</li>
                  <li>font files</li>
                  <li>sketches or other inspiration</li>
                </ul>
              </PageP>
            </div>

            <div className={styles["formFieldWrapper"]}>
              <div className={styles["assets"]}>
                <FormField label={"Shareable URL Link(s)"}>
                  <FormInputText
                    placeholder={"www.example-share-link.com"}
                    value={formData?.assetsUrl?.value}
                    name="assetsUrl"
                    onChange={(e) =>
                      handleInputChange(
                        e.target.name,
                        e.target.value,
                        e.target.value
                      )
                    }
                  />
                </FormField>
                <FormField label={"About Your Assets (optional)"}>
                  <FormInputTextArea
                    value={formData?.assetsDescription?.value}
                    onChange={(e) =>
                      handleInputChange(
                        e.target.name,
                        e.target.value,
                        e.target.value
                      )
                    }
                    name="assetsDescription"
                    placeholder={"Describe what you would like us to know"}
                  />
                </FormField>
              </div>
            </div>
          </PageRow>
        </>
      )}

      <PageDivider />

      <HelpBanner
        title={HELP_BANNER.title}
        description={HELP_BANNER.description}
        contactSupport={onShowSupportModal}
      />
    </div>
  );
};

BasicInfoForm.defaultProps = {
  serviceType: "",
};

BasicInfoForm.propTypes = {
  estimate: PT.shape().isRequired,
  serviceType: PT.string,
  onFormUpdate: PT.func,
  formData: PT.shape(),
  bannerData: PT.shape().isRequired,
};

export default BasicInfoForm;
