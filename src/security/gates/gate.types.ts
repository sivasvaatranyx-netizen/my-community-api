export enum GateType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  BOTH = 'BOTH',
}

export enum GateStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface Gate {
  id: string;
  name: string;
  type: GateType;
  status: GateStatus;
  updatedAt: string;
}
