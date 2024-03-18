export interface ConfirmFlowData {
    title: string;
    action: string;
    content: React.ReactNode | (() => React.ReactNode)
    showButtons?: boolean;
    callback?: () => void;
}
