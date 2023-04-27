import PT from 'prop-types';

import { BaseModal, Button, LoadingCircles } from '~/libs/ui';

import styles from './style.scss';

export default function SaveConfirmationModal({
  onDone,
  saving,
}) {
  return (
    <BaseModal
        onClose={onDone}
        open
    >
      <h1 className={styles.title}>
        Saving The Challenge
      </h1>
      {
        saving ? <LoadingCircles /> : (
          <Button
            primary
            size='md'
            onClick={onDone}
          >
            Done
          </Button>
        )
      }
    </BaseModal>
  );
}

SaveConfirmationModal.propTypes = {
  onDone: PT.func.isRequired,
  saving: PT.bool.isRequired,
};
