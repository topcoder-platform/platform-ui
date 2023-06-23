/**
 * <ColorPicker> Component
 * Implements a color picker dropdown populated with the colors found in utils/editor
 */
import _ from "lodash";
import PT from "prop-types";
import React from "react";
import * as Colors from "react-color";

import { EDITOR_COLOR_MAP } from "../../../../utils/editor";

import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const ColorPicker = ({ onChange, style, visible }) => (
  <div className={style}>
    {visible ? (
      <Colors.GithubPicker
        colors={_.values(EDITOR_COLOR_MAP)}
        onChange={({ hex }, e) => {
          e.preventDefault();
          onChange(_.findKey(EDITOR_COLOR_MAP, (value) => value === hex));
        }}
        className={styled("color-picker")}
      />
    ) : null}
  </div>
);

ColorPicker.defaultProps = {
  onChange: _.noop,
  style: "",
  visible: false,
};

ColorPicker.propTypes = {
  onChange: PT.func,
  style: PT.string,
  visible: PT.bool,
};

export default ColorPicker;
