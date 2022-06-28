/**
 * PageListInput
 *
 * A List Of grouped Inputs, used in build my profile page
 */
import cn from "classnames";
import Button from "components/Button";
import { BUTTON_SIZE, BUTTON_TYPE } from "constants/";
import PT from "prop-types";
import React from "react";
import { currencyFormat } from "utils/";
import "./styles.module.scss";

const PageListInput = ({
  name,
  addListInputItem,
  styleName,
  children,
  canAdd,
  pageCost,
}) => {
  return (
    <div styleName={cn("page-list-input", styleName || "")}>
      <div>
        <div>{children}</div>
        <div styleName="add-listinput-item-button">
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => addListInputItem(name)}
          >
            {canAdd && (
              <div>
                <p styleName="pageText">NEED ANOTHER PAGE?</p>
                <Button type={BUTTON_TYPE.SECONDARY} size={BUTTON_SIZE.MEDIUM}>
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
