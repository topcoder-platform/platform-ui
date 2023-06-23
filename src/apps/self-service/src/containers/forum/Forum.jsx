/**
 * Forum component
 */
import PT from "prop-types";
import { useEffect } from "react";

import styles from "./styles.module.scss";
import { VANILLA_EMBED_JS, VANILLA_EMBED_TYPE } from "../../config";

const Forum = ({ challengeId }) => {
  useEffect(() => {
    const script = document.createElement("script");

    window.vanilla_embed_type = VANILLA_EMBED_TYPE;
    window.vanilla_category_id = challengeId;
    script.src = VANILLA_EMBED_JS;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [challengeId]);

  return (
    <div className={styles["forumWrapper"]}>
      <div id="vanilla-comments"></div>
    </div>
  );
};

Forum.propTypes = {
  challengeId: PT.string,
};

export default Forum;
