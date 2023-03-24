import React from "react";
import ReactLoading from "react-loading";
import PT from "prop-types";
import styles from "./styles.scss";

const Loading = (props) => {
  const { bgColor, children, color, type, height, width } = props;
  return (
    <div className={styles["loading-wrapper"]} style={{ backgroundColor: bgColor }}>
      <div className={styles["loading-inner"]}>
        <div>
          <ReactLoading
            type={type}
            color={color}
            height={height}
            width={width}
          />
        </div>
        <h6>LOADING</h6>
        {children && <span>{children}</span>}
      </div>
    </div>
  );
};

Loading.defaultProps = {
  bgColor: "rgba(42,42,42, 0.07)",
  color: "#0ab88a",
  type: "spin",
  width: 35,
  height: 35,
};

Loading.propTypes = {
  bgColor: PT.string,
  children: PT.node,
  color: PT.string,
  type: PT.string,
  width: PT.number,
  height: PT.number,
};

export default Loading;
