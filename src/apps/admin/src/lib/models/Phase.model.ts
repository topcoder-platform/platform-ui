export interface Phase {
  id: string;
  name: string;
  description?: string;
  isOpen: boolean;
  duration: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
