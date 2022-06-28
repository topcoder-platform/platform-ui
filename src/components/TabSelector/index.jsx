/**
 * ProgressPopup
 *
 * Tab Selector
 */
import PT from "prop-types";
import React from "react";
import { currencyFormat } from "utils/";
import "./styles.module.scss";
import Tab from "./Tab";

const TabSelector = ({ items, selectedState, handleClick = (e) => e }) => {
  return (
    <div styleName="tabSelector">
      {items.map((item) => (
        <Tab
          title={item.title}
          subTitle={item.subTitle}
          price={currencyFormat(item.price)}
          onClick={() => handleClick(item)}
          selected={selectedState === item.title}
        />
      ))}
    </div>
  );
};

TabSelector.defaultProps = {
  items: [],
};

TabSelector.propTypes = {
  items: PT.arrayOf(PT.shape()),
  handleClick: PT.func,
};

export default TabSelector;
