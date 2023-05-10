import { Tooltip } from "~/libs/ui";
import { styled as styledCss } from "@earn/utils";

import Tag from "../../../../../components/Tag";

import styles from "./styles.scss";

const styled = styledCss(styles)

const TagsMoreTooltip = ({ children, tags, onClickTag, placement }) => {
  const Content = () => {
    return (
      <div className={styled("tags-more")}>
        {tags.map((tag) => (
          <Tag tag={tag} onClick={onClickTag} key={tag} />
        ))}
      </div>
    );
  };

  return (
    <Tooltip
      placement={placement}
      content={<Content />}
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
