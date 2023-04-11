import classNames from "classnames"

export const styled = (styles) => (...className) => {
    const classes = classNames(className).split(' ');
    return classNames(classes.map(s => styles[s] ?? s));
}