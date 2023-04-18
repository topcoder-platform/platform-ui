/**
 * containers.page.challenge-details.submission Container
 * <SubmissionsPageContainer>
 *
 * Description:
 *   Connects the Redux store to the Challenge Submissions display components.
 *   Passes the relevent state and setters as properties to the UI components.
 */
 import actions from '@earn/actions/page/submission';
 import { actions as api } from '@earn/actions';
 import { isMM } from '@earn/utils/challenge';
 import communityActions from '@earn/actions/tc-communities';
 import shortId from 'shortid';
 import React from 'react';
 import PT from 'prop-types';
 import { connect } from 'react-redux';
 import SubmissionsPage from './SubmissionPage';
 import { ACCESS_DENIED_REASON } from "../../constants";
 import AccessDenied from "../../components/AccessDenied";
 import LoadingIndicator from "@earn/components/LoadingIndicator";
import { LinkButton } from '~/libs/ui';
 /*import { sprig } from '@sprig-technologies/sprig-browser/dist';

 export const Sprig = sprig.configure({
   environmentId: config.SPRIG_ENVIRONMENT_ID,
 });*/

 /**
  * SubmissionsPage Container
  */
 class SubmissionsPageContainer extends React.Component {
   constructor(props) {
     super(props);
     this.handleSubmit = this.handleSubmit.bind(this);
     this.authInitRef = React.createRef(false);
   }

   componentDidMount() {
     const {
       auth,
       getCommunitiesList,
       challengeId,
       loadChallengeDetails,
     } = this.props;

     loadChallengeDetails(auth, challengeId);
     getCommunitiesList(auth);
   }

   componentWillReceiveProps() {
     const {
        auth,
       challenge,
       history,
       loadChallengeDetails,
       challengeId,
     } = this.props;

     const { details } = challenge;

     if (details && details.isLegacyChallenge && !history.location.pathname.includes(details.id)) {
       history.push(`/earn/challenges/${details.id}/submit`, history.state);
     }

     if (!this.authInitRef.current && auth.isAuthInitialized && !challenge.details) {
        this.authInitRef.current = true;
        loadChallengeDetails(auth, challengeId);
     }
   }

   /* A child component has called their submitForm() prop, prepare the passed
      form data for submission and create a submit action */
   handleSubmit(body) {
     const {
       tokenV2,
       tokenV3,
       submit,
       challengeId,
       challenge,
       track,
     } = this.props;

     // On final upload, the survey should appear
     //Sprig('track', 'onUploadSubmission');
     submit(tokenV3, tokenV2, challengeId, body, isMM(challenge) ? 'DEVELOP' : track);
   }

   render() {
     const {
       isRegistered,
       challengeId,
       challengeName,
     } = this.props;

     if (!challengeName) {
       return <LoadingIndicator />;
     }

     if (!isRegistered && challengeName) {
       return (
         <React.Fragment>
           <AccessDenied cause={ACCESS_DENIED_REASON.NOT_AUTHORIZED}>
             <LinkButton
                primary
                to={`/earn/challenges/${challengeId}`}
                size='lg'
            >
                Go to Challenge Details
            </LinkButton>
           </AccessDenied>
         </React.Fragment>
       );
     }

     return (
       <SubmissionsPage
         {...this.props}
         submitForm={this.handleSubmit}
       />
     );
   }
 }

 /**
  * Default values for Props
  */
 SubmissionsPageContainer.defaultProps = {
   challengesUrl: '/earn/challenges',
   uploadProgress: 0,
 };

 /* Reusable prop validation for Filestack data objects */
 const filestackDataProp = PT.shape({
   filename: PT.string.isRequired,
   mimetype: PT.string.isRequired,
   size: PT.number.isRequired,
   key: PT.string.isRequired,
   container: PT.string.isRequired,
 });

 /**
  * Prop Validation
  */
 SubmissionsPageContainer.propTypes = {
   auth: PT.shape().isRequired,
   phases: PT.arrayOf(PT.object).isRequired,
   communitiesList: PT.shape({
     data: PT.arrayOf(PT.object).isRequired,
     loadingUuid: PT.string.isRequired,
     timestamp: PT.number.isRequired,
   }).isRequired,
   getCommunitiesList: PT.func.isRequired,
   /* Older stuff */
   userId: PT.string.isRequired,
   challengesUrl: PT.string,
   tokenV2: PT.string.isRequired,
   tokenV3: PT.string.isRequired,
   submit: PT.func.isRequired,
   challengeId: PT.string.isRequired,
   track: PT.string.isRequired,
   challenge: PT.shape().isRequired,
   status: PT.string.isRequired,
   isRegistered: PT.bool.isRequired,
   groups: PT.arrayOf(PT.shape()).isRequired,
   errorMsg: PT.string.isRequired,
   isSubmitting: PT.bool.isRequired,
   submitDone: PT.bool.isRequired,
   resetForm: PT.func.isRequired,
   challengeName: PT.string.isRequired,
   uploadProgress: PT.number,
   agreed: PT.bool.isRequired,
   setAgreed: PT.func.isRequired,
   filePickers: PT.arrayOf(PT.shape({
     id: PT.string.isRequired,
     error: PT.string.isRequired,
     fileName: PT.string.isRequired,
     uploadProgress: PT.number,
   }).isRequired).isRequired,
   setFilePickerError: PT.func.isRequired,
   setFilePickerFileName: PT.func.isRequired,
   setFilePickerUploadProgress: PT.func.isRequired,
   setFilePickerDragged: PT.func.isRequired,
   notesLength: PT.number.isRequired,
   updateNotesLength: PT.func.isRequired,
   setSubmissionFilestackData: PT.func.isRequired,
   submissionFilestackData: filestackDataProp.isRequired,
   winners: PT.arrayOf(PT.object).isRequired,
   loadChallengeDetails: PT.func.isRequired,
   history: PT.shape().isRequired,
 };

 /**
  * Standard redux function, passes redux state into Container as props.
  * Is passed to connect(), not called directly.
  * @param {Object} state Redux state
  * @param {Object} ownProps
  * @return {Object}
  */
 const mapStateToProps = (state, ownProps) => {
   const { submission } = state.page;
   const details = state.challenge.details || {};
   return {
     auth: state.auth,
     phases: details.phases || [],
     communitiesList: state.tcCommunities?.list,
     /* Older stuff below. */
     userId: state.auth.user ? state.auth.user.userId : '',
     handle: state.auth.user ? state.auth.user.handle : '',
     challengeId: String(ownProps.challengeId),
     challengeName: details.name,
     challengesUrl: ownProps.challengesUrl,
     tokenV2: state.auth.tokenV2,
     tokenV3: state.auth.tokenV3,
     track: details.track,
     challenge: state.challenge,
     status: details.status,
     isRegistered: details.isRegistered,
     groups: details.groups,
     isSubmitting: submission.isSubmitting,
     submitDone: submission.submitDone,
     errorMsg: submission.submitErrorMsg,
     uploadProgress: submission.uploadProgress,
     agreed: submission.agreed,
     filePickers: submission.filePickers,
     notesLength: submission.notesLength,
     submissionFilestackData: submission.submissionFilestackData,
     winners: details.winners,
   };
 };

 /**
  * Standard redux function, passes redux actions into Container as props.
  * Is passed to connect(), not called directly.
  * @param {Function} dispatch Function to dispatch action to reducers
  * @return {Object}
  */
 function mapDispatchToProps(dispatch) {
   const a = actions.page.submission;
   const ca = communityActions.tcCommunity;
   const progress = data => dispatch(a.uploadProgress(data));

   return {
     getCommunitiesList: (auth) => {
       const uuid = shortId();
       dispatch(ca.getListInit(uuid));
       dispatch(ca.getListDone(uuid, auth));
     },
     submit: (tokenV3, tokenV2, submissionId, body, track) => {
       dispatch(a.submitInit());
       dispatch(a.submitDone(tokenV3, tokenV2, submissionId, body, track, progress));
     },
     resetForm: () => {
       dispatch(a.submitReset());
     },
     setAgreed: agreed => dispatch(a.setAgreed(agreed)),
     setFilePickerError: (id, error) => dispatch(a.setFilePickerError(id, error)),
     setFilePickerFileName: (id, fileName) => dispatch(a.setFilePickerFileName(id, fileName)),
     setFilePickerDragged: (id, dragged) => dispatch(a.setFilePickerDragged(id, dragged)),
     setFilePickerUploadProgress: (id, p) => dispatch(a.setFilePickerUploadProgress(id, p)),
     updateNotesLength: length => dispatch(a.updateNotesLength(length)),
     setSubmissionFilestackData: (id, data) => dispatch(a.setSubmissionFilestackData(id, data)),
     loadChallengeDetails: (auth, challengeId) => {
       const challengeAction = api.challenge;
       dispatch(challengeAction.getDetailsInit(challengeId));
       dispatch(challengeAction.getDetailsDone({challengeId, tokenV3: auth.tokenV3, tokenV2: auth.tokenV2}));
     },
   };
 }

 const Container = connect(
   mapStateToProps,
   mapDispatchToProps,
 )(SubmissionsPageContainer);

 export default Container;
