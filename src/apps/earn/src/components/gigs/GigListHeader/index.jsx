import styles from "./styles.scss";
import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "../../Dropdown";
import SearchField from "../../SearchField";
import * as selectors from "../../../reducers/gigs/selectors";
import actions from "../../../actions/gigs/creators";
import { SORT_BY, SORT_ORDER } from "../../../constants";
import { getSelectedDropdownOption } from "../../../utils";

/**
 * Displays search field and sorting dropdown.
 *
 * @returns {JSX.Element}
 */
const GigListHeader = () => {
  const sorting = useSelector(selectors.getSorting);
  const title = useSelector(selectors.getTitle);
  const dispatch = useDispatch();

  const onChangeSorting = useCallback(
    (options) => {
      let option = getSelectedDropdownOption(options);
      let value = option?.value;
      if (value) {
        let [sortBy, sortOrder] = value.split("--");
        dispatch(actions.setSorting({ sortBy, sortOrder }));
      }
    }
  );

  const onChangeTitle = useCallback(
    (title) => {
      dispatch(actions.setTitle(title));
    },
    [dispatch]
  );

  const sortingOptions = useMemo(
    () =>
      SORTING_OPTIONS.map((option) => {
        let [sortBy, sortOrder] = option.value.split("--");
        return {
          ...option,
          selected:
            sorting.sortBy === sortBy && sorting.sortOrder === sortOrder,
        };
      }),
    [sorting]
  );

  return (
    <div className={styles["container"]}>
      <SearchField
        className={styles.nameField}
        id="gig-title"
        name="gig_title"
        onChange={onChangeTitle}
        placeholder="Search Gig Listing by Name"
        value={title}
      />
      <Dropdown
        className={styles.sortingDropdown}
        label="Sort by"
        onChange={onChangeSorting}
        options={sortingOptions}
        searchable={true}
        size="xs"
      />
    </div>
  );
};

export default GigListHeader;

const SORTING_OPTIONS = [
  {
    value: `${SORT_BY.DATE_ADDED}--${SORT_ORDER.DESC}`,
    label: "Latest Added Descending",
  },
  {
    value: `${SORT_BY.DATE_UPDATED}--${SORT_ORDER.DESC}`,
    label: "Latest Updated Descending",
  },
];
