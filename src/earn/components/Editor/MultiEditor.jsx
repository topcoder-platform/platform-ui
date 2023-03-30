/**
 * The MultiEditor component combines together WysiwygEditor and Markdown editor
 * allowing to easily switch between them.
 */

import PT from "prop-types";
import React from "react";
import Turndown from "turndown";

import { OrderedSet } from "immutable";

import Connector from "./Connector";
import MarkdownEditor from "./MarkdownEditor";
import WysiwygEditor from ".";

export const MODES = {
  MARKDOWN: "MARKDOWN",
  WYSIWYG: "WYSIWYG",
};

export default class MultiEditor extends React.Component {
  constructor(props) {
    super(props);
    this.fakeConnector = new Connector();
    this.fakeConnector.setToolbar(this);
    this.id = props.id;
    this.state = {
      mode: props.initialMode,
    };
    this.turndown = new Turndown();
  }

  componentDidMount() {
    const { connector } = this.props;
    if (connector) {
      connector.addEditor(this);
      this.fakeConnector.setPreviewer(connector.previewer);
    }
  }

  componentWillReceiveProps({ connector, id }) {
    const { connector: prevConnector } = this.props;
    this.id = id;
    if (connector !== prevConnector) {
      if (prevConnector) prevConnector.removeEditor(this);
      if (connector) {
        connector.addEditor(this);
        this.fakeConnector.setPreviewer(connector.previewer);
      }
    }
  }

  componentWillUnmount() {
    const { connector } = this.props;
    if (connector) connector.removeEditor(this);
  }

  onFocusedEditorChanged(state) {
    const { connector } = this.props;
    if (connector) connector.setFocusedEditor(this, state);
  }

  getHtml() {
    return this.editor.getHtml();
  }

  setHtml(html) {
    this.editor.setHtml(html);
  }

  setMode(value) {
    const { mode } = this.state;
    if (value === mode) return;
    const { connector } = this.props;
    const state = this.editor.getHtml();
    this.setState({ mode: value }, () => {
      this.editor.setHtml(state);
      if (connector) connector.setFocusedEditor(this, this.editor.state.editor);
    });
  }

  applyBlockStyle(type) {
    const { mode } = this.state;
    if (mode === MODES.WYSIWYG) this.editor.applyBlockStyle(type);
  }

  applyColorStyle(type, color) {
    const { mode } = this.state;
    if (mode === MODES.WYSIWYG) {
      this.editor.applyColorStyle(type, color);
    }
  }

  focus() {
    const { mode } = this.state;
    if (mode === MODES.WYSIWYG) this.editor.focus();
  }

  insertImage(src, triggerModal) {
    const { mode } = this.state;
    switch (mode) {
      case MODES.WYSIWYG:
        return this.editor.insertImage(src, triggerModal);
      case MODES.MARKDOWN:
        return this.editor.insertImage();
      default:
        return undefined;
    }
  }

  insertLink(title, href, triggerPopup) {
    const { mode } = this.state;
    if (mode === MODES.WYSIWYG) {
      this.editor.insertLink(title, href, triggerPopup);
    }
  }

  toggleInlineStyle(styleName) {
    const { mode } = this.state;
    if (mode === MODES.WYSIWYG) {
      return this.editor.toggleInlineStyle(styleName);
    }
    return OrderedSet();
  }

  render() {
    const { mode } = this.state;
    switch (mode) {
      case MODES.MARKDOWN:
        return (
          <MarkdownEditor
            connector={this.fakeConnector}
            ref={(node) => {
              if (node) this.editor = node;
            }}
          />
        );
      case MODES.WYSIWYG: {
        return (
          <WysiwygEditor
            connector={this.fakeConnector}
            ref={(node) => {
              if (node) this.editor = node;
            }}
          />
        );
      }
      default:
        throw new Error("Unknown mode");
    }
  }
}

MultiEditor.defaultProps = {
  connector: null,
  id: null,
  initialMode: MODES.WYSIWYG,
};

MultiEditor.propTypes = {
  connector: PT.shape(),
  id: PT.string,
  initialMode: PT.oneOf(Object.values(MODES)),
};
