import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuQueryDto } from './dto/menu-query.dto.js';
import { MenuService } from './menu.service.js';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({
    summary: 'Public menu (global catalog or restaurant-specific)',
  })
  getMenu(@Query() query: MenuQueryDto) {
    return this.menuService.getMenu(query.restaurantCode);
  }
}
