import React from "react";
import styles from "./styles.module.scss";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles)

export default function ChallengeLoading() {
  return (
    <div className={styled("challenge-loading")}>
      <div className={styled("track placeholder-template")}></div>
      <div className={styled("main")}>
        <div className={styled("title placeholder-template")}></div>
        <div className={styled("info placeholder-template")}></div>
        <div className={styled("footer placeholder-template")}></div>
      </div>
      <div>
        <div className={styled("prize placeholder-template")}></div>
        <div className={styled("prize-nominal placeholder-template")}></div>
      </div>
    </div>
  );
}
