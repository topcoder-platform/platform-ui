/**
 * ProgressPopup
 *
 * Three dots Progress Popup
 */
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import PT from "prop-types";
import React, { useEffect, useRef } from "react";
import { ReactComponent as IconCheck } from "../../assets/images/icon-check-thin.svg";
import { ReactComponent as IconCross } from "../../assets/images/icon-cross.svg";
import styles from "./styles.module.scss";

const ProgressPopup = ({
  level,
  maxStep,
  levels,
  open,
  setStep,
  handleClose = (e) => e,
  styleName,
  ...props
}) => {
  const useOutsideAlerter = (ref) => {
    useEffect(() => {
      function handleClickOutside(event) {
        if (ref.current && !ref.current.contains(event.target)) {
          handleClose(event);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  };

  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef);
  const navigate = useNavigate();
  // add a class to show if it's done or current or notDone yet
  const getLevelClass = (curLevel) => {
    return curLevel.trueIndex === level
      ? "current"
      : curLevel.trueIndex < maxStep
        ? "done"
        : "";
  };
  return (
    <>
      {open && (
        <div
          ref={wrapperRef}
          className={cn(styles["progress-popup"], !!styleName ? styles[styleName] : undefined)}
          {...props}
        >
          <IconCross className={styles["close-btn"]} onClick={(e) => handleClose(e)} />
          <div>
            {levels.map((level, levelIndex) => (
              <div
                key={levelIndex}
                className={cn(styles["level"], getLevelClass(level))}
                onClick={() => {
                  if (getLevelClass(level) !== "") {
                    setStep(level.trueIndex);
                    navigate(level.url);
                  }
                }}
                role="tab"
                tabIndex={0}
              >
                <div className={cn(styles["level-check-icon"], getLevelClass(level))}>
                  {getLevelClass(level) === "done" && (
                    <IconCheck className={styles["icon-check"]} />
                  )}
                </div>
                {level.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

ProgressPopup.propTypes = {
  level: PT.number,
  maxStep: PT.number,
  levels: PT.array,
  open: PT.bool,
  handleClose: PT.func,
};

export default ProgressPopup;
