import cn from "classnames"

export const sn = (stylesheet) => (classNamesString) => {
    const classNames = cn(classNamesString).split(' ').filter(Boolean);
    return cn(classNames.map(c => stylesheet[c]));
}