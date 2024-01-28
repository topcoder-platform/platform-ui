export type Column = {
    Header: string;
    accessor: string;
    Cell?: (props: { row: any }) => JSX.Element;
};
