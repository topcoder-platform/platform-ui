export function createBadgeElement(htmlElement, content) {
  const badgeElement = document.createElement("span");

  badgeElement.classList.add("count-badge");
  badgeElement.textContent = content;
  htmlElement.appendChild(badgeElement);

  return badgeElement;
}
