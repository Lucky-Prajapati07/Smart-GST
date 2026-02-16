import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingsDto, UpdateSettingsDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':userId')
  async getSettings(@Param('userId') userId: string) {
    return this.settingsService.getSettingsByUserId(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSettings(@Body() createSettingsDto: CreateSettingsDto) {
    return this.settingsService.createSettings(createSettingsDto);
  }

  @Put(':userId')
  async updateSettings(
    @Param('userId') userId: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(userId, updateSettingsDto);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSettings(@Param('userId') userId: string) {
    return this.settingsService.deleteSettings(userId);
  }
}
