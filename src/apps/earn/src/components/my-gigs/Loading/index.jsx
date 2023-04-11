import PuffLoader from "react-spinners/PuffLoader";
import PT from "prop-types";
import styles from "./styles.scss";

const Loading = (props) => {
  const { bgColor, children, color, width } = props;
  return (
    <div className={styles["loading-wrapper"]} style={{ backgroundColor: bgColor }}>
      <div className={styles["loading-inner"]}>
        <div>
          <PuffLoader color={color} loading={true} size={width} />
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
  width: 35,
};

Loading.propTypes = {
  bgColor: PT.string,
  children: PT.node,
  color: PT.string,
  width: PT.number,
};

export default Loading;
