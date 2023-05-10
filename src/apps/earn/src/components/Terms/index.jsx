/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/**
 * Terms component which displays modal window with term details
 */
/* eslint jsx-a11y/no-static-element-interactions:0 */

import _ from "lodash";
import React from "react";
import PT from "prop-types";
import FocusTrap from "focus-trap-react";

import { BaseModal, Button, LoadingCircles } from "~/libs/ui";

import TermDetails from "./TermDetails";
import styles from "./styles.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

function handleScroll(scrollElement, masks, orientation) {
  let length;
  let base;
  let clientSize;
  if (orientation === "vertical") {
    length = "scrollHeight";
    base = "scrollTop";
    clientSize = "clientHeight";
  } else {
    clientSize = "clientWidth";
    length = "scrollWidth";
    base = "scrollLeft";
  }
  const mask1 = masks[0];
  const mask2 = masks[1];
  // When the scrollbar reaches end, disable mask2.
  if (
    scrollElement[length] - scrollElement[base] ===
    scrollElement[clientSize]
  ) {
    mask2.style.display = "none";
  } else if (scrollElement[base] === 0) {
    // At the beginning, disable mask1.
    mask1.style.display = "none";
  } else {
    // Show both masks in between.
    mask1.style.display = "block";
    mask2.style.display = "block";
    if (orientation === "vertical") {
      mask1.style.top = `${scrollElement[base]}px`;
      mask2.style.bottom = `${-scrollElement[base]}px`;
    }
  }
}

export default class Terms extends React.Component {
  constructor(props) {
    super(props);

    this.selectTerm = this.selectTerm.bind(this);
    this.messageHandler = this.messageHandler.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);
    this.nextTerm = this.nextTerm.bind(this);
    this.max = 0;
    this.terms = React.createRef();
  }

  componentDidMount() {
    const { loadDetails, selectedTerm } = this.props;
    if (selectedTerm) {
      loadDetails(selectedTerm.id);
    }
    window.addEventListener("message", this.messageHandler, false);
    window.addEventListener("resize", this.resizeHandler, false);
    this.terms.current?.focus?.();
  }

  componentWillReceiveProps(nextProps) {
    const {
      selectedTerm,
      loadDetails,
      terms,
      checkStatus,
      canRegister,
      onCancel,
      register,
    } = this.props;
    if (
      nextProps.selectedTerm &&
      !_.isEqual(selectedTerm, nextProps.selectedTerm) &&
      nextProps.loadingTermId !== _.toString(nextProps.selectedTerm.id)
    ) {
      loadDetails(nextProps.selectedTerm.id);
    }
    if (
      !_.every(terms, "agreed") &&
      _.every(nextProps.terms, "agreed") &&
      !nextProps.checkingStatus
    ) {
      checkStatus();
    }
    if (!canRegister && nextProps.canRegister) {
      onCancel();
      register();
    }
  }

  componentDidUpdate() {
    this.terms.current?.focus?.();
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.messageHandler);
    window.removeEventListener("resize", this.resizeHandler);
  }

  selectTerm(term) {
    const { selectTerm, selectedTerm } = this.props;
    if (selectedTerm !== term) {
      selectTerm(term);
    }
  }

  nextTerm() {
    const { terms, selectTerm } = this.props;
    const term = _.find(terms, (t) => !t.agreed);
    selectTerm(term);
  }

  messageHandler(event) {
    const { onCancel, selectedTerm, signDocu } = this.props;
    if (event.data.type === "DocuSign") {
      if (
        event.data.event === "signing_complete" ||
        event.data.event === "viewing_complete"
      ) {
        signDocu(selectedTerm.id);
      } else {
        onCancel();
      }
    }
  }

  resizeHandler() {
    const cname = styles["mask-h"];
    const masks = document.getElementsByClassName(cname);
    if (this.hScrollElement.scrollWidth === this.hScrollElement.clientWidth) {
      // eslint-disable-next-line no-param-reassign
      _.forEach(masks, (m) => {
        m.style.display = "none";
      });
    } else {
      // set the mask style if need
      handleScroll(this.hScrollElement, masks, "horizonal");
    }
  }

  render() {
    const {
      onCancel,
      terms,
      details,
      loadingTermId,
      docuSignUrl,
      getDocuSignUrl,
      agreeTerm,
      agreeingTerm,
      isLoadingTerms,
      loadingDocuSignUrl,
      selectedTerm,
      viewOnly,
      checkingStatus,
      description,
      defaultTitle,
    } = this.props;

    const handleHorizonalScroll = (e) => {
      const scrollElement = e.target;

      const cname = styles["mask-h"];
      /* eslint-env browser */
      const masks = document.getElementsByClassName(cname);
      handleScroll(scrollElement, masks, "horizonal");
    };

    const handleVerticalScroll = (e) => {
      const scrollElement = e.target;

      const cname = styles["mask-v"];
      /* eslint-env browser */
      const masks = document.getElementsByClassName(cname);
      handleScroll(scrollElement, masks, "vertical");
    };

    return (
      <div key={(selectedTerm || {}).id}>
        <FocusTrap>
          <BaseModal
            open
            onCancel={onCancel}
            theme={{ container: styles["modal-container"] }}
            size="lg"
            title={terms.length > 1 ? defaultTitle : (terms[0] ?? {}).title ?? ''}
            buttons={!isLoadingTerms &&
                !checkingStatus &&
                selectedTerm &&
                details &&
                !viewOnly &&
                loadingTermId !== _.toString(selectedTerm.id) &&
                details.agreeabilityType === "Electronically-agreeable" ? (
                selectedTerm?.agreed ? (
                  <Button
                    primary
                    size='lg'
                    onClick={(e) => {
                      this.nextTerm(e);
                      if (this.vScrollArea) {
                        this.vScrollArea.scrollTop = 0;
                      }
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      primary
                      size='lg'
                      disabled={agreeingTerm === details.id}
                      onClick={() => {
                        agreeTerm(details.id);
                        if (this.vScrollArea) {
                          this.vScrollArea.scrollTop = 0;
                        }
                      }}
                    >
                      I Agree
                    </Button>
                    <Button secondary size='lg' onClick={onCancel}>
                      I Disagree
                    </Button>
                  </>
                )
            ) : (
              <div className={styled("bottom-placeholder")} />
            )}
          >
            {isLoadingTerms && <LoadingCircles />}
            {!isLoadingTerms && (
              <div className={styled("modal-content")} ref={this.terms} tabIndex="0">
                <div
                  onScroll={handleVerticalScroll}
                  ref={(node) => {
                    this.vScrollArea = node;
                  }}
                  className={styled("scrollable-area")}
                >
                  <div className={styled("mask-v top")} />
                  <div className={styled("mask-v bottom")} />
                  <div className={styled("desc")}>{description}</div>
                  {checkingStatus && <LoadingCircles />}
                  {!checkingStatus && terms.length > 1 && (
                    <div className={styled("tabs-outer")}>
                      <div className={styled("mask-h left")} />
                      <div className={styled("mask-h right")} />
                      <div
                        className={styled("tabs-inner")}
                        onScroll={handleHorizonalScroll}
                        ref={(e) => {
                          this.hScrollElement = e;
                        }}
                      >
                        {terms.map((t, index) => (
                          <div
                            key={t.id}
                            /* TODO: No need to use so much style names and
                             * related logic here. It can be simplified:
                             * "view-only" style should move to the root
                             * level, other conditions should be merged
                             * into "tab" style ID, and correctly handled
                             * at SCSS side. */
                            className={styled(`tab ${
                              t.agreed && !viewOnly ? "agreed" : ""
                            } ${selectedTerm === t ? "active" : ""} ${
                              viewOnly ? "view-only" : ""
                            }`)}
                          >
                            <div
                              className={styled("tab-index")}
                              onClick={() => this.selectTerm(t)}
                              onKeyPress={() => this.selectTerm(t)}
                            >
                              {index + 1}
                            </div>
                            <div
                              className={styled("tab-title")}
                              tabIndex="0"
                              role="tab"
                              onClick={() => this.selectTerm(t)}
                              onKeyPress={() => this.selectTerm(t)}
                            >
                              {t.title}
                            </div>
                            {index < terms.length - 1 && (
                              <div className={styled("tab-bar")} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!checkingStatus && selectedTerm && (
                    <div
                      /* TODO: Most probably, can be replaced with
                       * :only-child selector. */
                      className={styled(terms.length === 1 ? "single" : "")}
                    >
                      {terms.length > 1 && (
                        <div className={styled("sub-title")}>{selectedTerm.title}</div>
                      )}
                      {loadingTermId === _.toString(selectedTerm.id) && (
                        <LoadingCircles />
                      )}
                      {loadingTermId !== _.toString(selectedTerm.id) &&
                        details && (
                          <TermDetails
                            details={details}
                            docuSignUrl={docuSignUrl}
                            getDocuSignUrl={getDocuSignUrl}
                            loadingDocuSignUrl={loadingDocuSignUrl}
                          />
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </BaseModal>
        </FocusTrap>
      </div>
    );
  }
}

Terms.defaultProps = {
  terms: [],
  description: "",
  defaultTitle: "Terms & Conditions of Use",
  details: {},
  loadingTermId: "",
  docuSignUrl: "",
  agreeingTerm: "",
  isLoadingTerms: false,
  loadingDocuSignUrl: "",
  selectedTerm: null,
  viewOnly: false,
};

Terms.propTypes = {
  description: PT.string,
  defaultTitle: PT.string,
  onCancel: PT.func.isRequired,
  terms: PT.arrayOf(PT.shape()),
  loadDetails: PT.func.isRequired,
  details: PT.shape(),
  loadingTermId: PT.string,
  docuSignUrl: PT.string,
  getDocuSignUrl: PT.func.isRequired,
  register: PT.func.isRequired,
  agreeTerm: PT.func.isRequired,
  agreeingTerm: PT.string,
  isLoadingTerms: PT.bool,
  loadingDocuSignUrl: PT.string,
  selectedTerm: PT.shape(),
  checkStatus: PT.func.isRequired,
  canRegister: PT.bool.isRequired,
  checkingStatus: PT.bool.isRequired,
  signDocu: PT.func.isRequired,
  selectTerm: PT.func.isRequired,
  viewOnly: PT.bool,
};
