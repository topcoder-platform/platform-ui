import LoadingIndicator from "../../../../components/LoadingIndicator";
import PT from "prop-types";
import React from "react";
import { Modal, PrimaryButton } from "../../../../components/UiKit";

import styles from "./styles.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function SaveConfirmationModal({ onDone, saving }) {
  return (
    <Modal theme={{ container: styles.container }}>
      <h1 className={styled("title")}>Saving The Challenge</h1>
      {saving ? (
        <LoadingIndicator />
      ) : (
        <PrimaryButton onClick={onDone}>Done</PrimaryButton>
      )}
    </Modal>
  );
}

SaveConfirmationModal.propTypes = {
  onDone: PT.func.isRequired,
  saving: PT.bool.isRequired,
};
