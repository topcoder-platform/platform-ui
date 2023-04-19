import LoadingIndicator from '@earn/components/LoadingIndicator';
import PT from 'prop-types';

import { UiButton } from '~/libs/ui';
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
          <UiButton
            primary
            size='md'
            onClick={onDone}
          >
            Done
          </UiButton>
        )
      }
    </Modal>
  );
}

SaveConfirmationModal.propTypes = {
  onDone: PT.func.isRequired,
  saving: PT.bool.isRequired,
};
