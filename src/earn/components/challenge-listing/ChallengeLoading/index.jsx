import React from "react";
import "./styles.module.scss";

export default function ChallengeLoading() {
  return (
    <div styleName="challenge-loading">
      <div styleName="track placeholder-template"></div>
      <div styleName="main">
        <div styleName="title placeholder-template"></div>
        <div styleName="info placeholder-template"></div>
        <div styleName="footer placeholder-template"></div>
      </div>
      <div>
        <div styleName="prize placeholder-template"></div>
        <div styleName="prize-nominal placeholder-template"></div>
      </div>
    </div>
  );
}
