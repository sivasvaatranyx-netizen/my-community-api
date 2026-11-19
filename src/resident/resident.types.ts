export interface Resident {
  id: string;
  name: string;
  flat: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export enum VisitorStatus {
  PENDING = 'PENDING', // walk-in waiting for resident decision
  APPROVED = 'APPROVED', // pre-approved or approved by resident
  REJECTED = 'REJECTED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
}

export interface Visitor {
  id: string;
  residentId: string;
  flat: string;
  name: string;
  phone: string;
  purpose: string;
  passCode: string;
  status: VisitorStatus;
  source: 'PRE_APPROVED' | 'WALK_IN';
  expectedAt?: string;
  createdAt: string;
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export interface Complaint {
  id: string;
  residentId: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  postedBy: string;
  createdAt: string;
}
