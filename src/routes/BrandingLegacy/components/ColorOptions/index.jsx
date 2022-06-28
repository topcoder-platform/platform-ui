/**
 * Color Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import React from "react";
import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import CheckIcon from "../../../../assets/images/check.svg";
import "./styles.module.scss";

const ColorOptions = ({ colors, selectedColor, onSelect }) => {
  const anyColor = colors.find((x) => x.isAny);
  return (
    <div styleName="colorOptions">
      {colors.map((color, index) => (
        <div
          styleName="colorWrapper"
          key={uuidV4}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!_.isArray(selectedColor.value)) {
              selectedColor.value = [];
              selectedColor.option = [];
            }
            if (_.includes(selectedColor.value, color.name)) {
              const newColors = _.filter(
                selectedColor.value,
                (v) => v !== color.name
              );
              onSelect(newColors, newColors);
            } else if (color.isAny) {
              const newColors = [color.name];
              onSelect(newColors, newColors);
            } else if (selectedColor.value.length < 3) {
              const newColors = [
                ...selectedColor.value.filter(
                  (name) => name !== anyColor?.name
                ),
                color.name,
              ];
              onSelect(newColors, newColors);
            }
          }}
        >
          <div
            styleName={classNames(
              "color",
              color.className,
              _.includes(selectedColor.value, color.name) ? "selected" : null
            )}
          >
            <CheckIcon />
          </div>
          <div styleName="colorName">{color.name}</div>
        </div>
      ))}
    </div>
  );
};

ColorOptions.defaultProps = {
  colors: [],
};

ColorOptions.propTypes = {
  colors: PT.arrayOf(PT.shape()),
  selectedColor: PT.number,
  onSelect: PT.func,
};

export default ColorOptions;
