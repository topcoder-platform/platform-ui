import LoadingIndicator from '@earn/components/LoadingIndicator';
import PT from 'prop-types';
import { PrimaryButton } from '@earn/components/challenge-detail/buttons';
import Modal from '@earn/components/challenge-detail/Modal'

import styles from './style.scss';

export default function SaveConfirmationModal({
  onDone,
  saving,
}) {
  return (
    <Modal
      theme={{ container: styles.container }}
    >
      <h1 className={styles.title}>
        Saving The Challenge
      </h1>
      {
        saving ? <LoadingIndicator /> : (
          <PrimaryButton
            onClick={onDone}
          >
            Done
          </PrimaryButton>
        )
      }
    </Modal>
  );
}

SaveConfirmationModal.propTypes = {
  onDone: PT.func.isRequired,
  saving: PT.bool.isRequired,
};
