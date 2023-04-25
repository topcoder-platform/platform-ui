/**
 * Modal Component for Image Decorators
 */
import _ from "lodash";
import PT from "prop-types";
import React from "react";

import { BaseModal, Button } from "~/libs/ui";
import { styled as styledCss } from "@earn/utils";

import styles from "./style.scss";
const styled = styledCss(styles)

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
        <BaseModal
            onClose={onCancel}
            open
            size="lg"
        >
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
            <Button secondary size='md' onClick={() => this.setState({ previewURL: st.editURL })}>
              Preview
            </Button>
            <Button primary size='md' onClick={() => onSave(st.editURL, st.size)}>
              Save
            </Button>
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
        </BaseModal>
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
