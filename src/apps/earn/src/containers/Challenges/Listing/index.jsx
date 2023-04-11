import { useRef, useCallback, useMemo } from "react";
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
import { ReactComponent as IconSearch} from "../../../assets/icons/search.svg";
import { ReactComponent as IconClear} from "../../../assets/icons/close-gray.svg";
import Button from "../../../components/Button";

import styles from "./styles.scss";
import ReviewItem from "./ReviewItem";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles);

const PAGE_SIZE_OPTIONS = constants.PAGE_SIZES.map((value) => ({
  label: value + "",
  value,
}));

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

  const pagination = useMemo(() => ({
    pageCount: Math.ceil(total / perPage),
    pageNumber: page,
    pageSize: perPage,
  }), [page, perPage, total]);

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

  const onPageNumberClick = useCallback((value) => (
    updateFilter({ page: value })
  ), [updateFilter]);

  const onPageSizeChange = useCallback((value) => (
    updateFilter({ perPage: value })
  ), [updateFilter]);

  return (
    <Panel>
      <Panel.Header>
        <div className={styled("header-container")}>
          <div className={styled("input-group")}>
            <span className={styled("search-icon")}>
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
              <span className={styled("clear-icon")}>
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
          <div className={styled("separator")} />
          <div
            className={styled(`sort-by ${
              bucket === constants.FILTER_BUCKETS[2] ? "hidden" : ""
            }`)}
          >
            <Dropdown
              label="Sort by"
              options={sortByOptions}
              size="xs"
              onChange={_.debounce(onChangeSortBy, 1000)}
            />
          </div>
          <div
            className={styled(`from-to ${
              bucket !== constants.FILTER_BUCKETS[2] ? "hidden" : ""
            }`)}
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
          <div className={styled("filter-button")}>
            <Button onClick={onShowSidebar}>FILTER</Button>
          </div>
        </div>
      </Panel.Header>
      {loadingChallenges && _.times(3, () => <ChallengeLoading key={Math.random()} />)}
      {!loadingChallenges &&
        (challenges.length ? (
          <Panel.Body>
            {challenges.map((challenge, index) => (
              <div
                key={challenge.id}
                className={styled(index % 2 === 0 ? "even" : "odd")}
              >
                  {challenge.type != "Contest Review" ?
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
                  :
                    <ReviewItem
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
                    />}
              </div>
            ))}
          </Panel.Body>
        ) : (
          <ChallengeError />
        ))}
      <Panel.Body>
        <div
          className={styled("pagination")}
          style={{
            display: challenges.length === 0 || loadingChallenges ? "none" : "",
          }}
        >
          <Pagination
            id="challenges-pagination"
            length={total}
            pageSize={perPage}
            pageIndex={utils.pagination.pageToPageIndex(page)}
            label="per page"
            onPageNumberClick={onPageNumberClick}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pagination={pagination}
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
