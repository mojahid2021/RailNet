package com.mojahid2021.railnet;

import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.gson.Gson;
import com.mojahid2021.railnet.home.SeatAdapter;
import com.mojahid2021.railnet.home.model.TrainSchedule;
import com.mojahid2021.railnet.util.DateTimeUtils;

import android.view.View;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class CompartmentActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_compartment);

        View btnBack = findViewById(R.id.btnBack);
        TextView headerTitle = findViewById(R.id.headerTitle);
        TextView headerSubtitle = findViewById(R.id.headerSubtitle);
        ChipGroup chipGroupCompartments = findViewById(R.id.chipGroupCompartments);
        RecyclerView rvSeats = findViewById(R.id.rvSeats);

        btnBack.setOnClickListener(v -> finish());

        rvSeats.setLayoutManager(new GridLayoutManager(this, 4));
        final View btnNext = findViewById(R.id.btnNext);
        final String[] selectedSeat = {null};
        final int[] selectedCompartmentId = {-1};

        final SeatAdapter[] adapterHolder = new SeatAdapter[1];
        adapterHolder[0] = new SeatAdapter(new ArrayList<>(), seat -> {
            // handle seat click: store selection and show Go Next button
            selectedSeat[0] = seat;
            adapterHolder[0].setSelectedSeat(seat);
            btnNext.setVisibility(View.VISIBLE);
        });
        SeatAdapter seatAdapter = adapterHolder[0];
        rvSeats.setAdapter(seatAdapter);

        String json = getIntent().getStringExtra("scheduleJson");
        // Also read from/to station ids passed from Home
        final String fromStationId = getIntent().getStringExtra("fromStationId");
        final String toStationId = getIntent().getStringExtra("toStationId");
        if (json == null) return;
        Gson gson = new Gson();
        TrainSchedule schedule = gson.fromJson(json, TrainSchedule.class);

        if (schedule != null) {
            // header title/subtitle
            String title = "-";
            if (schedule.train != null) {
                title = (schedule.train.name != null ? schedule.train.name : "") + (schedule.train.number != null ? " (" + schedule.train.number + ")" : "");
            }
            headerTitle.setText(title);
            headerSubtitle.setText(DateTimeUtils.formatDisplayDateFromIso(schedule.date));

            // Populate chip group with compartments
            if (schedule.train != null && schedule.train.compartments != null) {
                for (TrainSchedule.CompartmentAssignment ca : schedule.train.compartments) {
                    if (ca == null || ca.compartment == null) continue;
                    Chip chip = new Chip(this);
                    chip.setText(String.format(getString(R.string.compartment_label), ca.compartment.name, ca.compartment.clazz));
                    chip.setCheckable(true);
                    chip.setOnClickListener(v -> {
                        // build seat list
                        List<String> seats = new ArrayList<>();
                        int total = ca.compartment.totalSeats > 0 ? ca.compartment.totalSeats : 24;
                        for (int i = 1; i <= total; i++) seats.add("S" + i);
                        seatAdapter.setItems(seats);
                        selectedCompartmentId[0] = ca.compartment.id;
                        // reset selection
                        selectedSeat[0] = null;
                        btnNext.setVisibility(View.GONE);
                    });
                    chipGroupCompartments.addView(chip);
                }
            }

            // wire Go Next button to BookingSummaryActivity
            btnNext.setOnClickListener(v -> {
                if (selectedSeat[0] == null || selectedCompartmentId[0] <= 0) return;
                android.content.Intent intent = new android.content.Intent(CompartmentActivity.this, BookingSummaryActivity.class);
                intent.putExtra("trainScheduleId", schedule.id);
                if (fromStationId != null) intent.putExtra("fromStationId", fromStationId);
                if (toStationId != null) intent.putExtra("toStationId", toStationId);
                intent.putExtra("compartmentId", selectedCompartmentId[0]);
                intent.putExtra("seatNumber", selectedSeat[0]);
                startActivity(intent);
            });
        }
    }
}
