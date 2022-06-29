/**
 * Color Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import React from "react";
import _ from "lodash";
import { ReactComponent as CheckIcon } from "../../../../assets/images/check.svg";
import styles from "./styles.module.scss";

const ColorOptions = ({ colors, selectedColor, onSelect }) => {
  const anyColor = colors.find((x) => x.isAny);
  return (
    <div className={styles["colorOptions"]}>
      {colors.map((color, index) => (
        <div
          className={styles["colorWrapper"]}
          key={index}
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
            className={classNames(
              styles["color"],
              styles[color.className],
              _.includes(selectedColor.value, color.name) ? styles["selected"] : null
            )}
          >
            <CheckIcon />
          </div>
          <div className={styles["colorName"]}>{color.name}</div>
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
  selectedColor: PT.object,
  onSelect: PT.func,
};

export default ColorOptions;
