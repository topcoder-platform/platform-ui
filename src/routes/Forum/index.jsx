/**
 * Forum component
 */
import PT from "prop-types";
import React, { useEffect } from "react";
import config from "../../../config";
import "./styles.module.scss";

const Forum = ({ challengeId }) => {
  useEffect(() => {
    const script = document.createElement("script");

    window.vanilla_embed_type = config.VANILLA_EMBED_TYPE;
    window.vanilla_category_id = challengeId;
    script.src = config.VANILLA_EMBED_JS;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [challengeId]);

  return (
    <div styleName="forumWrapper">
      <div id="vanilla-comments"></div>
    </div>
  );
};

Forum.propTypes = {
  challengeId: PT.string,
};

export default Forum;
