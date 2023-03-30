import PT from "prop-types";
import React from "react";
import Markdown from "react-markdown";

export default function SpecificationComponent({ bodyText, format }) {
  if (format === "markdown") {
    return <Markdown source={bodyText} />;
  }
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: bodyText,
      }}
    />
  );
}

SpecificationComponent.defaultProps = {
  bodyText: "",
  format: "HTML",
};

SpecificationComponent.propTypes = {
  bodyText: PT.string,
  format: PT.string,
};
