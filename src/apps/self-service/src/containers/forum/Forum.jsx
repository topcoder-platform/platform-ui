/**
 * Forum component
 */
import PT from "prop-types";
import { useEffect } from "react";

import { EnvironmentConfig } from "~/config";

import styles from "./styles.module.scss";

const Forum = ({ challengeId }) => {
  useEffect(() => {
    const script = document.createElement("script");

    window.vanilla_embed_type = EnvironmentConfig.VANILLA_EMBED_TYPE;
    window.vanilla_category_id = challengeId;
    script.src = EnvironmentConfig.VANILLA_EMBED_JS;
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
