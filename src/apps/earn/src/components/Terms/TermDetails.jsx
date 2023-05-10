/**
 * Terms details component which display text of an agreement
 */

import React from "react";
import PT from "prop-types";

import { styled as styledCss } from "@earn/utils";
import { LoadingCircles } from "~/libs/ui";

import styles from "./TermDetails.module.scss";

const styled = styledCss(styles);

export default class TermDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingFrame: false,
    };
    this.frameLoaded = this.frameLoaded.bind(this);
  }

  componentWillMount() {
    const { details, getDocuSignUrl } = this.props;
    if (
      details.agreeabilityType !== "Electronically-agreeable" &&
      details.docusignTemplateId
    ) {
      getDocuSignUrl(details.docusignTemplateId);
      this.setState({ loadingFrame: true });
    }
  }

  frameLoaded() {
    this.setState({
      loadingFrame: false,
    });
  }

  render() {
    const { details, docuSignUrl, loadingDocuSignUrl } = this.props;
    const { loadingFrame } = this.state;

    return (
      <div>
        {details.agreeabilityType === "Electronically-agreeable" && (
          <div>
            <div
              dangerouslySetInnerHTML={{
                __html: details.text.replace(/topcoder/gi, "Topcoder"),
              }}
              className={styled("body")}
            />
          </div>
        )}
        {details.agreeabilityType !== "Electronically-agreeable" &&
          details.docusignTemplateId === loadingDocuSignUrl && (
            <LoadingCircles />
          )}
        {details.agreeabilityType !== "Electronically-agreeable" &&
          details.docusignTemplateId &&
          !loadingDocuSignUrl &&
          docuSignUrl && (
            <div>
              {loadingFrame && <LoadingCircles />}
              <iframe
                onLoad={this.frameLoaded}
                src={docuSignUrl}
                className={styled(loadingFrame ? "hidden" : "frame")}
                title={details.title}
              />
            </div>
          )}
      </div>
    );
  }
}

TermDetails.defaultProps = {
  details: {},
  docuSignUrl: "",
  loadingDocuSignUrl: "",
};

TermDetails.propTypes = {
  details: PT.shape(),
  docuSignUrl: PT.string,
  loadingDocuSignUrl: PT.string,
  getDocuSignUrl: PT.func.isRequired,
};
