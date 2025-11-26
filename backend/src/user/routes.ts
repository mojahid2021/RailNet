import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { registerUserSchema, RegisterUserInput, loginUserSchema, LoginUserInput, bookTicketSchema, BookTicketInput } from '../schemas/user'
import { JWTUtil } from '../shared/utils/jwt.util'
import { ResponseHandler } from '../shared/utils/response.handler'
import { ConflictError, NotFoundError } from '../shared/errors'
import { authenticateUser } from '../shared/middleware/auth.middleware'

export async function userRoutes(app: FastifyInstance) {
  // User Registration
  app.post('/register', {
    schema: {
      description: 'Register a new user account',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          phone: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userData: RegisterUserInput = registerUserSchema.parse(request.body)

      // Check if user already exists
      const existingUser = await (app as any).prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        throw new ConflictError('User with this email already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      const user = await (app as any).prisma.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      })

      return ResponseHandler.created(reply, user, 'User registered successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.error(reply, error.message, 409)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // User Login
  app.post('/login', {
    schema: {
      description: 'Login with user credentials',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                  },
                },
                token: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const loginData: LoginUserInput = loginUserSchema.parse(request.body)

      // Find user
      const user = await (app as any).prisma.user.findUnique({
        where: { email: loginData.email },
      })

      if (!user) {
        throw new NotFoundError('Invalid email or password')
      }

      // Check password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password)
      if (!isValidPassword) {
        throw new NotFoundError('Invalid email or password')
      }

      // Generate token
      const token = JWTUtil.generateToken({
        id: user.id,
        email: user.email,
        type: 'user',
      })

      const userResponse = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      }

      return ResponseHandler.success(reply, { user: userResponse, token }, 'Login successful')
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 401)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Book Ticket
  app.post('/book-ticket', {
    preHandler: authenticateUser,
    schema: {
      description: 'Book a train ticket',
      tags: ['booking'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['scheduleId', 'compartmentId', 'seatNumber', 'fromStationId', 'toStationId'],
        properties: {
          scheduleId: { type: 'string', format: 'uuid' },
          compartmentId: { type: 'string', format: 'uuid' },
          seatNumber: { type: 'string' },
          fromStationId: { type: 'string', format: 'uuid' },
          toStationId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                scheduleId: { type: 'string' },
                compartmentId: { type: 'string' },
                seatNumber: { type: 'string' },
                fromStationId: { type: 'string' },
                toStationId: { type: 'string' },
                price: { type: 'number' },
                status: { type: 'string' },
                bookingDate: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const bookingData: BookTicketInput = bookTicketSchema.parse(request.body)
      const userId = (request as any).user.id

      // Validate schedule exists and is active
      const schedule = await (app as any).prisma.trainSchedule.findUnique({
        where: { id: bookingData.scheduleId },
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
      })

      if (!schedule) {
        throw new NotFoundError('Train schedule not found')
      }

      if (schedule.status === 'cancelled') {
        throw new ConflictError('This train schedule has been cancelled')
      }

      // Check if departure date is in the future
      const departureDateTime = new Date(`${schedule.departureDate.toISOString().split('T')[0]}T${schedule.departureTime}:00`)
      if (departureDateTime <= new Date()) {
        throw new ConflictError('Cannot book tickets for past or current schedules')
      }

      // Validate compartment exists on this train
      const trainCompartment = schedule.train.compartments.find(
        (tc: any) => tc.compartmentId === bookingData.compartmentId
      )

      if (!trainCompartment) {
        throw new NotFoundError('Compartment not available on this train')
      }

      const compartment = trainCompartment.compartment

      // Validate seat number
      const seatNum = parseInt(bookingData.seatNumber)
      if (isNaN(seatNum) || seatNum < 1 || seatNum > compartment.totalSeat) {
        throw new NotFoundError(`Invalid seat number. Valid seats are 1 to ${compartment.totalSeat}`)
      }

      // Validate from and to stations are on the route and in correct order
      const fromStationRoute = schedule.route.stations.find(
        (station: any) => station.currentStationId === bookingData.fromStationId
      )
      const toStationRoute = schedule.route.stations.find(
        (station: any) => station.currentStationId === bookingData.toStationId
      )

      if (!fromStationRoute || !toStationRoute) {
        throw new NotFoundError('Stations not found on this route')
      }

      if (fromStationRoute.distanceFromStart >= toStationRoute.distanceFromStart) {
        throw new ConflictError('From station must be before to station on the route')
      }

      // Check if seat is already booked for this schedule and compartment
      const existingBooking = await (app as any).prisma.booking.findUnique({
        where: {
          scheduleId_compartmentId_seatNumber: {
            scheduleId: bookingData.scheduleId,
            compartmentId: bookingData.compartmentId,
            seatNumber: bookingData.seatNumber,
          }
        }
      })

      if (existingBooking) {
        throw new ConflictError('Seat already booked')
      }

      // Calculate price based on distance traveled
      const totalDistance = schedule.route.totalDistance
      const travelDistance = toStationRoute.distanceFromStart - fromStationRoute.distanceFromStart
      const price = (compartment.price * travelDistance) / totalDistance

      // Create booking
      const booking = await (app as any).prisma.booking.create({
        data: {
          userId,
          scheduleId: bookingData.scheduleId,
          compartmentId: bookingData.compartmentId,
          seatNumber: bookingData.seatNumber,
          fromStationId: bookingData.fromStationId,
          toStationId: bookingData.toStationId,
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
      })

      const bookingResponse = {
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
        // Include related data for better response
        train: booking.schedule.train,
        route: booking.schedule.route,
        compartment: booking.compartment,
        fromStation: booking.fromStation,
        toStation: booking.toStation,
      }

      return ResponseHandler.created(reply, bookingResponse, 'Ticket booked successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.error(reply, error.message, 409)
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}