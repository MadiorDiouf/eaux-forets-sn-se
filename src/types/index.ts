export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  subItems?: {
    id: string;
    label: string;
  }[];
}

export interface Report {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  progress: number;
}

export interface BarChart {
  size: number;
  className?: string;
}

export interface PieChart {
  size: number;
  className?: string;
}

export interface LineChart {
  size: number;
  className?: string;
}

export interface Filter {
  size: number;
  className?: string;
}

export interface Download {
  size: number;
  className?: string;
}

export interface Clock {
  size: number;
  className?: string;
}

export interface Calendar {
  size: number;
  className?: string;
}

export interface Eye {
  size: number;
  className?: string;
}