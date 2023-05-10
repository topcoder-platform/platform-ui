/**
 * Color Options component
 */
import classNames from "classnames";
import PT from "prop-types";
import SansSerifIcon from "../../../../../assets/images/icon-sans-serif-font.png";
import SerifIcon from "../../../../../assets/images/icon-serif-font.png";
import AnyFont from "../../../../../assets/images/icon-any-font.png";

import styles from "./styles.module.scss";

const FontOptions = ({ selectedFont, onSelect }) => {
  const fontOptions = [
    { name: "Any Fonts", image: AnyFont },
    { name: "Serif", image: SerifIcon },
    { name: "Sans Serif", image: SansSerifIcon },
  ];

  return (
    <div className={styles["fontOptions"]}>
      {fontOptions.map((item, index) => (
        <div
          className={styles["fontWrapper"]}
          key={index}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(index, item.name)}
        >
          <div
            className={classNames(
              styles["image"],
              index === selectedFont ? styles["active"] : null
            )}
            key={index}
          >
            <img src={item.image} alt="serif icon" />
          </div>

          <p className={styles["name"]}>{item.name}</p>
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
