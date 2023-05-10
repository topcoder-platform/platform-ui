const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
context.font = "normal 12px Roboto";

export function measureText(tags) {
  let text = tags.join();
  const metrics = context.measureText(text);

  // tag's:
  // - padding-x: '5px 4px'
  // - border-width: 1px
  // - margin-right: 5px
  return metrics.width + tags.length * 16 - 5;
}
