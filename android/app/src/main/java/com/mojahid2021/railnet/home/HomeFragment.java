package com.mojahid2021.railnet.home;

import static android.content.ContentValues.TAG;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.fragment.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.activity.TrainsActivity;
import com.mojahid2021.railnet.home.model.Station;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * HomeFragment handles the main screen for selecting travel details: from/to stations, date, and searching trains.
 * It follows OOP by encapsulating UI elements, data, and behaviors within the class.
 */
public class HomeFragment extends Fragment {

    // Constants for SharedPreferences keys
    private static final String PREFS_NAME = "UserPreferences";
    private static final String KEY_FROM_ID = "selected_from_id";
    private static final String KEY_TO_ID = "selected_to_id";
    private static final String KEY_FROM_NAME = "selected_from_name";
    private static final String KEY_TO_NAME = "selected_to_name";

    // UI elements (encapsulated as private fields)
    private LinearLayout fromLocationLayout;
    private LinearLayout toLocationLayout;
    private AutoCompleteTextView actvFrom;
    private AutoCompleteTextView actvTo;
    private LinearLayout dateSelectLayout;
    private TextView tvSelectedDate;
    private Button btnSearchTrains;

    // Data models (encapsulated)
    private List<Station> stations = new ArrayList<>();
    private final Map<String, Station> stationByName = new HashMap<>();
    private final Map<Integer, Station> stationById = new HashMap<>();
    private Station selectedFrom;
    private Station selectedTo;
    private Calendar selectedDate;

    // Date formatters (utility objects)
    private final SimpleDateFormat displayDateFormat = new SimpleDateFormat("EEE, MMM d, yyyy", Locale.getDefault());
    private final SimpleDateFormat apiDateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        // Initialize UI elements
        initializeViews(view);

        // Set up event listeners
        setupEventListeners();

        // Initialize date to today
        initializeDate();

        // Fetch stations from API
        fetchStations();

        // Set up search button
        setupSearchButton();

        return view;
    }

    /**
     * Initializes all UI views from the layout.
     */
    private void initializeViews(View view) {
        fromLocationLayout = view.findViewById(R.id.fromLocationLayout);
        toLocationLayout = view.findViewById(R.id.toLocationLayout);
        actvFrom = view.findViewById(R.id.actv_from);
        actvTo = view.findViewById(R.id.actv_to);
        dateSelectLayout = view.findViewById(R.id.dateSelectLayout);
        tvSelectedDate = view.findViewById(R.id.tvSelectedDate);
        btnSearchTrains = view.findViewById(R.id.btnSearchTrains);
    }

    /**
     * Sets up click listeners for UI interactions.
     */
    private void setupEventListeners() {
        // Click listeners for dropdowns
        fromLocationLayout.setOnClickListener(v -> showDropdown(actvFrom));
        toLocationLayout.setOnClickListener(v -> showDropdown(actvTo));

        // Item selection listeners
        actvFrom.setOnItemClickListener((parent, view, position, id) -> onStationSelected(parent, position, true));
        actvTo.setOnItemClickListener((parent, view, position, id) -> onStationSelected(parent, position, false));

        // Date picker listeners
        View.OnClickListener dateClickListener = v -> showDatePicker();
        dateSelectLayout.setOnClickListener(dateClickListener);
        tvSelectedDate.setOnClickListener(dateClickListener);
    }

    /**
     * Initializes the selected date to today and updates the UI.
     */
    private void initializeDate() {
        selectedDate = Calendar.getInstance();
        updateDateDisplay();
    }

    /**
     * Updates the date display text.
     */
    private void updateDateDisplay() {
        tvSelectedDate.setText(displayDateFormat.format(selectedDate.getTime()));
    }

    /**
     * Shows the dropdown for the given AutoCompleteTextView.
     */
    private void showDropdown(AutoCompleteTextView autoCompleteTextView) {
        autoCompleteTextView.requestFocus();
        autoCompleteTextView.showDropDown();
    }

    /**
     * Handles station selection from dropdown.
     */
    private void onStationSelected(android.widget.AdapterView<?> parent, int position, boolean isFrom) {
        String name = (String) parent.getItemAtPosition(position);
        Station station = stationByName.get(name);
        if (isFrom) {
            selectedFrom = station;
            saveStationToPreferences(KEY_FROM_ID, KEY_FROM_NAME, station);
        } else {
            selectedTo = station;
            saveStationToPreferences(KEY_TO_ID, KEY_TO_NAME, station);
        }
        Log.d(TAG, (isFrom ? "From" : "To") + " selected: " + (station != null ? station.name : "null"));
    }

    /**
     * Saves station details to SharedPreferences.
     */
    private void saveStationToPreferences(String idKey, String nameKey, Station station) {
        if (station != null) {
            SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            sp.edit().putInt(idKey, station.id).putString(nameKey, station.name).apply();
        }
    }

    /**
     * Shows the date picker dialog.
     */
    private void showDatePicker() {
        int year = selectedDate.get(Calendar.YEAR);
        int month = selectedDate.get(Calendar.MONTH);
        int day = selectedDate.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(requireContext(), (view, y, m, dayOfMonth) -> {
            selectedDate.set(y, m, dayOfMonth, 0, 0, 0);
            selectedDate.set(Calendar.MILLISECOND, 0);
            updateDateDisplay();
            Log.d(TAG, "Date selected: " + selectedDate.getTime());
        }, year, month, day);

        datePickerDialog.getDatePicker().setMinDate(Calendar.getInstance().getTimeInMillis());
        datePickerDialog.show();
    }

    /**
     * Sets up the search button click listener.
     */
    private void setupSearchButton() {
        btnSearchTrains.setOnClickListener(v -> performSearch());
    }

    /**
     * Performs the search operation with validation.
     */
    private void performSearch() {
        // Try to load from preferences if not selected
        loadStationsFromPreferences();

        // Validate selections
        if (!areStationsValid()) {
            showAlert("Missing selection", "Please select both From and To stations before searching.");
            return;
        }

        if (selectedFrom.id == selectedTo.id) {
            showAlert("Invalid selection", "From and To stations must be different.");
            return;
        }

        // Prepare data and start activity
        String fromId = String.valueOf(selectedFrom.id);
        String toId = String.valueOf(selectedTo.id);
        String date = apiDateFormat.format(selectedDate.getTime());

        Intent intent = new Intent(requireContext(), TrainsActivity.class);
        intent.putExtra("fromStationId", fromId);
        intent.putExtra("toStationId", toId);
        intent.putExtra("date", date);
        intent.putExtra("fromStationName", selectedFrom.name);
        intent.putExtra("toStationName", selectedTo.name);
        startActivity(intent);
    }

    /**
     * Loads stations from SharedPreferences if not already selected.
     */
    private void loadStationsFromPreferences() {
        SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (selectedFrom == null) {
            int savedFromId = sp.getInt(KEY_FROM_ID, -1);
            selectedFrom = stationById.get(savedFromId);
        }
        if (selectedTo == null) {
            int savedToId = sp.getInt(KEY_TO_ID, -1);
            selectedTo = stationById.get(savedToId);
        }
    }

    /**
     * Checks if both stations are selected.
     */
    private boolean areStationsValid() {
        return selectedFrom != null && selectedTo != null;
    }

    /**
     * Shows an alert dialog with the given title and message.
     */
    private void showAlert(String title, String message) {
        new AlertDialog.Builder(requireContext())
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }

    /**
     * Fetches stations from the API and sets up the dropdowns.
     */
    private void fetchStations() {
        ApiService apiService = ApiClient.getRetrofit(requireActivity()).create(ApiService.class);
        Call<List<Station>> call = apiService.getStations();
        call.enqueue(new Callback<List<Station>>() {
            @Override
            public void onResponse(Call<List<Station>> call, Response<List<Station>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    processStations(response.body());
                } else {
                    Log.d(TAG, "Request failed, code: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<List<Station>> call, Throwable t) {
                Log.e(TAG, "onFailure: " + t.getMessage(), t);
            }
        });
    }

    /**
     * Processes the fetched stations and sets up UI.
     */
    private void processStations(List<Station> fetchedStations) {
        stations = fetchedStations;
        stationByName.clear();
        stationById.clear();
        List<String> names = new ArrayList<>(stations.size());
        for (Station station : stations) {
            stationByName.put(station.name, station);
            stationById.put(station.id, station);
            names.add(station.name);
        }

        // Update UI on main thread
        if (getActivity() != null) {
            ArrayAdapter<String> adapter = new ArrayAdapter<>(requireContext(),
                    android.R.layout.simple_dropdown_item_1line, names);
            actvFrom.setAdapter(adapter);
            actvTo.setAdapter(adapter);

            // Restore selections
            restoreSelectionsFromPreferences();
        }

        Log.d(TAG, "Stations loaded: " + stations.size());
    }

    /**
     * Restores previously selected stations from SharedPreferences.
     */
    private void restoreSelectionsFromPreferences() {
        SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int savedFromId = sp.getInt(KEY_FROM_ID, -1);
        if (savedFromId != -1) {
            Station station = stationById.get(savedFromId);
            if (station != null) {
                selectedFrom = station;
                actvFrom.setText(station.name, false);
            }
        }

        int savedToId = sp.getInt(KEY_TO_ID, -1);
        if (savedToId != -1) {
            Station station = stationById.get(savedToId);
            if (station != null) {
                selectedTo = station;
                actvTo.setText(station.name, false);
            }
        }
    }
}
