import styles from "./styles.scss";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import actions from "../../../actions/gigs/creators";
import { getPagination } from "../../../reducers/gigs/selectors";
import { PAGE_SIZES } from "../../../constants";
import Pagination from "../../Pagination";

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
