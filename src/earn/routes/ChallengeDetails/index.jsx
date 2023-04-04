import { useParams } from "react-router-dom";
import { connect } from "react-redux";
import { useRef } from "react";

import { initAuth } from '../../services/auth';
import ChallengeDetail from "../../containers/ChallengeDetail";

const ChallengeDetails = ({auth}) => {
  const { challengeId } = useParams()
  const init = useRef(false)

  if (!init.current) {
    initAuth();
    init.current = true;
  }

  return (
    <>
      {auth.isAuthInitialized && (
        <ChallengeDetail challengeId={challengeId} />
      )}
    </>
  );
};

function mapStateToProps({earn: state}) {
  return {
    auth: state.auth,
  }
}

const ChallengeDetailsContainer = connect(
  mapStateToProps,
)(ChallengeDetails);

export {
  ChallengeDetailsContainer as ChallengeDetails,
};
