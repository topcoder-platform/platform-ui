import styles from "./styles.scss";
import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "../../../../components/Pagination";
import actions from "../../../../actions/gigs/gigs/creators";
import { getPagination } from "../../../../reducers/gigs/gigs/selectors";
import { PAGE_SIZES } from "../../../../constants/gigs";

/**
 * Displays gigs' pagination.
 *
 * @returns {JSX.Element}
 */
const GigsPagination = () => {
  const pagination = useSelector(getPagination);
  const dispatch = useDispatch();

  const onPageNumberClick = useCallback(
    (value) => {
      dispatch(actions.setPageNumber(value));
    },
    [dispatch]
  );

  const onPageSizeChange = useCallback(
    (value) => {
      dispatch(actions.setPageSize(value));
    },
    [dispatch]
  );

  return (
    <Pagination
      id="gigs-pagination"
      className={styles.container}
      label="per page"
      onPageNumberClick={onPageNumberClick}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      pagination={pagination}
    />
  );
};

const PAGE_SIZE_OPTIONS = PAGE_SIZES.map((value) => ({
  label: value + "",
  value,
}));

export default GigsPagination;
