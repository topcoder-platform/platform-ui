/**
 * Tab element
 */
import PT from "prop-types";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import "./styles.module.scss";

const Tab = ({ title, subTitle, price, onClick, selected }) => {
  return (
    <div
      styleName={`tab ${selected ? "tab-selected" : ""}`}
      key={uuidv4()}
      role="button"
      tabIndex={0}
      onClick={onClick}
    >
      <div styleName="title">{title}</div>
      <div styleName="subTitle">{subTitle}</div>
      <div styleName="price">STARTING AT ${price}</div>
    </div>
  );
};

Tab.defaultProps = {
  title: "",
  subTitle: "",
  price: 0,
};

Tab.propTypes = {
  title: PT.string,
  subTitle: PT.string,
  price: PT.number,
  onClick: PT.func,
};

export default Tab;
