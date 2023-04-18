import _ from 'lodash';
import { createActions } from 'redux-actions';

export default createActions({
  PAGE: {
    SUBMISSION_MANAGEMENT: {
      SHOW_DETAILS: _.identity,
      CANCEL_DELETE: _.noop,
      CONFIRM_DELETE: _.identity,
    },
  },
});
