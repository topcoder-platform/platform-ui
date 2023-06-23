import PT from "prop-types";

import { BaseModal, Button } from "~/libs/ui";

import { ReactComponent as IconUpdateSuccess } from "../../../../assets/icons/update-success.svg";

import styles from "./styles.scss";

const UpdateSuccess = ({ onClose, open }) => {
  return (
    <BaseModal
        size="md"
        onClose={onClose}
        title={(
            <div className={styles.title}>
                <IconUpdateSuccess className={styles["icon"]} />
                RESUME UPDATED!
            </div>
        )}
        buttons={(
            <Button primary size="lg" onClick={onClose}>
                CLOSE
            </Button>
        )}
        open={open}
    >
        <div>
            <p className={styles["text"]}>Your resume has been successfuly updated.</p>
        </div>
    </BaseModal>
  );
};

UpdateSuccess.propTypes = {
  onClose: PT.func,
  open: PT.bool,
};

export default UpdateSuccess;
