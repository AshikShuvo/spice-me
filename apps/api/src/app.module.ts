import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AllergyItemsModule } from './allergy-items/allergy-items.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { MenuModule } from './menu/menu.module.js';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { RestaurantProductsModule } from './restaurant-products/restaurant-products.module.js';
import { RestaurantTablesModule } from './restaurant-tables/restaurant-tables.module.js';
import { RestaurantsModule } from './restaurants/restaurants.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    CategoriesModule,
    AllergyItemsModule,
    ProductsModule,
    RestaurantProductsModule,
    RestaurantTablesModule,
    MenuModule,
    PlatformSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
