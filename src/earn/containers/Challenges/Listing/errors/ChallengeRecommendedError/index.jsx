import React from "react";
import IconNotFound from "assets/icons/not-found-recommended.png";
import "./styles.scss";

const ChallengeRecommendedError = () => (
  <div styleName="challenge-recommended-error">
    <h1>
      <img src={IconNotFound} alt="not found" />
    </h1>
    <p>
      Looks like there are no <strong>Recommended Challenges</strong> that best
      match your skills at this point. But you can try to join other challenges
      that work for you.
    </p>
  </div>
);

export default ChallengeRecommendedError;
