import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PT from "prop-types";

import { Tooltip } from "~/libs/ui";

import styles from "./styles.scss";

/**
 * Displays a tooltip with tags that are not initially shown.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const TagsTooltip = ({ children, onClickTag, renderTag, tags }) => {
  const overlay = useMemo(
    () => (
      <div className={styles["tooltip-tag-list"]}>
        {tags
          .map((tag) => ({
            tag,
            onClickTag,
            className: styles.tooltipTag,
          }))
          .map(renderTag)}
      </div>
    ),
    [onClickTag, renderTag, tags]
  );
  return (
    <Tooltip
      content={overlay}
      place="bottom"
    >
      {children}
    </Tooltip>
  );
};

/**
 * Displays a tag list. Initially displays only the first line of tags.
 *
 * @param {Object} props component properties
 * @param {string} [props.className] class name added to root element
 * @param {number} [props.maxTagCount] maximum number of tags to show
 * @param {(t: any) => void} [props.onClickTag] function called when tag is clicked
 * @param {(t: any) => JSX.Element} props.renderTag function that renders a tag
 * @param {Array} props.tags array of tags
 * @returns {JSX.Element}
 */
const TagList = ({
  className,
  maxTagCount = 5,
  onClickTag,
  renderTag,
  tags,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tagsVisible, setTagsVisible] = useState(tags);

  const containerRef = useRef();

  const onClickBtnMore = useCallback(
    (event) => {
      event.preventDefault();
      setTagsVisible(tags);
      setShowAll(true);
    },
    [tags]
  );

  useEffect(() => {
    let index = getFirstLineLastElemIndex(containerRef.current);
    index = index < 0 ? maxTagCount : Math.min(index, maxTagCount);
    if (tags.length < index + 1) {
      setShowAll(true);
      setTagsVisible(tags);
    } else {
      setTagsVisible(tags.slice(0, index));
    }
    setIsVisible(true);
  }, [tags, maxTagCount]);

  return (
    <div
      className={[className, styles.container, isVisible ? styles.visible : null ].join(' ')}
      ref={containerRef}
    >
      {tagsVisible
        .map((tag) => ({ className: styles.tag, onClickTag, tag }))
        .map(renderTag)}
      {!showAll && (
        <TagsTooltip
          onClickTag={onClickTag}
          renderTag={renderTag}
          tags={tags.slice(tagsVisible.length)}
        >
          <span
            key="show-more-tags"
            className={styles["btn-more"]}
            onClick={onClickBtnMore}
            tabIndex={0}
            role="button"
          >
            {tags.length - tagsVisible.length}+
          </span>
        </TagsTooltip>
      )}
    </div>
  );
};

TagList.propTypes = {
  className: PT.string,
  maxTagCount: PT.number,
  onClickTag: PT.func.isRequired,
  renderTag: PT.func.isRequired,
  tags: PT.arrayOf(PT.object).isRequired,
};

export default TagList;

/**
 * Searches for the index of the last element on the first line.
 *
 * @param {Element} container container element
 * @returns {number} first line's last element's index
 */
function getFirstLineLastElemIndex(container) {
  const firstElement = container.firstElementChild;
  let offsetTop = firstElement.offsetTop;
  for (
    let elem = firstElement.nextElementSibling, index = 1;
    elem;
    elem = elem.nextElementSibling, index++
  ) {
    if (elem.offsetTop > offsetTop) {
      return index - 1;
    }
  }
  return -1;
}
