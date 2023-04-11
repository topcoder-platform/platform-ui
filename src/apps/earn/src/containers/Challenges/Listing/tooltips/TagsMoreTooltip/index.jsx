import Tooltip from "../../../../../components/Tooltip";
import Tag from "../../../../../components/Tag";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
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
