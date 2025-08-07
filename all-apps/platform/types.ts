
export interface Project {
  id: string;
  name: string;
}

export interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}
