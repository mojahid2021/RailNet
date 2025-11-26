/**
 * Booking Service
 * 
 * Business logic for ticket booking operations
 */

import { prisma, ConflictError, NotFoundError } from '../../../lib';
import { BookTicketDto } from '../dtos';

interface TrainCompartment {
  compartmentId: string;
  compartment: {
    totalSeat: number;
    price: number;
    name: string;
    type: string;
  };
}

interface RouteStation {
  currentStationId: string;
  distanceFromStart: number;
}

interface BookingResponse {
  id: string;
  scheduleId: string;
  compartmentId: string;
  seatNumber: string;
  fromStationId: string;
  toStationId: string;
  price: number;
  status: string;
  bookingDate: Date;
  createdAt: Date;
  train?: { name: string; number: string };
  route?: { name: string };
  compartment?: { name: string; type: string };
  fromStation?: { name: string };
  toStation?: { name: string };
}

export class BookingService {
  async bookTicket(userId: string, data: BookTicketDto): Promise<BookingResponse> {
    // Validate schedule exists and is active
    const schedule = await prisma.trainSchedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        train: {
          include: {
            compartments: {
              include: { compartment: true }
            }
          }
        },
        route: {
          include: {
            stations: {
              include: {
                currentStation: true
              },
              orderBy: {
                distanceFromStart: 'asc'
              }
            }
          }
        }
      }
    });

    if (!schedule) {
      throw new NotFoundError('Train schedule not found');
    }

    if (schedule.status === 'cancelled') {
      throw new ConflictError('This train schedule has been cancelled');
    }

    // Check if departure date is in the future
    const departureDateTime = new Date(`${schedule.departureDate.toISOString().split('T')[0]}T${schedule.departureTime}:00`);
    if (departureDateTime <= new Date()) {
      throw new ConflictError('Cannot book tickets for past or current schedules');
    }

    // Validate compartment exists on this train
    const trainCompartment = schedule.train.compartments.find(
      (tc: TrainCompartment) => tc.compartmentId === data.compartmentId
    );

    if (!trainCompartment) {
      throw new NotFoundError('Compartment not available on this train');
    }

    const compartment = trainCompartment.compartment;

    // Validate seat number
    const seatNum = parseInt(data.seatNumber);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > compartment.totalSeat) {
      throw new NotFoundError(`Invalid seat number. Valid seats are 1 to ${compartment.totalSeat}`);
    }

    // Validate from and to stations are on the route and in correct order
    const fromStationRoute = schedule.route.stations.find(
      (station: RouteStation) => station.currentStationId === data.fromStationId
    );
    const toStationRoute = schedule.route.stations.find(
      (station: RouteStation) => station.currentStationId === data.toStationId
    );

    if (!fromStationRoute || !toStationRoute) {
      throw new NotFoundError('Stations not found on this route');
    }

    if (fromStationRoute.distanceFromStart >= toStationRoute.distanceFromStart) {
      throw new ConflictError('From station must be before to station on the route');
    }

    // Check if seat is already booked for this schedule and compartment
    const existingBooking = await prisma.booking.findUnique({
      where: {
        scheduleId_compartmentId_seatNumber: {
          scheduleId: data.scheduleId,
          compartmentId: data.compartmentId,
          seatNumber: data.seatNumber,
        }
      }
    });

    if (existingBooking) {
      throw new ConflictError('Seat already booked');
    }

    // Calculate price based on distance traveled
    const totalDistance = schedule.route.totalDistance;
    const travelDistance = toStationRoute.distanceFromStart - fromStationRoute.distanceFromStart;
    const price = (compartment.price * travelDistance) / totalDistance;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        scheduleId: data.scheduleId,
        compartmentId: data.compartmentId,
        seatNumber: data.seatNumber,
        fromStationId: data.fromStationId,
        toStationId: data.toStationId,
        price: Math.round(price * 100) / 100, // Round to 2 decimal places
      },
      include: {
        schedule: {
          include: {
            train: { select: { name: true, number: true } },
            route: { select: { name: true } }
          }
        },
        compartment: { select: { name: true, type: true } },
        fromStation: { select: { name: true } },
        toStation: { select: { name: true } }
      }
    });

    return {
      id: booking.id,
      scheduleId: booking.scheduleId,
      compartmentId: booking.compartmentId,
      seatNumber: booking.seatNumber,
      fromStationId: booking.fromStationId,
      toStationId: booking.toStationId,
      price: booking.price,
      status: booking.status,
      bookingDate: booking.bookingDate,
      createdAt: booking.createdAt,
      train: booking.schedule.train,
      route: booking.schedule.route,
      compartment: booking.compartment,
      fromStation: booking.fromStation,
      toStation: booking.toStation,
    };
  }
}

export const bookingService = new BookingService();
