package com.mojahid2021.railnet.activity;

import android.os.Bundle;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.gson.Gson;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.adapter.SeatAdapter;
import com.mojahid2021.railnet.model.TrainSchedule;

import java.util.ArrayList;
import java.util.List;

/**
 * CompartmentActivity allows users to select a train compartment and seat.
 * Displays available compartments as chips and seats in a grid layout.
 */
public class CompartmentActivity extends AppCompatActivity {

    // Constants
    private static final int GRID_SPAN_COUNT = 4;
    private static final int DEFAULT_SEAT_COUNT = 24;

    // UI Components
    private ChipGroup chipGroupCompartments;
    private RecyclerView rvSeats;
    private View btnNext;

    // Data
    private TrainSchedule trainSchedule;
    private String fromStationId;
    private String toStationId;
    private String selectedSeat;
    private int selectedCompartmentId = -1;
    private SeatAdapter seatAdapter;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_compartment);

        initializeViews();
        extractIntentData();

        if (trainSchedule == null) {
            finish(); // Exit if no schedule data
            return;
        }

        setupSeatRecyclerView();
        setupCompartmentChips();
        setupNextButton();
    }

    /**
     * Initializes all view references
     */
    private void initializeViews() {
        chipGroupCompartments = findViewById(R.id.chipGroupCompartments);
        rvSeats = findViewById(R.id.rvSeats);
        btnNext = findViewById(R.id.btnNext);
    }

    /**
     * Extracts data from intent extras
     */
    private void extractIntentData() {
        String json = getIntent().getStringExtra("scheduleJson");
        fromStationId = getIntent().getStringExtra("fromStationId");
        toStationId = getIntent().getStringExtra("toStationId");

        if (json != null) {
            Gson gson = new Gson();
            trainSchedule = gson.fromJson(json, TrainSchedule.class);
        }
    }

    /**
     * Sets up the RecyclerView for displaying seats
     */
    private void setupSeatRecyclerView() {
        rvSeats.setLayoutManager(new GridLayoutManager(this, GRID_SPAN_COUNT));

        seatAdapter = new SeatAdapter(new ArrayList<>(), seat -> {
            handleSeatSelection(seat);
        });

        rvSeats.setAdapter(seatAdapter);
    }

    /**
     * Handles seat selection from the adapter
     */
    private void handleSeatSelection(String seat) {
        selectedSeat = seat;
        seatAdapter.setSelectedSeat(seat);
        btnNext.setVisibility(View.VISIBLE);
    }

    /**
     * Sets up compartment chips based on available compartments
     */
    private void setupCompartmentChips() {
        if (trainSchedule.train == null || trainSchedule.train.compartments == null) {
            return;
        }

        for (TrainSchedule.CompartmentAssignment compartmentAssignment : trainSchedule.train.compartments) {
            if (compartmentAssignment == null || compartmentAssignment.compartment == null) {
                continue;
            }

            Chip chip = createCompartmentChip(compartmentAssignment);
            chipGroupCompartments.addView(chip);
        }
    }

    /**
     * Creates a chip for a compartment
     */
    private Chip createCompartmentChip(TrainSchedule.CompartmentAssignment compartmentAssignment) {
        Chip chip = new Chip(this);
        String compartmentText = String.format(getString(R.string.compartment_label),
            compartmentAssignment.compartment.name, compartmentAssignment.compartment.clazz);
        chip.setText(compartmentText);
        chip.setCheckable(true);
        chip.setOnClickListener(v -> handleCompartmentSelection(compartmentAssignment));
        return chip;
    }

    /**
     * Handles compartment chip selection
     */
    private void handleCompartmentSelection(TrainSchedule.CompartmentAssignment compartmentAssignment) {
        List<String> seats = generateSeatList(compartmentAssignment.compartment.totalSeats);
        seatAdapter.setItems(seats);
        selectedCompartmentId = compartmentAssignment.compartment.id;

        // Reset seat selection
        selectedSeat = null;
        btnNext.setVisibility(View.GONE);
    }

    /**
     * Generates a list of seat numbers based on total seats
     */
    private List<String> generateSeatList(int totalSeats) {
        List<String> seats = new ArrayList<>();
        int seatCount = totalSeats > 0 ? totalSeats : DEFAULT_SEAT_COUNT;
        for (int i = 1; i <= seatCount; i++) {
            seats.add("S" + i);
        }
        return seats;
    }

    /**
     * Sets up the Next button click listener
     */
    private void setupNextButton() {
        btnNext.setOnClickListener(v -> navigateToBookingSummary());
    }

    /**
     * Navigates to BookingSummaryActivity with selected data
     */
    private void navigateToBookingSummary() {
        if (selectedSeat == null || selectedCompartmentId <= 0) {
            return; // Ensure both seat and compartment are selected
        }

        android.content.Intent intent = new android.content.Intent(this, BookingSummaryActivity.class);
        intent.putExtra("trainScheduleId", trainSchedule.id);
        if (fromStationId != null) {
            intent.putExtra("fromStationId", fromStationId);
        }
        if (toStationId != null) {
            intent.putExtra("toStationId", toStationId);
        }
        intent.putExtra("compartmentId", selectedCompartmentId);
        intent.putExtra("seatNumber", selectedSeat);
        startActivity(intent);
    }
}
