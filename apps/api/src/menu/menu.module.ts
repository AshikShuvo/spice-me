import { Module } from '@nestjs/common';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsModule } from '../products/products.module.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';

@Module({
  imports: [PrismaModule, ProductsModule, PlatformSettingsModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
