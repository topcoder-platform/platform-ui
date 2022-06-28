/**
 * Color Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import React from "react";
import { v4 as uuidV4 } from "uuid";
import SansSerifIcon from "../../../../assets/images/icon-sans-serif-font.png";
import SerifIcon from "../../../../assets/images/icon-serif-font.png";
import AnyFont from "../../../../assets/images/icon-any-font.png";
import "./styles.module.scss";

const FontOptions = ({ selectedFont, onSelect }) => {
  const fontOptions = [
    { name: "Any Fonts", image: AnyFont },
    { name: "Serif", image: SerifIcon },
    { name: "Sans Serif", image: SansSerifIcon },
  ];

  return (
    <div styleName="fontOptions">
      {fontOptions.map((item, index) => (
        <div
          styleName="fontWrapper"
          key={uuidV4}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(index, item.name)}
        >
          <div
            styleName={classNames(
              "image",
              index === selectedFont ? "active" : null
            )}
            key={uuidV4}
          >
            <img src={item.image} alt="serif icon" />
          </div>

          <p styleName="name">{item.name}</p>
        </div>
      ))}
    </div>
  );
};

FontOptions.defaultProps = {
  selectedFont: 0,
};

FontOptions.propTypes = {
  selectedFont: PT.number,
  onSelect: PT.func,
};

export default FontOptions;
