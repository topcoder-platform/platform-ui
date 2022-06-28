/**
 * Page Details Form component
 */
import FormField from "components/FormElements/FormField";
import FormInputText from "components/FormElements/FormInputText";
import FormInputTextArea from "components/FormElements/FormInputTextArea";
import HelpBanner from "components/HelpBanner";
import PageDivider from "components/PageDivider";
import PageH3 from "components/PageElements/PageH3";
import PageP from "components/PageElements/PageP";
import PageRow from "components/PageElements/PageRow";
import PageListInput from "components/PageListInput";
import ServicePrice from "components/ServicePrice";
import PT from "prop-types";
import React from "react";
import "./styles.module.scss";

const PageDetailsForm = ({
  savePageDetails,
  listInputs,
  setListInputs,
  serviceType,
  estimate,
}) => {
  // get an empty page item
  const emptyPage = () => ({
    pageName: "",
    pageDetails: "",
  });

  // handle list input changes
  const handleListInputChange = (listInputName, index, inputName, value) => {
    setListInputs((listInputs) => {
      let listInput = listInputs[listInputName];
      let newListInput = listInput.map((item, i) => {
        if (i !== index) return item;
        else return { ...item, [inputName]: value };
      });
      const listInputUpdated = { ...listInputs, [listInputName]: newListInput };
      savePageDetails(listInputUpdated);
      return listInputUpdated;
    });
  };

  // add an item to a list input
  const addListInputItem = (listInputName) => {
    setListInputs((listInputs) => {
      let listInput = listInputs[listInputName];
      let newListInput = [...listInput, emptyPage()];
      const listInputUpdated = { ...listInputs, [listInputName]: newListInput };
      savePageDetails(listInputUpdated);
      return listInputUpdated;
    });
  };

  // remove an item from list input
  const removeListInputItem = (listInputName, index) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setListInputs((listInputs) => {
      let listInput = listInputs[listInputName];
      let newListInput = listInput.filter((item, i) => {
        return i !== index;
      });
      const listInputUpdated = { ...listInputs, [listInputName]: newListInput };
      savePageDetails(listInputUpdated);
      return listInputUpdated;
    });
  };

  return (
    <div styleName="pageDetailsForm">
      <ServicePrice
        price={estimate.total}
        duration={estimate.totalDuration}
        stickerPrice={estimate?.stickerPrice}
        serviceType={serviceType}
      />
      <PageDivider />
      <PageRow styleName="form-row">
        <div>
          <PageP styleName="title">Describe each page</PageP>
          <PageP styleName="description">
            <PageP>
              For each page (or screen) required in your design project, please
              provide:
            </PageP>
            <ol styleName="list">
              <li>A descriptive page name (e.g. Homepage).</li>
              <li>The primary purpose of the page.</li>
              <li>
                Describe all required content and functional elements. Or,
                reference the content as provided in uploaded resource
                documents.
              </li>
            </ol>
            <HelpBanner title="Example Page description" styles={["gray"]}>
              <PageH3>Page Name</PageH3>
              <PageP>WalkieDoggie Homepage</PageP>
              <PageH3>Requirements & Details </PageH3>
              <PageP>
                The purpose of this screen is to welcome our customers and make
                them feel welcome and warm. We love their dog and we want them
                to feel it!
              </PageP>
              <br />
              <PageP>
                This page is essentially a landing page where we really want
                them to do one core action and that’s to get started finding
                their perfect “Walkie” which is what we call our professional
                dog walkers.
              </PageP>
              <br />
              <PageP>
                {" "}
                Top Navigation:
                <br />
                The top navigation of the website should allow a user to mouse
                over core navigation sections. Our Services, Our Walkies, Our
                Promise, Locations We Serve, FAQs.
              </PageP>
              <br />
              <PageP>
                In the top navigation - top right - I’d like to make sure a user
                can “Create an Account” and if they are logged in, they would
                see their profile image and know they are logged in.
              </PageP>
              <br />
              <PageP>
                Main Body:
                <br />I want to see amazing imagery choice/design here and a
                large tagline that reads, “We Love Your Dog, Too” with a main
                button that says “Find Your Walkie”.
              </PageP>
              <br />
              <PageP>
                On the home screen I would also like to see included: Our
                TrustPilot Rating -{" "}
                <a target="_blank" href="https://www.trustpilot.com/">
                  {" "}
                  https://www.trustpilot.com/{" "}
                </a>{" "}
                - We have a 4.7 out of 5 rating so plz mock up how that will
                look.
              </PageP>
              <br />
              <PageP>
                I want a badge of some sort that indicates all of our dog
                walkers are insured.
              </PageP>
              <br />
              <PageP>
                I want to see one amazing testimonial on the screen that reads…
                “WalkieDoggie is perfect. They are always professional and they
                take amazing care of our dog, Beefcake.” The testimonial is from
                “Victoria B.” from Tacoma, Washington (please use an image of a
                young, professional female for this testimonial image).
              </PageP>
            </HelpBanner>
          </PageP>
        </div>

        <div styleName="formFieldWrapper">
          <PageListInput
            pageCost={estimate.costPerAdditionalPage}
            listInput={listInputs.pages}
            canAdd={listInputs.pages.length < 5}
            name="pages"
            addListInputItem={addListInputItem}
          >
            {listInputs.pages.map((page, index) => (
              <div styleName="page">
                <div styleName="page-header">
                  <div styleName="page-title">Page {index + 1}</div>
                  {index ? (
                    <div
                      role="button"
                      tabIndex="0"
                      styleName="remove-page"
                      onClick={() => removeListInputItem("pages", index)}
                    >
                      Remove Page
                    </div>
                  ) : null}
                </div>
                <FormField label={"Page Name"}>
                  <FormInputText
                    placeholder={"Enter a descriptive name"}
                    value={page.pageName}
                    name="pageName"
                    onChange={(e) =>
                      handleListInputChange(
                        "pages",
                        index,
                        e.target.name,
                        e.target.value
                      )
                    }
                  />
                </FormField>
                <FormField label={"Requirements & Details"}>
                  <FormInputTextArea
                    placeholder={
                      "Enter specific requirements that will be useful for the designers"
                    }
                    value={page.pageDetails}
                    name="pageDetails"
                    onChange={(e) =>
                      handleListInputChange(
                        "pages",
                        index,
                        e.target.name,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>
            ))}
          </PageListInput>
        </div>
      </PageRow>
    </div>
  );
};

PageDetailsForm.defaultProps = {
  price: 0,
  serviceType: "",
};

PageDetailsForm.propTypes = {
  estimate: PT.shape().isRequired,
  price: PT.string,
  serviceType: PT.string,
  setListInputs: PT.func,
  listInputs: PT.arrayOf(PT.shape()),
};

export default PageDetailsForm;
