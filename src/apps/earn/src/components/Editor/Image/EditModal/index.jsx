/**
 * Modal Component for Image Decorators
 */
import _ from "lodash";
import PT from "prop-types";
import React from "react";

import { UiButton } from "~/libs/ui";
import { styled as styledCss } from "@earn/utils";

import { Modal } from "../../../../components/UiKit";

import styles from "./style.scss";
const styled = styledCss(styles)

const theme = {
  container: styles.modalContainer,
  overlay: styles.modalOverlay,
};

export default class EditModal extends React.Component {
  constructor(props) {
    super(props);
    const { description, size, src } = props;
    this.state = {
      description,
      size,
      // src,
      previewURL: "",
      editURL: src,
    };
  }

  render() {
    const { onCancel, onSave } = this.props;
    const st = this.state;
    return (
      <div className={styled("container")}>
        <Modal onCancel={() => onCancel()} theme={theme}>
          <div className={styled("fields-container")}>
            <div className={styled("field")}>
              URL:
              <input
                type="text"
                onChange={() => this.setState({ editURL: this.inputURL.value })}
                ref={(node) => {
                  this.inputURL = node;
                }}
                className={styled("url")}
                tabIndex="0"
                value={st.editURL}
              />
            </div>
            <div className={styled("field")}>
              Size%:
              <input
                type="number"
                onChange={() =>
                  this.setState({ size: _.clamp(this.inputSize.value, 0, 100) })
                }
                ref={(node) => {
                  this.inputSize = node;
                }}
                className={styled("size")}
                tabIndex="-1"
                value={st.size}
              />
            </div>
          </div>
          <div className={styled("buttons-container")}>
            <UiButton secondary size='md' onClick={() => this.setState({ previewURL: st.editURL })}>
              Preview
            </UiButton>
            <UiButton primary size='md' onClick={() => onSave(st.editURL, st.size)}>
              Save
            </UiButton>
          </div>
          {st.previewURL ? (
            <div className={styled("preview")}>
              <hr />
              <img
                src={st.previewURL}
                alt={st.description}
                height={`${st.size}%`}
                width={`${st.size}%`}
              />
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }
}

EditModal.defaultProps = {
  description: "",
  onSave: _.noop,
  onCancel: _.noop,
  size: 100,
  src: "http://",
};

EditModal.propTypes = {
  description: PT.string,
  onSave: PT.func,
  onCancel: PT.func,
  size: PT.number,
  src: PT.string,
};
