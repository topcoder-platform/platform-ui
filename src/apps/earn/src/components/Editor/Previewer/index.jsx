import PT from "prop-types";
import React from "react";

import styles from "./style.scss";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles)

export default class Previewer extends React.Component {
  constructor(props) {
    super(props);
    if (props.connector) props.connector.setPreviewer(this);
    this.state = {
      content: props.initialContent,
      visible: false,
    };
  }

  setContent(content) {
    setImmediate(() => this.setState({ content }));
  }

  setVisible(newVisible) {
    const { visible } = this.state;
    if (newVisible === visible) return;
    setImmediate(() => this.setState({ visible: newVisible }));
  }

  render() {
    const { content, visible } = this.state;
    return (
      <div className={styled("container")}>
        {visible ? (
          <div>
            <div className={styled("title")}>Rendering Preview</div>
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className={styled("content")}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

Previewer.defaultProps = {
  connector: null,
  initialContent: "",
};

Previewer.propTypes = {
  connector: PT.shape(),
  initialContent: PT.string,
};
