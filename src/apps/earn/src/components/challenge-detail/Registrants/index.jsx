/* eslint jsx-a11y/no-static-element-interactions:0 */
/**
 * Registrants tab component.
 */

import React from "react";
import PT from "prop-types";
import moment from "moment";
import _ from "lodash";
import config from "../../../config";
import { getRatingLevel } from "../../../utils/tc";

import sortList from "../../../utils/challenge-detail/sort";
import CheckMark from "../icons/check-mark.svg";
import { ReactComponent as ArrowDown } from "../../../assets/images/arrow-down.svg";
import styles from "./style.module.scss";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles)

function formatDate(date) {
  if (!date) return "-";
  return moment(date).local().format("MMM DD, YYYY HH:mm");
}

function getDate(arr, handle) {
  const results = arr
    .filter(
      (a) => _.toString(a.createdBy || a.memberHandle) === _.toString(handle)
    )
    .sort(
      (a, b) =>
        new Date(b.submissionTime || b.submissionDate).getTime() -
        new Date(a.submissionTime || a.submissionDate).getTime()
    );
  return results[0]
    ? results[0].submissionTime || results[0].submissionDate
    : "";
}

function passedCheckpoint(checkpoints, handle, results) {
  const mine = checkpoints.filter(
    (c) => _.toString(c.createdBy) === _.toString(handle)
  );
  return _.some(mine, (m) =>
    _.find(results, (r) => r.submissionId === m.submissionId)
  );
}

function getPlace(results, handle, places) {
  const found = _.find(
    results,
    (w) =>
      _.toString(w.memberHandle) === _.toString(handle) &&
      w.placement <= places &&
      w.submissionStatus !== "Failed Review"
  );

  if (found) {
    return found.placement;
  }
  return -1;
}

export default class Registrants extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      sortedRegistrants: [],
    };

    this.getCheckPoint = this.getCheckPoint.bind(this);
    this.getCheckPointDate = this.getCheckPointDate.bind(this);
    this.getFlagFirstTry = this.getFlagFirstTry.bind(this);
    this.sortRegistrants = this.sortRegistrants.bind(this);
    this.getRegistrantsSortParam = this.getRegistrantsSortParam.bind(this);
    this.updateSortedRegistrants = this.updateSortedRegistrants.bind(this);
  }

  componentDidMount() {
    this.updateSortedRegistrants();
  }

  componentDidUpdate(prevProps) {
    const { registrants, registrantsSort } = this.props;
    if (
      !_.isEqual(prevProps.registrants, registrants) ||
      !_.isEqual(prevProps.registrantsSort, registrantsSort)
    ) {
      this.updateSortedRegistrants();
    }
  }

  /**
   * Get checkpoint date of registrant
   */
  getCheckPointDate() {
    const { challenge } = this.props;
    const checkpointPhase = (challenge.phases || []).find(
      (x) => x.name === "Checkpoint Submission"
    );
    return moment(
      checkpointPhase
        ? checkpointPhase.actualEndDate || checkpointPhase.scheduledEndDate
        : 0
    );
  }

  /**
   * Get checkpoint of registrant
   * @param {Object} registrant registrant info
   */
  getCheckPoint(registrant) {
    const { challenge } = this.props;
    const checkpoints = challenge.checkpoints || [];
    const checkpointDate = this.getCheckPointDate();

    const twoRounds =
      challenge.round1Introduction && challenge.round2Introduction;

    let checkpoint;
    if (twoRounds) {
      checkpoint = getDate(checkpoints, registrant.memberHandle);
      if (
        !checkpoint &&
        moment(registrant.submissionDate).isBefore(checkpointDate)
      ) {
        checkpoint = registrant.submissionDate;
      }
    }

    return checkpoint;
  }

  /**
   * Get final of registrant
   * @param {Object} registrant get checkpoint of registrant
   */
  getFinal(registrant) {
    let final;
    if (moment(registrant.submissionDate).isAfter(this.getCheckPointDate())) {
      final = registrant.submissionDate;
    }
    return final;
  }

  /**
   * Check if it have flag for first try
   * @param {Object} registrant registrant info
   */
  getFlagFirstTry(registrant) {
    const { notFoundCountryFlagUrl } = this.props;
    if (
      !registrant.countryInfo ||
      notFoundCountryFlagUrl[registrant.countryInfo.countryCode]
    ) {
      return null;
    }

    return registrant.countryInfo.countryFlag;
  }

  /**
   * Get registrans sort parameter
   */
  getRegistrantsSortParam() {
    const { registrantsSort } = this.props;
    let { field, sort } = registrantsSort;
    if (!field) {
      field = "Registration Date"; // default field for registrans sorting
    }
    if (!sort) {
      sort = "asc"; // default order for registrans sorting
    }

    return {
      field,
      sort,
    };
  }

  /**
   * Update sorted registrant array
   */
  updateSortedRegistrants() {
    const { registrants } = this.props;
    const sortedRegistrants = _.cloneDeep(registrants);
    this.sortRegistrants(sortedRegistrants);
    this.setState({ sortedRegistrants });
  }

  /**
   * Sort array of registrant
   * @param {Array} registrants array of registrant
   */
  sortRegistrants(registrants) {
    const { field, sort } = this.getRegistrantsSortParam();
    return sortList(registrants, field, sort, (a, b) => {
      let valueA = 0;
      let valueB = 0;
      let valueIsString = false;
      switch (field) {
        case "Country": {
          valueA = a.countryCode;
          valueB = b.countryCode;
          valueIsString = true;
          break;
        }
        case "Rating": {
          valueA = a.rating;
          valueB = b.rating;
          break;
        }
        case "Username": {
          valueA = `${a.memberHandle}`.toLowerCase();
          valueB = `${b.memberHandle}`.toLowerCase();
          valueIsString = true;
          break;
        }
        case "Registration Date": {
          valueA = new Date(a.created);
          valueB = new Date(b.created);
          break;
        }
        case "Round 1 Submitted Date": {
          const checkpointA = this.getCheckPoint(a);
          const checkpointB = this.getCheckPoint(b);
          if (checkpointA) {
            valueA = new Date(checkpointA);
          }
          if (checkpointB) {
            valueB = new Date(checkpointB);
          }
          break;
        }
        case "Submitted Date": {
          const checkpointA = this.getFinal(a);
          const checkpointB = this.getFinal(b);
          if (checkpointA) {
            valueA = new Date(checkpointA);
          }
          if (checkpointB) {
            valueB = new Date(checkpointB);
          }
          break;
        }
        default:
      }

      return {
        valueA,
        valueB,
        valueIsString,
      };
    });
  }

  render() {
    const { challenge, checkpointResults, results, onSortChange } = this.props;
    const { prizeSets, track } = challenge;

    const { sortedRegistrants } = this.state;
    const { field, sort } = this.getRegistrantsSortParam();
    const revertSort = sort === "desc" ? "asc" : "desc";
    const isDesign = track.toLowerCase() === "design";

    const placementPrizes = _.find(prizeSets, { type: "placement" });
    const { prizes } = placementPrizes || [];

    const checkpoints = challenge.checkpoints || [];

    const twoRounds =
      challenge.round1Introduction && challenge.round2Introduction;
    const places = prizes.length;
    return (
      <div
        className={styled(`container ${twoRounds ? "design" : ""}`)}
        role="table"
        aria-label="Registrants"
      >
        <div className={styled("head")} role="row">
          {!isDesign && (
            <button
              type="button"
              onClick={() => {
                onSortChange({
                  field: "Rating",
                  sort: field === "Rating" ? revertSort : "desc",
                });
              }}
              className={styled("col-2 table-header")}
            >
              <span role="columnheader">Rating</span>
              <div
                className={styled("col-arrow", {
                  "col-arrow-sort-asc": field === "Rating" && sort === "asc",
                  "col-arrow-is-sorting": field === "Rating",
                })}
                type="button"
              >
                <ArrowDown />
              </div>
            </button>
          )}
          <button
            onClick={() => {
              onSortChange({
                field: "Username",
                sort: field === "Username" ? revertSort : "desc",
              });
            }}
            type="button"
            className={styled("col-3 table-header")}
          >
            <span role="columnheader">Username</span>
            <div
              className={styled("col-arrow", {
                "col-arrow-sort-asc": field === "Username" && sort === "asc",
                "col-arrow-is-sorting": field === "Username",
              })}
            >
              <ArrowDown />
            </div>
          </button>
          <button
            className={styled("col-4 table-header")}
            onClick={() => {
              onSortChange({
                field: "Registration Date",
                sort: field === "Registration Date" ? revertSort : "desc",
              });
            }}
            type="button"
          >
            <span role="columnheader">Registration Date</span>
            <div
              className={styled("col-arrow", {
                "col-arrow-sort-asc":
                  field === "Registration Date" && sort === "asc",
                "col-arrow-is-sorting": field === "Registration Date",
              })}
            >
              <ArrowDown />
            </div>
          </button>
          {twoRounds && (
            <button
              className={styled("col-5 table-header")}
              onClick={() => {
                onSortChange({
                  field: "Round 1 Submitted Date",
                  sort:
                    field === "Round 1 Submitted Date" ? revertSort : "desc",
                });
              }}
              type="button"
            >
              <span role="columnheader">Round 1 Submitted Date</span>
              <div
                className={styled("col-arrow", {
                  "col-arrow-sort-asc":
                    field === "Round 1 Submitted Date" && sort === "asc",
                  "col-arrow-is-sorting": field === "Round 1 Submitted Date",
                })}
              >
                <ArrowDown />
              </div>
            </button>
          )}
          <button
            onClick={() => {
              onSortChange({
                field: "Submitted Date",
                sort: field === "Submitted Date" ? revertSort : "desc",
              });
            }}
            type="button"
            className={styled("col-6 table-header")}
          >
            <span role="columnheader">
              {twoRounds ? "Round 2 Submitted Date" : "Submitted Date"}
            </span>
            <div
              className={styled("col-arrow", {
                "col-arrow-sort-asc":
                  field === "Submitted Date" && sort === "asc",
                "col-arrow-is-sorting": field === "Submitted Date",
              })}
            >
              <ArrowDown />
            </div>
          </button>
        </div>
        <div className={styled("body")} role="rowgroup">
          {sortedRegistrants.map((r) => {
            const placement = getPlace(results, r.memberHandle, places);
            let checkpoint = this.getCheckPoint(r);
            if (checkpoint) {
              checkpoint = formatDate(checkpoint);
            }
            const final = this.getFinal(r);

            return (
              <div className={styled("row")} key={r.created} role="row">
                {!isDesign && (
                  <div className={styled("col-2")}>
                    <div className={styled("sm-only title")}>Rating</div>
                    <div>
                      <span
                        className={`level-${getRatingLevel(
                          _.get(r, "rating", 0)
                        )}`}
                        role="cell"
                      >
                        {!_.isNil(r.rating) && r.rating !== 0 ? r.rating : "-"}
                      </span>
                    </div>
                  </div>
                )}
                <div className={styled("col-3")}>
                  <span role="cell">
                    <a
                      href={`${config.URL.PLATFORM_WEBSITE}/profile/${r.memberHandle}`}
                      className={
                        isDesign
                          ? ""
                          : `level-${getRatingLevel(_.get(r, "rating", 0))}`
                      }
                      target={`${
                        _.includes(window.origin, "www") ? "_self" : "_blank"
                      }`}
                    >
                      {r.memberHandle}
                    </a>
                  </span>
                </div>
                <div className={styled("col-4")}>
                  <div className={styled("sm-only title")}>Registration Date</div>
                  <span role="cell">{formatDate(r.created)}</span>
                </div>
                {twoRounds && (
                  <div className={styled("col-5")}>
                    <div className={styled("sm-only title")}>Round 1 Submitted Date</div>
                    <div>
                      <span role="cell">{checkpoint}</span>
                      {passedCheckpoint(
                        checkpoints,
                        r.memberHandle,
                        checkpointResults
                      ) && <CheckMark className={styled("passed")} />}
                    </div>
                  </div>
                )}
                <div className={styled("col-6")}>
                  <div className={styled("sm-only title")}>
                    {twoRounds ? "Round 2 " : ""}
                    Submitted Date
                  </div>
                  <div>
                    <span role="cell">{formatDate(final)}</span>
                    {placement > 0 && (
                      <span
                        role="cell"
                        className={`placement ${
                          placement < 4 ? `placement-${placement}` : ""
                        }`}
                      >
                        {placement}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

Registrants.defaultProps = {
  results: [],
  checkpointResults: {},
  registrantsSort: {},
  onSortChange: () => {},
  registrants: [],
};

Registrants.propTypes = {
  challenge: PT.shape({
    phases: PT.arrayOf(
      PT.shape({
        actualEndDate: PT.string,
        name: PT.string.isRequired,
        scheduledEndDate: PT.string,
      })
    ).isRequired,
    checkpoints: PT.arrayOf(PT.shape()),
    subTrack: PT.any,
    prizeSets: PT.arrayOf(PT.shape()).isRequired,
    registrants: PT.arrayOf(PT.shape()).isRequired,
    round1Introduction: PT.string,
    round2Introduction: PT.string,
    type: PT.string,
    track: PT.string,
  }).isRequired,
  results: PT.arrayOf(PT.shape()),
  checkpointResults: PT.shape(),
  registrants: PT.arrayOf(PT.shape()),
  registrantsSort: PT.shape({
    field: PT.string,
    sort: PT.string,
  }),
  onSortChange: PT.func,
  notFoundCountryFlagUrl: PT.objectOf(PT.bool).isRequired,
};
