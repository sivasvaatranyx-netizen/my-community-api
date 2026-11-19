import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * DEMO AUTH ONLY.
 * Reads the caller's role and id from the `x-role` and `x-user-id` headers.
 * Replace with JWT / OTP-based authentication before going anywhere near production.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const role = req.headers['x-role'] as Role | undefined;
    if (!role) throw new UnauthorizedException('Missing x-role header');
    if (!required.includes(role)) {
      throw new ForbiddenException(`Role ${role} cannot access this resource`);
    }
    req.user = { id: (req.headers['x-user-id'] as string) ?? 'anonymous', role };
    return true;
  }
}
