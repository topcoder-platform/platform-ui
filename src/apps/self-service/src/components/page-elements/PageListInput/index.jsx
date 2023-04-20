/**
 * PageListInput
 *
 * A List Of grouped Inputs, used in build my profile page
 */
import cn from "classnames";
import PT from "prop-types";

import { Button } from "~/libs/ui";

import { currencyFormat } from "../../../utils";
import styles from "./styles.module.scss";

const PageListInput = ({
  name,
  addListInputItem,
  styleName,
  children,
  canAdd,
  pageCost,
}) => {
  return (
    <div className={cn(styles["page-list-input"], !!styleName ? styles[styleName] : undefined)}>
      <div>
        <div>{children}</div>
        <div className={styles["add-listinput-item-button"]}>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => addListInputItem(name)}
          >
            {canAdd && (
              <div>
                <p className={styles["pageText"]}>NEED ANOTHER PAGE?</p>
                <Button secondary size="lg">
                  ADD PAGE: +{currencyFormat(pageCost)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PageListInput.propTypes = {
  addListInputItem: PT.func,
  children: PT.node,
};

export default PageListInput;
