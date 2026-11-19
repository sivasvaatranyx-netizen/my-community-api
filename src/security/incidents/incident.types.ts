export enum IncidentType {
  THEFT = 'THEFT',
  FIRE = 'FIRE',
  MEDICAL = 'MEDICAL',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  VANDALISM = 'VANDALISM',
  OTHER = 'OTHER',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
}

export interface IncidentNote {
  at: string;
  by: string;
  note: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  location: string;
  description: string;
  reportedBy: string;
  status: IncidentStatus;
  notes: IncidentNote[];
  createdAt: string;
  updatedAt: string;
}
