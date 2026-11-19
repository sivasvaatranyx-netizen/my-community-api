import { Role } from './role.enum';

/** Permission matrix surfaced by GET /admin/roles (documentation / future fine-grained guards). */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.RESIDENT]: [
    'profile:read', 'profile:write', 'visitor:preapprove', 'visitor:decide',
    'amenity:book', 'payment:pay', 'complaint:create', 'notice:read',
  ],
  [Role.SECURITY]: [
    'visitor:verify', 'visitor:checkin', 'visitor:checkout',
    'gate:operate', 'incident:report', 'incident:update',
  ],
  [Role.ADMIN]: [
    'user:manage', 'resident:manage', 'notice:publish', 'complaint:manage',
    'invoice:manage', 'amenity:manage', 'config:manage', 'report:view', 'integration:view',
  ],
};
