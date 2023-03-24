import React, { useState, useMemo } from "react";
import PT from "prop-types";
import _ from "lodash";
import Tag from "../../../../../components/Tag";
import * as util from "../../../../../utils/tag";
import { useTargetSize } from "../../../../../utils/hooks/useTargetSize";

import "./styles.scss";

const Tags = ({ tags, onClickTag, tooltip, isSelfService }) => {
  const Tooltip = tooltip;

  const [size, ref] = useTargetSize();

  const n = useMemo(() => {
    const tagArray = [...tags];
    let tagsWidth = util.measureText(tagArray);

    if (!size) {
      return 0;
    }

    const maxWidth = Math.min(260, size.width);
    if (tagsWidth < maxWidth) {
      return tagArray.length;
    }

    const widthOfMoreTag = 40;
    while (tagsWidth > maxWidth - widthOfMoreTag) {
      tagArray.pop();
      tagsWidth = util.measureText(tagArray);
    }

    return tagArray.length;
  }, [tags, size]);

  const more = n < tags.length ? tags.length - n : 0;

  const [collapsed, setCollapsed] = useState(more > 0);
  const visibleTags = collapsed ? tags.slice(0, n) : tags;
  const invisibleTags = collapsed ? tags.slice(n) : [];

  return (
    <div styleName="tags" ref={ref}>
      {isSelfService && <Tag tag="On Demand" onClick={_.noop} />}
      {visibleTags.map((tag) => (
        <Tag tag={tag} key={tag} onClick={onClickTag} />
      ))}
      {more > 0 && collapsed && (
        <Tooltip more={invisibleTags}>
          <Tag tag={`${more}+`} onClick={() => setCollapsed(false)} />
        </Tooltip>
      )}
    </div>
  );
};

Tags.defaultProps = {
  isSelfService: false,
  tags: [],
  tooltip: ({ children }) => <>{children}</>,
};

Tags.propTypes = {
  isSelfService: PT.bool,
  tags: PT.arrayOf(PT.string),
  onClickTag: PT.func,
};

export default Tags;
