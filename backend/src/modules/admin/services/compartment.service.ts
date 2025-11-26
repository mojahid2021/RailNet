/**
 * Compartment Service
 * 
 * Business logic for compartment operations
 */

import { prisma } from '../../../core/database/prisma.service'
import { NotFoundError } from '../../../shared/errors'
import { CreateCompartmentDto, UpdateCompartmentDto } from '../dtos'

export class CompartmentService {
  async create(data: CreateCompartmentDto) {
    const compartment = await prisma.compartment.create({
      data,
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        totalSeat: true,
        createdAt: true,
      },
    })

    return compartment
  }

  async findAll() {
    const compartments = await prisma.compartment.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return compartments
  }

  async findById(id: string) {
    const compartment = await prisma.compartment.findUnique({
      where: { id },
    })

    if (!compartment) {
      throw new NotFoundError('Compartment not found')
    }

    return compartment
  }

  async update(id: string, data: UpdateCompartmentDto) {
    try {
      const compartment = await prisma.compartment.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          totalSeat: true,
          updatedAt: true,
        },
      })

      return compartment
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new NotFoundError('Compartment not found')
      }
      throw error
    }
  }

  async delete(id: string) {
    try {
      await prisma.compartment.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new NotFoundError('Compartment not found')
      }
      throw error
    }
  }
}

export const compartmentService = new CompartmentService()
