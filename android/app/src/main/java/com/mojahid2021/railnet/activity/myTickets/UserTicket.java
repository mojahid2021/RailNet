package com.mojahid2021.railnet.activity.myTickets;

/**
 * Model classes that match the API response for GET /tickets
 * This is a minimal representation to parse the needed fields.
 */
public class UserTicket {

    public Ticket ticket;
    public Journey journey;
    public Seat seat;
    public Pricing pricing;

    public static class Ticket {
        public int id;
        public String ticketId;
        public String status;
        public String paymentStatus;
        public String createdAt;
    }

    public static class Journey {
        public Train train;
        public Route route;
        public Schedule schedule;

        public static class Train { public String name; public String number; }
        public static class Route { public String from; public String to; }
        public static class Schedule { public String date; public String departureTime; }
    }

    public static class Seat { public String number; public String compartment; }

    public static class Pricing { public double amount; public String currency; }
}

