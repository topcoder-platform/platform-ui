import PT from "prop-types";

import { Tooltip } from "~/libs/ui";

import styles from "./styles.scss";

const NoteTooltip = ({ children }) => {
  const Content = () => <div className={styles["note-tooltip"]}>Remarks/Notes</div>;

  return (
    <Tooltip
        content={<Content />}
        place="top"
    >
      {children}
    </Tooltip>
  );
};

NoteTooltip.propTypes = {
  children: PT.node,
};

export default NoteTooltip;
