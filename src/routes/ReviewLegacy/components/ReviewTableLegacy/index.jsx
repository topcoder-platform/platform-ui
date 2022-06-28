import React, { useState } from "react";
import { Link } from "@reach/router";
import _ from "lodash";
import classNames from "classnames";
import PageDivider from "../../../../components/PageDivider";
import { PROGRESS_LEVELS } from "../../../../constants/products/WebsiteDesignLegacy";
import { ReactComponent as ArrowIcon } from "../../../../assets/images/icon-arrow.svg";
import styles from "./styles.module.scss";

/**
 * Review Table Component
 */
const ReviewTableLegacy = ({ formData, enableEdit = true }) => {
  const [steps, setSteps] = useState([
    { id: 0, label: "Basic Info", value: "basicInfo", isOpen: true },
    { id: 1, label: "Website Purpose", value: "websitePurpose", isOpen: true },
    { id: 2, label: "Page Details", value: "pageDetails", isOpen: true },
    { id: 3, label: "Branding", value: "branding", isOpen: true },
  ]);

  const setStepToggler = (id) => {
    const newSteps = steps.map((item) =>
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    );

    setSteps(newSteps);
  };

  const formatOption = (option) => {
    if (_.isArray(option)) return option.join(", ");
    if (_.isObject(option)) {
      return formatOption(_.get(option, "option", option));
    }
    return option;
  };

  const renderOption = (option, title) => {
    return (
      <div>
        {option.option && (
          <div className={styles["detail"]}>
            <div className={styles["itemWrapper"]}>
              <p className={styles["item"]}>{option.title || title}</p>
            </div>
            <p className={styles["key"]}>{formatOption(option.option)}</p>
          </div>
        )}
      </div>
    );
  };

  const renderDetails = (step) => {
    let items = formData[step.value] || {};
    if (formData?.workType?.selectedWorkType === "Find Me Data") {
      items = _.omit(items, ["assetsUrl", "goals"]);
    } else {
      items = _.omit(items, [
        "analysis",
        "primaryDataChallenge",
        "primaryDataChallengeOther",
        "sampleData",
      ]);
    }
    return Object.keys(items).map((key) => {
      if (_.isArray(items[key]))
        return _.map(items[key], (item, i) => (
          <div className={styles["detail"]} key={i}>
            <div className={styles["itemWrapper"]}>
              <p className={styles["item"]}>
                {key} {i + 1}
              </p>
            </div>
            <p className={styles["key"]}>
              {Object.keys(item).map((subKey) =>
                renderOption(item[subKey], subKey)
              )}
            </p>
          </div>
        ));
      return renderOption(items[key]);
    });
  };

  const renderPageDetails = (step) => {
    const items = formData[step.value] || {};
    const pages = items?.pages || [];

    return pages.map((page, index) => {
      return (
        <div>
          {page?.pageName && (
            <div className={styles["detail"]}>
              <div className={styles["itemWrapper"]}>
                <p className={styles["item"]}>Page {index + 1} Name</p>
              </div>
              <p className={styles["key"]}>{page?.pageName}</p>
            </div>
          )}
          {page?.pageDetails && (
            <div className={styles["detail"]}>
              <div className={styles["itemWrapper"]}>
                <p className={styles["item"]}>Page {index + 1} Requirements</p>
              </div>
              <p className={styles["key"]}>{page?.pageDetails}</p>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {steps
        .filter((s) => {
          if (s.value === "pageDetails")
            return _.get(formData[s.value], "pages[0].pageDetails") !== "";
          return !!formData[s.value];
        })
        .map((step, index) => {
          let redirectPage = PROGRESS_LEVELS.find(
            (item) => item.label === step.label
          );
          return (
            <>
              <div
                className={styles["header"]}
                role="button"
                tabIndex={0}
                onClick={() => setStepToggler(index)}
              >
                <p className={styles["stepLabel"]}>
                  {step.label}
                  {enableEdit && (
                    <Link className={styles["link"]} to={redirectPage.url}>
                      edit
                    </Link>
                  )}
                </p>
                <div
                  className={classNames(styles["icon"], step.isOpen ? styles["open"] : null)}
                >
                  <ArrowIcon />
                </div>
              </div>

              {step.isOpen
                ? step.value === "pageDetails"
                  ? renderPageDetails(step)
                  : renderDetails(step)
                : null}

              <PageDivider />
            </>
          );
        })}
    </>
  );
};

export default ReviewTableLegacy;
