import React, { useCallback, useMemo } from "react";
import PT from "prop-types";
import cn from "classnames";
import { ReactComponent as IconArrowLeft } from "../../assets/icons/icon-arrow-left.svg";
import { ReactComponent as IconArrowRight } from "../../assets/icons/icon-arrow-right.svg";
import Dropdown from "../Dropdown";
import styles from "./styles.scss";
import GigsButton from "../GigsButton";
import { getSelectedDropdownOption } from "../../utils";

/**
 * Displays pagination with menu to choose page size.
 *
 * @param {Object} props component properties
 * @param {string} [props.className] class name added to root element
 * @param {string} [props.pageSizeClassName] class name for page size select
 * @param {string} [props.label] label displayed to the left of page size dropdown
 * @param {string} [props.pageSizeLabel] label displayed at the top of page size dropdown
 * @param {(v: number) => void} props.onPageNumberClick function called when page button is clicked
 * @param {(v: number) => void} props.onPageSizeChange function called when page size is changed
 * @param {Object} props.pageSizeOptions page size options object
 * @param {Object} props.pagination pagination object
 * @returns {JSX.Element}
 */
const Pagination = ({
  className,
  label,
  pageSizeClassName,
  pageSizeLabel,
  onPageNumberClick,
  onPageSizeChange,
  pageSizeOptions,
  pagination,
}) => {
  const { pageCount, pageNumber, pageSize } = pagination;

  const options = useMemo(
    () =>
      pageSizeOptions.map((option) => {
        return { ...option, selected: option.value === pageSize };
      }),
    [pageSize, pageSizeOptions]
  );

  const onChange = useCallback(
    (options) => {
      onPageSizeChange(+getSelectedDropdownOption(options).value);
    },
    [onPageSizeChange]
  );

  const onPageButtonClick = useCallback(
    (event) => {
      onPageNumberClick(+event.currentTarget.dataset.value);
    },
    [onPageNumberClick]
  );

  const pageButtons = [];
  let pageStart = pageNumber > 2 ? pageNumber - 1 : 1;
  pageStart = Math.max(Math.min(pageStart, pageCount - 2), 1);
  let pageEnd = Math.min(pageStart + 2, pageCount);
  if (pageStart > 1) {
    pageButtons.push(
      <GigsButton
        key={pageStart - 1}
        className={styles.buttonPrev}
        onClick={onPageButtonClick}
        value={pageNumber - 1}
      >
        <IconArrowLeft className={styles.iconArrowLeft} />
        <span className={styles.buttonLabel}>PREVIOUS</span>
      </GigsButton>
    );
  }
  for (let n = pageStart; n <= pageEnd; n++) {
    pageButtons.push(
      <GigsButton
        key={n}
        className={styles["pageButton"]}
        isSelected={n === pageNumber}
        onClick={onPageButtonClick}
        buttonStyle="circle"
        value={n}
      >
        {n}
      </GigsButton>
    );
  }
  if (pageEnd < pageCount) {
    pageButtons.push(
      <GigsButton
        key={pageEnd + 1}
        className={styles.buttonNext}
        onClick={onPageButtonClick}
        value={pageNumber + 1}
      >
        <span className={styles.buttonLabel}>NEXT</span>
        <IconArrowRight className={styles.iconArrowRight} />
      </GigsButton>
    );
  }
  return (
    <div className={cn(styles.pagination, className)}>
      <Dropdown
        label={pageSizeLabel}
        className={cn(styles.pageSize, pageSizeClassName)}
        onChange={onChange}
        options={options}
        searchable={false}
        size="xs"
      />
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.pageButtons}>{pageButtons}</div>
    </div>
  );
};

Pagination.propTypes = {
  className: PT.string,
  pageSizeClassName: PT.string,
  id: PT.string.isRequired,
  label: PT.string,
  pageSizeLabel: PT.string,
  onPageNumberClick: PT.func.isRequired,
  onPageSizeChange: PT.func.isRequired,
  pageSizeOptions: PT.arrayOf(
    PT.shape({
      value: PT.oneOfType([PT.number, PT.string]).isRequired,
      label: PT.string.isRequired,
    })
  ),
  pagination: PT.shape({
    pageCount: PT.number.isRequired,
    pageNumber: PT.number.isRequired,
    pageSize: PT.number.isRequired,
  }),
};

export default Pagination;
