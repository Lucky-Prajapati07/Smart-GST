import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto) {
    // Check if GSTIN already exists
    const existing = await this.prisma.business.findUnique({
      where: { gstin: createBusinessDto.gstin },
    });

    if (existing) {
      throw new ConflictException('Business with this GSTIN already exists');
    }

    return this.prisma.business.create({
      data: createBusinessDto,
    });
  }

  async findAll() {
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async findByGstin(gstin: string) {
    const business = await this.prisma.business.findUnique({
      where: { gstin },
    });

    if (!business) {
      throw new NotFoundException(`Business with GSTIN ${gstin} not found`);
    }

    return business;
  }

  async findByUserId(userId: string) {
    return this.prisma.business.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto) {
    await this.findOne(id); // Check if exists

    // If updating GSTIN, check uniqueness
    if (updateBusinessDto.gstin) {
      const existing = await this.prisma.business.findUnique({
        where: { gstin: updateBusinessDto.gstin },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Business with this GSTIN already exists');
      }
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return this.prisma.business.delete({
      where: { id },
    });
  }
}
