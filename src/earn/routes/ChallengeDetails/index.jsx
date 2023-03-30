import React, { useEffect } from "react";
import _ from "lodash";

import { initAuth } from '../../services/auth';
import ChallengeDetail from "../../containers/ChallengeDetail";

export const ChallengeDetails = () => {
  useEffect(() => { initAuth() }, [])

  return (
    <ChallengeDetail />
  );
};

