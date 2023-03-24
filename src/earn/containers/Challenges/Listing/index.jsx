import React, { useRef } from "react";
import PT from "prop-types";
import _ from "lodash";
import moment from "moment";
import Panel from "../../../components/Panel";
import ChallengeError from "../Listing/errors/ChallengeError";
import Pagination from "../../../components/Pagination";
import ChallengeItem from "./ChallengeItem";
import TextInput from "../../../components/TextInput";
import Dropdown from "../../../components/Dropdown";
import DateRangePicker from "../../../components/DateRangePicker";
import ChallengeLoading from "../../../components/challenge-listing/ChallengeLoading";
import * as utils from "../../../utils";

import * as constants from "../../../constants";
import IconSearch from "../../../assets/icons/search.svg";
import IconClear from "../../../assets/icons/close-gray.svg";
import Button from "../../../components/Button";

import "./styles.scss";

const Listing = ({
  challenges,
  loadingChallenges,
  search,
  page,
  perPage,
  sortBy,
  total,
  endDateStart,
  startDateEnd,
  updateFilter,
  bucket,
  sortByLabels,
  isLoggedIn,
  tags,
}) => {
  const sortByOptions = utils.createDropdownOptions(
    sortByLabels,
    utils.getSortByLabel(constants.CHALLENGE_SORT_BY, sortBy)
  );

  const onSearch = useRef(_.debounce((f) => f(), 1000));
  const onChangeSortBy = (newSortByOptions) => {
    const selectedOption = utils.getSelectedDropdownOption(newSortByOptions);
    const filterChange = {
      sortBy: constants.CHALLENGE_SORT_BY[selectedOption.label],
      page: 1,
    };
    updateFilter(filterChange);
  };

  const onShowSidebar = () => {
    const sidebarEl = document.getElementById("sidebar-id");
    sidebarEl.classList.add("show");
  };

  return (
    <Panel>
      <Panel.Header>
        <div styleName="header-container">
          <div styleName="input-group">
            <span styleName="search-icon">
              <IconSearch />
            </span>
            <TextInput
              value={search}
              placeholder="Search for challenges"
              size="xs"
              onChange={(value) => {
                onSearch.current(() => {
                  const filterChange = {
                    search: value,
                    page: 1,
                  };
                  updateFilter(filterChange);
                });
              }}
              maxLength="100"
            />
            {search.length ? (
              <span styleName="clear-icon">
                <IconClear
                  size="xs"
                  onClick={() => {
                    onSearch.current(() => {
                      const filterChange = {
                        search: "",
                        page: 1,
                      };
                      updateFilter(filterChange);
                    });
                  }}
                />
              </span>
            ) : (
              <span type="hidden"></span>
            )}
          </div>
          <div styleName="separator" />
          <div
            styleName={`sort-by ${
              bucket === constants.FILTER_BUCKETS[2] ? "hidden" : ""
            }`}
          >
            <Dropdown
              label="Sort by"
              options={sortByOptions}
              size="xs"
              onChange={_.debounce(onChangeSortBy, 1000)}
            />
          </div>
          <div
            styleName={`from-to ${
              bucket !== constants.FILTER_BUCKETS[2] ? "hidden" : ""
            }`}
          >
            <DateRangePicker
              enterToSubmit
              onChange={(range) => {
                const d = range.endDate
                  ? moment(range.endDate).toISOString()
                  : null;
                const s = range.startDate
                  ? moment(range.startDate).toISOString()
                  : null;
                const filterChange = {
                  endDateStart: s,
                  startDateEnd: d,
                  page: 1,
                };
                updateFilter(filterChange);
              }}
              range={{
                startDate: endDateStart ? moment(endDateStart).toDate() : null,
                endDate: startDateEnd ? moment(startDateEnd).toDate() : null,
              }}
            />
          </div>
          <div styleName="filter-button">
            <Button onClick={onShowSidebar}>FILTER</Button>
          </div>
        </div>
      </Panel.Header>
      {loadingChallenges && _.times(3, () => <ChallengeLoading />)}
      {!loadingChallenges &&
        (challenges.length ? (
          <Panel.Body>
            {challenges.map((challenge, index) => (
              <div
                key={challenge.id}
                styleName={index % 2 === 0 ? "even" : "odd"}
              >
                <ChallengeItem
                  challenge={challenge}
                  onClickTag={(tag) => {
                    const filterChange = {
                      tags: [tag],
                      page: 1,
                    };
                    updateFilter(filterChange);
                  }}
                  onClickTrack={(track) => {
                    const filterChange = {
                      tracks: [track],
                      page: 1,
                    };
                    updateFilter(filterChange);
                  }}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            ))}
          </Panel.Body>
        ) : (
          <ChallengeError />
        ))}
      <Panel.Body>
        <div
          styleName="pagination"
          style={{
            display: challenges.length === 0 || loadingChallenges ? "none" : "",
          }}
        >
          <Pagination
            length={total}
            pageSize={perPage}
            pageIndex={utils.pagination.pageToPageIndex(page)}
            onChange={(event) => {
              const filterChange = {
                page: utils.pagination.pageIndexToPage(event.pageIndex),
                perPage: event.pageSize,
              };
              updateFilter(filterChange);
            }}
          />
        </div>
      </Panel.Body>
    </Panel>
  );
};

Listing.propTypes = {
  challenges: PT.arrayOf(PT.shape()),
  loadingChallenges: PT.bool,
  search: PT.string,
  page: PT.number,
  perPage: PT.number,
  sortBy: PT.string,
  total: PT.number,
  endDateStart: PT.string,
  startDateEnd: PT.string,
  updateFilter: PT.func,
  bucket: PT.string,
  sortByLabels: PT.arrayOf(PT.string),
  isLoggedIn: PT.bool,
};

export default Listing;
