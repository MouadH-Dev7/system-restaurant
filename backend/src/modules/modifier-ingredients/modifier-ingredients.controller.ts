import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateModifierIngredientDto } from './dto/create-modifier-ingredient.dto';
import { UpdateModifierIngredientDto } from './dto/update-modifier-ingredient.dto';
import { ModifierIngredientsService } from './modifier-ingredients.service';

@Controller('modifier-ingredients')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class ModifierIngredientsController {
  constructor(private readonly service: ModifierIngredientsService) {}

  @Get()
  findByModifierOption(@Query('modifierOptionId') modifierOptionId: string) {
    return this.service.findByModifierOption(modifierOptionId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateModifierIngredientDto) {
    return this.service.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateModifierIngredientDto) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
