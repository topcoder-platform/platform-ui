/**
 * Slider
 *
 * Slider
 */
import React, { useCallback, useMemo, useRef } from "react";
import PT from "prop-types";
import Carousel from "react-elastic-carousel";

import { ReactComponent as ImgArrowRight} from "../../assets/images/arrow-right.svg";

import styles from "./styles.module.scss";
import "./styles.scss";

const SliderArrow = ({ type, onClick, isEdge }) => {
  const isPrevButton = type === "PREV";

  return (
    <button
      className={`${styles.appSliderArrow}${
        isEdge ? ` ${styles.appSliderArrowHidden}` : ""
      } ${
        isPrevButton ? styles.appSliderArrowPrev : styles.appSliderArrowNext
      }`}
      onClick={onClick}
    >
      {isPrevButton ? <ImgArrowRight /> : <ImgArrowRight />}
    </button>
  );
};

const AUTOPLAY_SPEED = 4000; //in ms

const Slider = ({ children, className }) => {
  const carouselRef = useRef();
  const resetTimeoutRef = useRef();

  const breakPoints = useMemo(
    () => [
      { width: 1, itemsToShow: 1, enableAutoPlay: true },
      { width: 720, itemsToShow: 2 },
      { width: 980, itemsToShow: 3 },
    ],
    []
  );

  const handleNextEnd = useCallback(({ index }) => {
    if (!carouselRef.current) {
      return;
    }

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    const totalPages = carouselRef.current.state.pages.length;

    console.log({
      carouselRef: carouselRef.current,
      getNumOfPages: carouselRef.current.getNumOfPages(),
    });

    if (index + 1 === totalPages) {
      if (carouselRef?.current?.goTo) {
        resetTimeoutRef.current = setTimeout(() => {
          if (carouselRef?.current?.goTo) {
            carouselRef.current.goTo(0);
          }
        }, AUTOPLAY_SPEED);
      }
    }
  }, []);

  return (
    // @ts-ignore
    <Carousel
      disableArrowsOnEnd
      enableAutoPlay
      ref={carouselRef}
      autoPlaySpeed={AUTOPLAY_SPEED}
      breakPoints={breakPoints}
      className={`${styles.appSlider} app-slider${
        className ? ` ${className}` : ""
      }`}
      itemsToShow={3}
      renderArrow={SliderArrow}
      onNextEnd={handleNextEnd}
    >
      {children.map((item, i) => {
        return (
          <div className="item-container" key={i}>
            {item}
          </div>
        );
      })}
    </Carousel>
  );
};

Slider.propTypes = {
  children: PT.node,
};

export default Slider;
