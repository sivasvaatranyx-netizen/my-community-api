import { Role } from '../../common/role.enum';

/** Staff account (admins and security guards). Residents are managed via /admin/residents. */
export interface Account {
  id: string;
  name: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
}
