import styles from "./styles.scss";
import  { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { GIG_LIST_ROUTE } from "../../../constants/routes";
import { UiButton } from "~/libs/ui";

const GigsFulFill = () => {
  const navigate = useNavigate();
  const onClickBtnViewOther = useCallback(() => {
    navigate(GIG_LIST_ROUTE);
  }, []);
  return (
    <div className={styles["container"]}>
      <h3>THIS GIG HAS BEEN FULFILLED</h3>
      <div className={styles["action"]}>
        <UiButton secondary size="md" onClick={onClickBtnViewOther}>
          VIEW OTHER GIGS
        </UiButton>
      </div>
    </div>
  );
};

export default GigsFulFill;
