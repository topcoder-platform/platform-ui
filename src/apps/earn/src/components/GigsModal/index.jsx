import PT from "prop-types";
import { Modal as ReactModal } from "react-responsive-modal";

import styles from "./styles.scss";

const GigsModal = ({
  children,
  modalClassName,
  overlayClassName,
  open,
  center,
  onClose,
}) => {
  return (
    <ReactModal
      open={open}
      center={center}
      showCloseIcon={false}
      classNames={{
        modal: [styles["modal"], styles["content"], modalClassName].join(" "),
        overlay: overlayClassName
      }}
      focusTrapped={false}
      onClose={onClose}
    >
      {children}
    </ReactModal>
  );
};

GigsModal.defaultProps = {
  center: true,
  onClose() {},
};

GigsModal.propTypes = {
  children: PT.node,
  open: PT.bool,
  center: PT.bool,
  modalClassName: PT.string,
  overlayClassName: PT.string,
  onClose: PT.func,
};

export default GigsModal;
