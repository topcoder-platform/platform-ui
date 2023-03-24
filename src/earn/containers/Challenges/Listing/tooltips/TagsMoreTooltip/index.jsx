import React from "react";
import PT from "prop-types";
import Tooltip from "../../../../../components/Tooltip";
import Tag from "../../../../../components/Tag";

import "./styles.scss";

const TagsMoreTooltip = ({ children, tags, onClickTag, placement }) => {
  const Content = () => {
    return (
      <div styleName="tags-more">
        {tags.map((tag) => (
          <Tag tag={tag} onClick={onClickTag} key={tag} />
        ))}
      </div>
    );
  };

  return (
    <Tooltip
      placement={placement}
      overlay={<Content />}
      trigger={["hover", "focus"]}
    >
      {children}
    </Tooltip>
  );
};

TagsMoreTooltip.defaultProps = {
  placement: "bottom",
};

TagsMoreTooltip.propTypes = {};

export default TagsMoreTooltip;
