import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums.js';
import type { JwtUser } from '../auth/types/jwt-user.type.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RestaurantScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Table and reservation staff routes: assigned RESTAURANT_ADMIN only (not platform ADMIN).
   */
  async assertAssignedRestaurantAdmin(
    restaurantId: string,
    user: JwtUser,
  ): Promise<void> {
    if (user.role !== Role.RESTAURANT_ADMIN) {
      throw new ForbiddenException(
        'Only restaurant administrators can manage tables for this location',
      );
    }
    const assignment = await this.prisma.restaurantAdminAssignment.findFirst({
      where: { restaurantId, userId: user.userId },
    });
    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this restaurant');
    }
  }
}
