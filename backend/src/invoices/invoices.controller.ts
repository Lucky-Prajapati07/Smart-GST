import { 
  BadRequestException,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import type { File as MulterFile } from 'multer';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { OcrExtractResponseDto } from './dto/ocr-extract-response.dto';

@Controller('invoices')
@UsePipes(new ValidationPipe({ transform: true }))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('ocr/extract')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async extractFromOcr(
    @UploadedFile() file: MulterFile,
    @Body('userId') userId: string,
    @Body('createClientIfMissing') createClientIfMissing?: string | boolean,
  ): Promise<OcrExtractResponseDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (!file) {
      throw new BadRequestException('file is required');
    }

    const shouldCreateClient =
      createClientIfMissing === undefined
        ? true
        : String(createClientIfMissing).toLowerCase() !== 'false';

    return await this.invoicesService.extractFromDocument(userId, file, shouldCreateClient);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    return await this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  async findAll(
    @Query('userId') userId: string,
    @Query('invoiceType') invoiceType?: string,
    @Query('status') status?: string,
    @Query('partyGstin') partyGstin?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<InvoiceResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    
    if (startDate && endDate) {
      return await this.invoicesService.findByDateRange(userId, startDate, endDate);
    }
    if (invoiceType) {
      return await this.invoicesService.findByInvoiceType(userId, invoiceType);
    }
    if (status) {
      return await this.invoicesService.findByStatus(userId, status);
    }
    if (partyGstin) {
      return await this.invoicesService.findByPartyGstin(userId, partyGstin);
    }
    return await this.invoicesService.findAll(userId);
  }

  @Get('stats')
  async getStats(@Query('userId') userId: string): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.getInvoiceStats(userId);
  }

  @Get('search/invoice-number/:invoiceNumber')
  async findByInvoiceNumber(
    @Query('userId') userId: string,
    @Param('invoiceNumber') invoiceNumber: string
  ): Promise<InvoiceResponseDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.findByInvoiceNumber(userId, invoiceNumber);
  }

  @Get('search/party-gstin/:partyGstin')
  async findByPartyGstin(
    @Query('userId') userId: string,
    @Param('partyGstin') partyGstin: string
  ): Promise<InvoiceResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.findByPartyGstin(userId, partyGstin);
  }

  @Get('search/type/:invoiceType')
  async findByInvoiceType(
    @Query('userId') userId: string,
    @Param('invoiceType') invoiceType: string
  ): Promise<InvoiceResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.findByInvoiceType(userId, invoiceType);
  }

  @Get('search/status/:status')
  async findByStatus(
    @Query('userId') userId: string,
    @Param('status') status: string
  ): Promise<InvoiceResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.findByStatus(userId, status);
  }

  @Get(':id')
  async findOne(
    @Query('userId') userId: string,
    @Param('id') id: string
  ): Promise<InvoiceResponseDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.invoicesService.findOne(userId, invoiceId);
  }

  @Patch(':id')
  async update(
    @Query('userId') userId: string,
    @Param('id') id: string, 
    @Body() updateInvoiceDto: UpdateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.invoicesService.update(userId, invoiceId, updateInvoiceDto);
  }

  @Patch('invoice-number/:invoiceNumber')
  async updateByInvoiceNumber(
    @Query('userId') userId: string,
    @Param('invoiceNumber') invoiceNumber: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.updateByInvoiceNumber(userId, invoiceNumber, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Query('userId') userId: string,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.invoicesService.remove(userId, invoiceId);
  }

  @Delete('invoice-number/:invoiceNumber')
  @HttpCode(HttpStatus.OK)
  async removeByInvoiceNumber(
    @Query('userId') userId: string,
    @Param('invoiceNumber') invoiceNumber: string
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.invoicesService.removeByInvoiceNumber(userId, invoiceNumber);
  }
}
