/**
 * Route service for RailNet Backend
 * Handles route management operations
 */

import { getPrismaClient } from '../../core/database';
import { appLogger } from '../../core/logger';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { Route, CreateRouteData, UpdateRouteData, RouteFilters } from '../../types/common';

export class RouteService {
  private prisma = getPrismaClient();

  /**
   * Create multiple routes with their stops
   */
  async createRoutes(routesData: CreateRouteData[]): Promise<Route[]> {
    const endTimer = appLogger.startTimer('create-routes');

    try {
      const createdRoutes: Route[] = [];

      for (const routeData of routesData) {
        await this.validateRouteData(routeData);

        // Create route and stops in transaction
        const route = await this.prisma.$transaction(async (tx) => {
          // Generate unique route code
          const routeCode = await this.generateRouteCode(routeData, tx);

          // Create route
          const newRoute = await tx.route.create({
            data: {
              name: routeData.name,
              code: routeCode,
              distance: routeData.distance,
              duration: routeData.duration,
              isActive: true,
            },
          });

          // Create route stops with proper ordering
          const sortedStops = routeData.stops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

          for (let i = 0; i < sortedStops.length; i++) {
            const stop = sortedStops[i];
            const prevStop = i > 0 ? sortedStops[i - 1] : null;

            await tx.routeStop.create({
              data: {
                routeId: newRoute.id,
                stationId: stop.stationId,
                stopOrder: i + 1,
                arrivalTime: stop.arrivalTime,
                departureTime: stop.departureTime,
                distance: prevStop ? stop.distanceFromStart - prevStop.distanceFromStart : 0,
                distanceFromStart: stop.distanceFromStart,
                platform: stop.platform,
                isActive: true,
              },
            });
          }

          // Return complete route with relations
          return await tx.route.findUnique({
            where: { id: newRoute.id },
            include: {
              stops: {
                orderBy: { stopOrder: 'asc' },
                include: {
                  station: true,
                },
              },
              trains: {
                select: { id: true },
              },
            },
          });
        });

        if (route) {
          const routeWithStations = {
            ...route,
            stations: route.stops.map(stop => stop.station),
            trainCount: route.trains.length,
            averageSpeed: route.distance / (route.duration / 60), // km/h
            stopCount: route.stops.length,
          };
          createdRoutes.push(routeWithStations);
        }
      }

      endTimer();
      appLogger.info('Routes created successfully', {
        routeCount: createdRoutes.length,
      });

      return createdRoutes;

    } catch (error) {
      endTimer();
      appLogger.error('Route creation failed', { error });
      throw error;
    }
  }

  /**
   * Validate route data before creation
   */
  private async validateRouteData(routeData: CreateRouteData): Promise<void> {
    // Validate all stations exist
    const stationIds = routeData.stops.map(stop => stop.stationId);
    const stations = await this.prisma.station.findMany({
      where: { id: { in: stationIds } },
    });

    if (stations.length !== stationIds.length) {
      const foundIds = stations.map(s => s.id);
      const missingIds = stationIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Stations not found: ${missingIds.join(', ')}`);
    }

    // Validate stop ordering
    const distances = routeData.stops.map(stop => stop.distanceFromStart);
    const sortedDistances = [...distances].sort((a, b) => a - b);
    if (JSON.stringify(distances) !== JSON.stringify(sortedDistances)) {
      throw new ValidationError('Route stops must be ordered by distance from start');
    }

    // Validate minimum stops
    if (routeData.stops.length < 2) {
      throw new ValidationError('Route must have at least 2 stops');
    }

    // Validate realistic travel times and distances
    await this.validateTravelTimes(routeData);

    // Validate distance consistency
    this.validateDistances(routeData);
  }

  /**
   * Generate unique route code
   */
  private async generateRouteCode(routeData: CreateRouteData, tx: any): Promise<string> {
    // Get first and last station codes
    const stationIds = routeData.stops.map(stop => stop.stationId);
    const stations = await tx.station.findMany({
      where: { id: { in: stationIds } },
      select: { id: true, code: true },
    });

    const stationMap = new Map(stations.map((s: { id: string; code: string }) => [s.id, s.code]));
    const firstStation = stationMap.get(routeData.stops[0].stationId);
    const lastStation = stationMap.get(routeData.stops[routeData.stops.length - 1].stationId);

    if (!firstStation || !lastStation) {
      throw new ValidationError('Unable to generate route code: station codes not found');
    }

    // Create base code (e.g., "DEL-MUM")
    const baseCode = `${firstStation}-${lastStation}`;

    // Ensure uniqueness
    let routeCode = baseCode;
    let counter = 1;

    while (await tx.route.findUnique({ where: { code: routeCode } })) {
      routeCode = `${baseCode}-${counter}`;
      counter++;
    }

    return routeCode;
  }

  /**
   * Validate realistic travel times between stops
   */
  private async validateTravelTimes(routeData: CreateRouteData): Promise<void> {
    const stops = routeData.stops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    for (let i = 1; i < stops.length; i++) {
      const currentStop = stops[i];
      const previousStop = stops[i - 1];

      // Check if both stops have timing information
      if (currentStop.arrivalTime && previousStop.departureTime) {
        const arrivalMinutes = this.timeToMinutes(currentStop.arrivalTime);
        const departureMinutes = this.timeToMinutes(previousStop.departureTime);

        // Calculate travel time in minutes
        const travelTime = arrivalMinutes - departureMinutes;

        // Handle overnight travel (next day arrival)
        const adjustedTravelTime = travelTime < 0 ? travelTime + 1440 : travelTime;

        // Calculate distance
        const distance = currentStop.distanceFromStart - previousStop.distanceFromStart;

        // Minimum speed: 10 km/h, Maximum speed: 200 km/h
        const minTime = (distance / 200) * 60; // Fastest reasonable time
        const maxTime = (distance / 10) * 60;  // Slowest reasonable time

        if (adjustedTravelTime < minTime || adjustedTravelTime > maxTime) {
          throw new ValidationError(
            `Unrealistic travel time between stops ${i} and ${i + 1}: ` +
            `${adjustedTravelTime} minutes for ${distance} km. ` +
            `Expected: ${Math.round(minTime)}-${Math.round(maxTime)} minutes`
          );
        }
      }
    }
  }

  /**
   * Validate distance consistency
   */
  private validateDistances(routeData: CreateRouteData): void {
    const stops = routeData.stops.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    // Check that total distance matches route distance
    const calculatedTotalDistance = stops[stops.length - 1].distanceFromStart;
    const tolerance = 1.0; // 1km tolerance

    if (Math.abs(calculatedTotalDistance - routeData.distance) > tolerance) {
      throw new ValidationError(
        `Route distance mismatch: specified ${routeData.distance} km, ` +
        `calculated from stops: ${calculatedTotalDistance} km`
      );
    }

    // Check for negative distances
    for (const stop of stops) {
      if (stop.distanceFromStart < 0) {
        throw new ValidationError('Distance from start cannot be negative');
      }
    }
  }

  /**
   * Convert HH:MM time string to minutes since midnight
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get route by ID with stops and stations
   */
  async getRouteById(routeId: string): Promise<Route> {
    const endTimer = appLogger.startTimer('get-route-by-id');

    try {
      const route = await this.prisma.route.findUnique({
        where: { id: routeId },
        include: {
          stops: {
            orderBy: { stopOrder: 'asc' },
            include: {
              station: true,
            },
          },
          trains: {
            select: { id: true },
          },
        },
      });

      if (!route) {
        throw new NotFoundError(`Route with ID ${routeId} not found`);
      }

      endTimer();
      return {
        ...route,
        stations: route.stops.map(stop => stop.station),
        trainCount: route.trains.length,
        averageSpeed: route.distance / (route.duration / 60),
        stopCount: route.stops.length,
      };

    } catch (error) {
      endTimer();
      appLogger.error('Get route by ID failed', { error, routeId });
      throw error;
    }
  }

  /**
   * Get all routes with advanced filtering
   */
  async getAllRoutes(filters?: RouteFilters): Promise<Route[]> {
    const endTimer = appLogger.startTimer('get-all-routes');

    try {
      const where: any = {};

      // Basic filters
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.stationId) {
        where.stops = {
          some: {
            stationId: filters.stationId,
          },
        };
      }

      // Distance filters
      if (filters?.minDistance !== undefined || filters?.maxDistance !== undefined) {
        where.distance = {};
        if (filters.minDistance !== undefined) {
          where.distance.gte = filters.minDistance;
        }
        if (filters.maxDistance !== undefined) {
          where.distance.lte = filters.maxDistance;
        }
      }

      // Duration filters
      if (filters?.minDuration !== undefined || filters?.maxDuration !== undefined) {
        where.duration = {};
        if (filters.minDuration !== undefined) {
          where.duration.gte = filters.minDuration;
        }
        if (filters.maxDuration !== undefined) {
          where.duration.lte = filters.maxDuration;
        }
      }

      // Sorting
      const sortBy = filters?.sortBy || 'createdAt';
      const sortOrder = filters?.sortOrder || 'desc';
      const orderBy: Record<string, 'asc' | 'desc'> = {};
      orderBy[sortBy] = sortOrder;

      const routes = await this.prisma.route.findMany({
        where,
        include: {
          stops: {
            orderBy: { stopOrder: 'asc' },
            include: {
              station: true,
            },
          },
          trains: {
            select: { id: true },
          },
        },
        orderBy,
      });

      endTimer();
      return routes.map(route => ({
        ...route,
        stations: route.stops.map(stop => stop.station),
        trainCount: route.trains.length,
        averageSpeed: route.distance / (route.duration / 60),
        stopCount: route.stops.length,
      }));

    } catch (error) {
      endTimer();
      appLogger.error('Get all routes failed', { error });
      throw error;
    }
  }

  /**
   * Update route information
   */
  async updateRoute(routeId: string, updateData: UpdateRouteData): Promise<Route> {
    const endTimer = appLogger.startTimer('update-route');

    try {
      const route = await this.prisma.route.update({
        where: { id: routeId },
        data: updateData,
        include: {
          stops: {
            orderBy: { stopOrder: 'asc' },
            include: {
              station: true,
            },
          },
          trains: {
            select: { id: true },
          },
        },
      });

      endTimer();
      appLogger.info('Route updated successfully', { routeId });

      return {
        ...route,
        stations: route.stops.map(stop => stop.station),
        trainCount: route.trains.length,
        averageSpeed: route.distance / (route.duration / 60),
        stopCount: route.stops.length,
      };

    } catch (error) {
      endTimer();
      appLogger.error('Update route failed', { error, routeId });
      throw error;
    }
  }

  /**
   * Delete route (soft delete by setting isActive to false)
   */
  async deleteRoute(routeId: string): Promise<void> {
    const endTimer = appLogger.startTimer('delete-route');

    try {
      await this.prisma.route.update({
        where: { id: routeId },
        data: { isActive: false },
      });

      endTimer();
      appLogger.info('Route deleted successfully', { routeId });

    } catch (error) {
      endTimer();
      appLogger.error('Delete route failed', { error, routeId });
      throw error;
    }
  }

  /**
   * Get routes by station ID
   */
  async getRoutesByStation(stationId: string): Promise<Route[]> {
    const endTimer = appLogger.startTimer('get-routes-by-station');

    try {
      const routes = await this.prisma.route.findMany({
        where: {
          isActive: true,
          stops: {
            some: {
              stationId: stationId,
            },
          },
        },
        include: {
          stops: {
            orderBy: { stopOrder: 'asc' },
            include: {
              station: true,
            },
          },
          trains: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      endTimer();
      return routes.map(route => ({
        ...route,
        stations: route.stops.map(stop => stop.station),
        trainCount: route.trains.length,
        averageSpeed: route.distance / (route.duration / 60),
        stopCount: route.stops.length,
      }));

    } catch (error) {
      endTimer();
      appLogger.error('Get routes by station failed', { error, stationId });
      throw error;
    }
  }
}