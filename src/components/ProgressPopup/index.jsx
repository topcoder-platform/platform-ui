/**
 * ProgressPopup
 *
 * Three dots Progress Popup
 */
import { useNavigate } from "@reach/router";
import cn from "classnames";
import PT from "prop-types";
import React, { useEffect, useRef } from "react";
import IconCheck from "../../assets/images/icon-check-thin.svg";
import IconCross from "../../assets/images/icon-cross.svg";
import "./styles.module.scss";

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
          styleName={cn("progress-popup", styleName || "")}
          {...props}
        >
          <IconCross styleName="close-btn" onClick={(e) => handleClose(e)} />
          <div>
            {levels.map((level, levelIndex) => (
              <div
                key={levelIndex}
                styleName={cn("level", getLevelClass(level))}
                onClick={() => {
                  if (getLevelClass(level) !== "") {
                    setStep(level.trueIndex);
                    navigate(level.url);
                  }
                }}
                role="tab"
                tabIndex={0}
              >
                <div styleName={cn("level-check-icon", getLevelClass(level))}>
                  {getLevelClass(level) === "done" && (
                    <IconCheck styleName={"icon-check"} />
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
