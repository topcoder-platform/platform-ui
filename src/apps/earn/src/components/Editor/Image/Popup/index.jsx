/**
 * Popup Component for Link Decorators
 */
import _ from "lodash";
import PT from "prop-types";
import React from "react";


import EditModal from "../EditModal";

import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
import { Button } from "~/libs/ui";
const styled = styledCss(styles)

export default class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: props.triggerModal,
    };
  }

  render() {
    const { onEdit, size, src } = this.props;
    const { editing } = this.state;
    const renderDisplay = () => (
      <div>
        <Button
          className={styled('edit')}
          onClick={() => this.setState({ editing: true })}
          size="md"
          secondary
        >
          Edit
        </Button>
      </div>
    );

    const renderEdit = () => (
      <div>
        <EditModal
          size={size}
          src={src}
          onCancel={() => this.setState({ editing: false })}
          onSave={(newSrc, newSize) => {
            this.setState({ editing: false });
            onEdit(newSrc, newSize);
          }}
        />
      </div>
    );

    return <div>{editing ? renderEdit() : renderDisplay()}</div>;
  }
}

Popup.defaultProps = {
  size: 100,
  src: "http://",
  onEdit: _.noop,
  triggerModal: false,
};

Popup.propTypes = {
  onEdit: PT.func,
  size: PT.number,
  src: PT.string,
  triggerModal: PT.bool,
};
