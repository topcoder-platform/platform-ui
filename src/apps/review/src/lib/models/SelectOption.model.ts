export type SelectOption = {
  value: string;
  label: string;
  // Optional visual indicator for warnings (e.g., pending action)
  warning?: boolean;
  // Optional visual indicator for completion (e.g., obligations completed)
  completed?: boolean;
};
