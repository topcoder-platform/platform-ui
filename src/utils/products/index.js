import _ from 'lodash';

import { WorkType, workFactoryMapFormData } from "../../../src-ts";
import {
  getFindMeDataPriceAndTimelineEstimate,
  getDataAdvisoryPriceAndTimelineEstimate,
  getDataExplorationPriceAndTimelineEstimate,
  getWebsiteDesignPriceAndTimelineEstimate,
} from "../../utils/";
import {
  DEFAULT_TIMELINE as findMeDataTimeline,
  CHALLENGE_FIELD_VALUES as findMeDataChallengeValues,
} from "../../constants/products/FindMeData";
import {
  DEFAULT_TIMELINE as dataAdvisoryTimeline,
  CHALLENGE_FIELD_VALUES as dataAdvisoryChallengeValues,
} from "../../constants/products/DataAdvisory";
import {
  DEFAULT_TIMELINE as dataExplorationTimeline,
  CHALLENGE_FIELD_VALUES as dataExplorationChallengeValues,
} from "../../constants/products/DataExploration";
import {
  DEFAULT_TIMELINE as websiteDesignTimeline,
  CHALLENGE_FIELD_VALUES as websiteDesignChallengeValues,
} from "../../constants/products/WebsiteDesign";

export function formatChallengeCreationBody(workType) {
  const [challengeFieldValues, tags] = getCreationConfigs(workType);
  return {
    description: "Information not provided",
    discussions: [
      {
        name: "new-self-service-project",
        type: "challenge",
        provider: "vanilla",
      },
    ],
    legacy: {
      selfService: true,
    },
    name: "new-self-service-project",
    tags,
    timelineTemplateId: challengeFieldValues.timelineTemplateId,
    trackId: challengeFieldValues.trackId,
    typeId: challengeFieldValues.typeId,
  };
}

export function formatChallengeUpdateBody(intakeForm, workType) {
  const form = JSON.parse(intakeForm)?.form;
  const data = workFactoryMapFormData(
    form?.workType?.selectedWorkType,
    form?.basicInfo
  );

  const intakeMetadata = [
    {
      name: "intake-form",
      value: intakeForm,
    },
  ];

  //This is the Markdown string that gets displayed in Work Manager app and others
  const templateString = [];

  data.forEach((formDetail) => {
    if (Object.keys(formDetail).length <= 0) return;

    const formattedValue = formatOption(formDetail.value);

    intakeMetadata.push({
      name: formDetail.key,
      value: formattedValue,
    });
    templateString.push(`### ${formDetail.title}\n\n${formattedValue}\n\n`);
  });

  if (isDataScience(workType)) {
    templateString.push(
      "## Final Submission Guidelines \n\n Please submit a zip file containing your analysis/solution."
    );
  }

  const [prizes, timeline] = getPrizesAndTimeline(workType);

  const body = {
    description: templateString.join(""),
    metadata: intakeMetadata,
    name: form?.basicInfo?.projectTitle?.value,
  };

  if (prizes) {
    body.prizeSets = prizes.prizeSets;
    body.phases = timeline;
  }

  return body;
}

function formatOption(detail) {
  const noInfoProvidedText = "Not provided";
  const isEmpty = checkIsEmpty(detail);

  if (isEmpty) {
    return noInfoProvidedText;
  }
  if (_.isArray(detail)) {
    return detail.join("\n\n");
  }
  if (_.isObject(detail)) {
    return Object.keys(detail)
      .map((key) => {
        const value = detail[key] || noInfoProvidedText;
        return `${key}: ${value}`;
      })
      .join("\n\n");
  }
  return detail;
}

function checkIsEmpty(detail) {
  return (
    !detail ||
    (typeof detail === "string" && detail.trim().length === 0) ||
    (_.isArray(detail) && detail.length === 0) ||
    (_.isObject(detail) &&
      Object.values(detail).filter((val) => val && val.trim().length !== 0)
        .length === 0)
  );
}

const getCreationConfigs = (workType) => {
  switch (workType) {
    case WorkType.data:
      return [dataExplorationChallengeValues, ["Data Science"]];
    case WorkType.design:
      return [websiteDesignChallengeValues, ["Website Design"]];
    case WorkType.findData:
      return [findMeDataChallengeValues, ["Find Me Data", "Data Science"]];
    case WorkType.problem:
      return [dataAdvisoryChallengeValues, ["Data Science"]];
    default:
      return [];
  }
};

const getPrizesAndTimeline = (workType) => {
  switch (workType) {
    case WorkType.data:
      return [
        getDataExplorationPriceAndTimelineEstimate(),
        dataExplorationTimeline,
      ];
    case WorkType.design:
      return [
        getWebsiteDesignPriceAndTimelineEstimate(),
        websiteDesignTimeline,
      ];
    case WorkType.findData:
      return [getFindMeDataPriceAndTimelineEstimate(), findMeDataTimeline];
    case WorkType.problem:
      return [getDataAdvisoryPriceAndTimelineEstimate(), dataAdvisoryTimeline];
    default:
      return [];
  }
};

const isDataScience = (workType) => {
  return [WorkType.data, WorkType.findData, WorkType.problem].includes(
    workType
  );
};
