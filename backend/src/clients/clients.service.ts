import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto): Promise<ClientResponseDto> {
    try {
      const client = await this.prisma.clients.create({
        data: createClientDto,
      });
      return client;
    } catch (error) {
      if (error.code === 'P2002') {
        // Prisma unique constraint violation
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Client with this ${field} already exists for this user`);
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<ClientResponseDto[]> {
    return await this.prisma.clients.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, gstin: string): Promise<ClientResponseDto> {
    const client = await this.prisma.clients.findFirst({
      where: { userId, gstin },
    });

    if (!client) {
      throw new NotFoundException(`Client with GSTIN ${gstin} not found`);
    }

    return client;
  }

  async findById(userId: string, id: number): Promise<ClientResponseDto> {
    const client = await this.prisma.clients.findFirst({
      where: { userId, id },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(userId: string, gstin: string, updateClientDto: UpdateClientDto): Promise<ClientResponseDto> {
    try {
      // First verify the client belongs to this user
      const existing = await this.prisma.clients.findFirst({
        where: { userId, gstin },
      });

      if (!existing) {
        throw new NotFoundException(`Client with GSTIN ${gstin} not found`);
      }

      const client = await this.prisma.clients.update({
        where: { id: existing.id },
        data: updateClientDto,
      });
      return client;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client with GSTIN ${gstin} not found`);
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Client with this ${field} already exists`);
      }
      throw error;
    }
  }

  async updateById(userId: string, id: number, updateClientDto: UpdateClientDto): Promise<ClientResponseDto> {
    try {
      // First verify the client belongs to this user
      const existing = await this.prisma.clients.findFirst({
        where: { userId, id },
      });

      if (!existing) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      const client = await this.prisma.clients.update({
        where: { id },
        data: updateClientDto,
      });
      return client;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Client with this ${field} already exists`);
      }
      throw error;
    }
  }

  async remove(userId: string, gstin: string): Promise<{ message: string }> {
    try {
      // First verify the client belongs to this user
      const existing = await this.prisma.clients.findFirst({
        where: { userId, gstin },
      });

      if (!existing) {
        throw new NotFoundException(`Client with GSTIN ${gstin} not found`);
      }

      await this.prisma.clients.delete({
        where: { id: existing.id },
      });
      return { message: `Client with GSTIN ${gstin} successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client with GSTIN ${gstin} not found`);
      }
      throw error;
    }
  }

  async removeById(userId: string, id: number): Promise<{ message: string }> {
    try {
      // First verify the client belongs to this user
      const existing = await this.prisma.clients.findFirst({
        where: { userId, id },
      });

      if (!existing) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      await this.prisma.clients.delete({
        where: { id },
      });
      return { message: `Client with ID ${id} successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findByPhoneNumber(userId: string, phoneNumber: string): Promise<ClientResponseDto> {
    const client = await this.prisma.clients.findFirst({
      where: { userId, phoneNumber },
    });

    if (!client) {
      throw new NotFoundException(`Client with phone number ${phoneNumber} not found`);
    }

    return client;
  }

  async findByGstType(userId: string, gstType: string): Promise<ClientResponseDto[]> {
    // Handle mapping for backward compatibility
    let searchTypes: string[] = [gstType];
    
    if (gstType.toLowerCase() === 'customer') {
      searchTypes = ['customer', 'Customer', 'composition', 'Composition'];
    } else if (gstType.toLowerCase() === 'supplier') {
      searchTypes = ['supplier', 'Supplier', 'regular', 'Regular'];
    }

    return await this.prisma.clients.findMany({
      where: { 
        userId,
        clientType: {
          in: searchTypes
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
