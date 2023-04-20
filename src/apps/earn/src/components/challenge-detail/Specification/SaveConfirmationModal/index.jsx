import LoadingIndicator from '@earn/components/LoadingIndicator';
import PT from 'prop-types';

import { Button } from '~/libs/ui';
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
          <Button
            primary
            size='md'
            onClick={onDone}
          >
            Done
          </Button>
        )
      }
    </Modal>
  );
}

SaveConfirmationModal.propTypes = {
  onDone: PT.func.isRequired,
  saving: PT.bool.isRequired,
};
