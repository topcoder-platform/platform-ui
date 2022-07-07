/**
 * Tab element
 */
import classNames from "classnames";
import PT from "prop-types";
import React, { useEffect, useState } from "react";

import { currencyFormat } from "../../../../utils/";
import { ReactComponent as ComputerIconActive } from "../../../../assets/images/icon-device-computer-active.svg";
import { ReactComponent as ComputerIcon } from "../../../../assets/images/icon-device-computer.svg";
import { ReactComponent as PhoneIconActive } from "../../../../assets/images/icon-device-phone-active.svg";
import { ReactComponent as PhoneIcon } from "../../../../assets/images/icon-device-phone.svg";
import { ReactComponent as TabletIconActive } from "../../../../assets/images/icon-device-tablet-active.svg";
import { ReactComponent as TabletIcon } from "../../../../assets/images/icon-device-tablet.svg";

import styles from "./styles.module.scss";

const DeviceTypes = ({ numOfPages, selectedOptions, onSelect }) => {
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  const types = [
    {
      title: "Computer",
      description: "(Included)",
      icon: <ComputerIcon />,
      included: true,
      iconActive: <ComputerIconActive />,
    },
    {
      title: "Tablet",
      description: `+${currencyFormat(numOfPages * 99)}`, // TODO: move this to constants
      subDescription: "($99 / page)",
      icon: <TabletIcon />,
      iconActive: <TabletIconActive />,
    },
    {
      title: "Phone",
      description: `+${currencyFormat(numOfPages * 99)}`, // TODO: move this to constants
      subDescription: "($99 / page)",
      icon: <PhoneIcon />,
      iconActive: <PhoneIconActive />,
    },
  ];

  useEffect(() => {
    // backward compatible with old version.
    if (typeof selectedOptions == "number") {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      selectedOptions = [selectedOptions];
    }
    setSelectedIndexes(
      selectedOptions.filter((index) => !types[index].included)
    );
  }, [selectedOptions]);

  const handleDeviceSelection = (index, type) => {
    if (!type.included) {
      let newSelectedIndexes = [];
      if (selectedIndexes.includes(index)) {
        newSelectedIndexes = selectedIndexes.filter((i) => i !== index);
      } else {
        newSelectedIndexes = [...selectedIndexes, index];
      }
      setSelectedIndexes(newSelectedIndexes);
      sendSelectedType(newSelectedIndexes);
    }
  };

  const sendSelectedType = (indexes) => {
    const selectedItems = [
      ...types
        .filter((item) => !!item.included)
        .map((item) => types.indexOf(item)),
      ...indexes,
    ];
    onSelect(
      selectedItems,
      selectedItems.map((index) => types[index].title)
    );
  };

  return (
    <div className={styles["device-types"]}>
      {types.map((type, index) => {
        const isActive = selectedIndexes.includes(index) || type.included;
        return (
          <div
            className={styles["device"]}
            key={index}
            role="button"
            tabIndex={0}
            onClick={() => handleDeviceSelection(index, type)}
          >
            <div
              className={classNames(styles["iconWrapper"], isActive ? styles["active"] : null)}
            >
              {isActive ? type.iconActive : type.icon}
            </div>
            <div>{type.title}</div>
            <div className={styles["subTitle"]}>{type.description}</div>
            {type.subDescription && (
              <div className={styles["subDescription"]}>{type.subDescription}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

DeviceTypes.defaultProps = {
  selectedOptions: [0],
};

DeviceTypes.propTypes = {
  selectedOptions: PT.arrayOf(PT.number),
  onSelect: PT.func,
};

export default DeviceTypes;
