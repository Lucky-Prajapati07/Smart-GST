import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';

@Controller('clients')
@UsePipes(new ValidationPipe({ transform: true }))
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createClientDto: CreateClientDto): Promise<ClientResponseDto> {
    return await this.clientsService.create(createClientDto);
  }

  @Get()
  async findAll(@Query('userId') userId?: string, @Query('gstType') gstType?: string): Promise<ClientResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (gstType) {
      return await this.clientsService.findByGstType(userId, gstType);
    }
    return await this.clientsService.findAll(userId);
  }

  @Get('search/phone/:phoneNumber')
  async findByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
    @Query('userId') userId: string
  ): Promise<ClientResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return await this.clientsService.findByPhoneNumber(userId, phoneNumber);
  }

  @Get('id/:id')
  async findById(
    @Param('id') id: string,
    @Query('userId') userId: string
  ): Promise<ClientResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      throw new Error('Invalid ID format');
    }
    return await this.clientsService.findById(userId, clientId);
  }

  @Get(':gstin')
  async findOne(
    @Param('gstin') gstin: string,
    @Query('userId') userId: string
  ): Promise<ClientResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return await this.clientsService.findOne(userId, gstin);
  }

  @Patch(':gstin')
  async update(
    @Param('gstin') gstin: string,
    @Query('userId') userId: string,
    @Body() updateClientDto: UpdateClientDto
  ): Promise<ClientResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return await this.clientsService.update(userId, gstin, updateClientDto);
  }

  @Patch('id/:id')
  async updateById(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() updateClientDto: UpdateClientDto
  ): Promise<ClientResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      throw new Error('Invalid ID format');
    }
    return await this.clientsService.updateById(userId, clientId, updateClientDto);
  }

  @Delete(':gstin')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('gstin') gstin: string,
    @Query('userId') userId: string
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return await this.clientsService.remove(userId, gstin);
  }

  @Delete('id/:id')
  @HttpCode(HttpStatus.OK)
  async removeById(
    @Param('id') id: string,
    @Query('userId') userId: string
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new Error('userId is required');
    }
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      throw new Error('Invalid ID format');
    }
    return await this.clientsService.removeById(userId, clientId);
  }
}
