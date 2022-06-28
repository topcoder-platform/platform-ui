/**
 * Tab element
 */
import classNames from "classnames";
import PT from "prop-types";
import React, { useEffect, useState } from "react";
import { currencyFormat } from "utils/";
import { v4 as uuidv4 } from "uuid";
import ComputerIconActive from "../../../../assets/images/icon-device-computer-active.svg";
import ComputerIcon from "../../../../assets/images/icon-device-computer.svg";
import PhoneIconActive from "../../../../assets/images/icon-device-phone-active.svg";
import PhoneIcon from "../../../../assets/images/icon-device-phone.svg";
import TabletIconActive from "../../../../assets/images/icon-device-tablet-active.svg";
import TabletIcon from "../../../../assets/images/icon-device-tablet.svg";
import "./styles.module.scss";

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
    <div styleName="device-types">
      {types.map((type, index) => {
        const isActive = selectedIndexes.includes(index) || type.included;
        return (
          <div
            styleName="device"
            key={uuidv4()}
            role="button"
            tabIndex={0}
            onClick={() => handleDeviceSelection(index, type)}
          >
            <div
              styleName={classNames("iconWrapper", isActive ? "active" : null)}
            >
              {isActive ? type.iconActive : type.icon}
            </div>
            <div styleName="title">{type.title}</div>
            <div styleName="subTitle">{type.description}</div>
            {type.subDescription && (
              <div styleName="subDescription">{type.subDescription}</div>
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
