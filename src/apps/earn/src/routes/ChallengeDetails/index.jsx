import { useParams } from "react-router-dom";
import { connect } from "react-redux";
import { useRef } from "react";
import qs from 'qs';

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
  const query = window.location.search
  ? qs.parse(window.location.search.slice(1)) : null;
  const currencyFromUrl = _.get(query, 'currency');
  const prizeMode = currencyFromUrl && `money-${currencyFromUrl}`;
  const newProps = { ...props, ...{ prizeMode } };
  const selectedTab = _.get(query, 'tab') || "details";
  return (
    <>
      { auth.isAuthInitialized && (
        <ChallengeDetailContainer {...newProps} selectedTab={selectedTab} challengeId={challengeId} />
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
