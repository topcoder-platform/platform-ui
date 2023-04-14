import { useParams } from "react-router-dom";
import { connect } from "react-redux";
import { useRef } from "react";

import { initAuth } from '../../services/auth';
import ChallengeDetailContainer from "../../containers/ChallengeDetail";

const ChallengeDetails = (props) => {
  const { auth } = props;
  const { challengeId } = useParams()
  const init = useRef(false)

  if (!init.current) {
    initAuth();
    init.current = true;
  }

  return (
    <>
      {auth.isAuthInitialized && (
        <ChallengeDetailContainer {...props} challengeId={challengeId} />
      )}
    </>
  );
};

function mapStateToProps(state) {
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
