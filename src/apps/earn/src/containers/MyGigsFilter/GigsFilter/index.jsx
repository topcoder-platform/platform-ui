import React, { useEffect, useRef } from "react";
import PT from "prop-types";
import _ from "lodash";
import RadioButton from "../../../components/RadioButton";
import * as utils from "../../../utils";

import styles from "./styles.scss";

export function createBadgeElement(htmlElement, content) {
  const badgeElement = document.createElement("span");

  badgeElement.classList.add(`${styles["count-badge"]}`);
  badgeElement.textContent = content;
  htmlElement.appendChild(badgeElement);

  return badgeElement;
}

const GigsFilter = ({
  gigStatus,
  gigsStatuses,
  updateGigFilter,
  openJobsCount,
}) => {
  const bucketOptions = utils.createRadioOptions(gigsStatuses, gigStatus);

  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const openJobsElement = ref.current.children[0].children[1];
    const badgeElement = createBadgeElement(
      openJobsElement,
      `${openJobsCount}`
    );

    return () => {
      badgeElement.parentElement.removeChild(badgeElement);
    };
  }, [openJobsCount]);

  return (
    <div className="filter">
      <div className="buckets vertical-list" ref={ref}>
        <RadioButton
          options={bucketOptions}
          onChange={(newBucketOptions) => {
            const filterChange = {
              status: utils.getSelectedRadioOption(newBucketOptions).label,
            };
            updateGigFilter(filterChange);
          }}
        />
        <span></span>
      </div>
    </div>
  );
};

GigsFilter.propTypes = {
  gigStatus: PT.string,
  gigsStatuses: PT.arrayOf(PT.string),
  updateGigFilter: PT.func,
  openJobsCount: PT.number,
};

export default GigsFilter;
