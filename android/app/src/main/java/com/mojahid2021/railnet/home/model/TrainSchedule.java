package com.mojahid2021.railnet.home.model;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class TrainSchedule {
    public int id;
    public int trainId;
    public int trainRouteId;
    public Train train;
    public TrainRoute trainRoute;
    public String date; // ISO date-time string
    public String time;
    public List<StationTime> stationTimes;
    public String createdAt;
    public String updatedAt;

    public static class Train {
        public int id;
        public String name;
        public String number;
        public int trainRouteId;
        public TrainRoute trainRoute;
        public List<CompartmentAssignment> compartments;
    }

    public static class TrainRoute {
        public int id;
        public String name;
        public int startStationId;
        public int endStationId;
        public SimpleStation startStation;
        public SimpleStation endStation;
        public List<RouteStation> routeStations;
        public String createdAt;
        public String updatedAt;
    }

    public static class RouteStation {
        public int id;
        public int previousStationId;
        public int currentStationId;
        public int nextStationId;
        public double distance;
        public double distanceFromStart;
    }

    public static class CompartmentAssignment {
        public int id;
        public int trainId;
        public int compartmentId;
        public int quantity;
        public Compartment compartment;
        public String createdAt;
        public String updatedAt;
    }

    public static class Compartment {
        public int id;
        public String name;
        @SerializedName("class")
        public String clazz; // 'class' is reserved, map to clazz
        public String type;
        public double price;
        public int totalSeats;
    }

    public static class StationTime {
        public int id;
        public int trainScheduleId;
        public int stationId;
        public SimpleStation station;
        public String arrivalTime; // string time
        public String departureTime;
        public int sequence;
    }

    public static class SimpleStation {
        public int id;
        public String name;
        public String city;
        public double latitude;
        public double longitude;
    }
}
