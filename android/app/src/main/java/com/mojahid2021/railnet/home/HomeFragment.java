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
import com.mojahid2021.railnet.TrainsActivity;
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

public class HomeFragment extends Fragment {

    private static final String PREFS_NAME = "UserPreferences";
    private static final String KEY_FROM_ID = "selected_from_id";
    private static final String KEY_TO_ID = "selected_to_id";
    private static final String KEY_FROM_NAME = "selected_from_name";
    private static final String KEY_TO_NAME = "selected_to_name";

    private LinearLayout fromLocationLayout;
    private LinearLayout toLocationLayout;
    private AutoCompleteTextView actvFrom;
    private AutoCompleteTextView actvTo;

    // Date picker views
    private LinearLayout dateSelectLayout;
    private TextView tvSelectedDate;
    private Calendar selectedDate;

    private Button btnSearchTrains;

    private List<Station> stations = new ArrayList<>();
    private final Map<String, Station> stationByName = new HashMap<>();
    private final Map<Integer, Station> stationById = new HashMap<>();

    private Station selectedFrom;
    private Station selectedTo;

    private final SimpleDateFormat displayDateFormat = new SimpleDateFormat("EEE, MMM d, yyyy", Locale.getDefault());
    private final SimpleDateFormat apiDateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        // find views
        fromLocationLayout = view.findViewById(R.id.fromLocationLayout);
        toLocationLayout = view.findViewById(R.id.toLocationLayout);
        actvFrom = view.findViewById(R.id.actv_from);
        actvTo = view.findViewById(R.id.actv_to);
        btnSearchTrains = view.findViewById(R.id.btnSearchTrains);

        // date views
        dateSelectLayout = view.findViewById(R.id.dateSelectLayout);
        tvSelectedDate = view.findViewById(R.id.tvSelectedDate);

        setupClickListeners();

        // initialize selected date to today
        selectedDate = Calendar.getInstance();
        tvSelectedDate.setText(displayDateFormat.format(selectedDate.getTime()));

        fetchStations();
        setupSearchButton();
        return view;
    }

    private void setupSearchButton() {
        btnSearchTrains.setOnClickListener(v -> {
            if (selectedFrom == null || selectedTo == null) {
                // Try to read from SharedPreferences as fallback
                SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                int savedFromId = sp.getInt(KEY_FROM_ID, -1);
                int savedToId = sp.getInt(KEY_TO_ID, -1);
                if (savedFromId != -1 && selectedFrom == null) selectedFrom = stationById.get(savedFromId);
                if (savedToId != -1 && selectedTo == null) selectedTo = stationById.get(savedToId);
            }

            if (selectedFrom == null || selectedTo == null) {
                new AlertDialog.Builder(requireContext())
                        .setTitle("Missing selection")
                        .setMessage("Please select both From and To stations before searching.")
                        .setPositiveButton("OK", null)
                        .show();
                return;
            }

            // Prevent selecting the same station for from & to
            if (selectedFrom.id == selectedTo.id) {
                new AlertDialog.Builder(requireContext())
                        .setTitle("Invalid selection")
                        .setMessage("From and To stations must be different.")
                        .setPositiveButton("OK", null)
                        .show();
                return;
            }

            String fromId = String.valueOf(selectedFrom.id);
            String toId = String.valueOf(selectedTo.id);
            String date = apiDateFormat.format(selectedDate.getTime());

            // Start TrainsActivity with extras
            Intent intent = new Intent(requireContext(), TrainsActivity.class);
            intent.putExtra("fromStationId", fromId);
            intent.putExtra("toStationId", toId);
            intent.putExtra("date", date);
            // also pass human-readable names for UI
            intent.putExtra("fromStationName", selectedFrom != null ? selectedFrom.name : "");
            intent.putExtra("toStationName", selectedTo != null ? selectedTo.name : "");
            startActivity(intent);
        });
    }

    // Wire dropdowns and date picker
    private void setupClickListeners() {
        // When the whole row is tapped, show dropdown
        fromLocationLayout.setOnClickListener(v -> {
            actvFrom.requestFocus();
            actvFrom.showDropDown();
        });

        toLocationLayout.setOnClickListener(v -> {
            actvTo.requestFocus();
            actvTo.showDropDown();
        });

        // Item click listeners on the AutoCompleteTextViews
        actvFrom.setOnItemClickListener((parent, view, position, id) -> {
            String name = (String) parent.getItemAtPosition(position);
            Station s = stationByName.get(name);
            selectedFrom = s;
            Log.d(TAG, "From selected: " + (s != null ? s.name : "null"));

            if (s != null) {
                SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                sp.edit().putInt(KEY_FROM_ID, s.id).putString(KEY_FROM_NAME, s.name).apply();
            }
        });

        actvTo.setOnItemClickListener((parent, view, position, id) -> {
            String name = (String) parent.getItemAtPosition(position);
            Station s = stationByName.get(name);
            selectedTo = s;
            Log.d(TAG, "To selected: " + (s != null ? s.name : "null"));

            if (s != null) {
                SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                sp.edit().putInt(KEY_TO_ID, s.id).putString(KEY_TO_NAME, s.name).apply();
            }
        });

        // Date picker click
        View.OnClickListener openDatePicker = v -> showDatePicker();
        dateSelectLayout.setOnClickListener(openDatePicker);
        tvSelectedDate.setOnClickListener(openDatePicker);
    }

    private void showDatePicker() {
        final Calendar now = Calendar.getInstance();
        int year = selectedDate.get(Calendar.YEAR);
        int month = selectedDate.get(Calendar.MONTH);
        int day = selectedDate.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog dpd = new DatePickerDialog(requireContext(), (view, y, m, dayOfMonth) -> {
            selectedDate = Calendar.getInstance();
            selectedDate.set(Calendar.YEAR, y);
            selectedDate.set(Calendar.MONTH, m);
            selectedDate.set(Calendar.DAY_OF_MONTH, dayOfMonth);
            selectedDate.set(Calendar.HOUR_OF_DAY, 0);
            selectedDate.set(Calendar.MINUTE, 0);
            selectedDate.set(Calendar.SECOND, 0);
            selectedDate.set(Calendar.MILLISECOND, 0);

            tvSelectedDate.setText(displayDateFormat.format(selectedDate.getTime()));
            Log.d(TAG, "Date selected: " + selectedDate.getTime());
        }, year, month, day);

        dpd.getDatePicker().setMinDate(now.getTimeInMillis());
        dpd.show();
    }

    private void fetchStations() {
        ApiService apiService = ApiClient.getRetrofit(requireActivity()).create(ApiService.class);
        Call<List<Station>> call = apiService.getStations();
        call.enqueue(new Callback<List<Station>>() {
            @Override
            public void onResponse(Call<List<Station>> call, Response<List<Station>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    stations = response.body();
                    stationByName.clear();
                    stationById.clear();
                    List<String> names = new ArrayList<>(stations.size());
                    for (Station s : stations) {
                        // If duplicate names exist, last one will overwrite - if that is a concern,
                        // consider using a Map<String, List<Station>> keyed by name.
                        stationByName.put(s.name, s);
                        stationById.put(s.id, s);
                        names.add(s.name);
                    }

                    // Set adapters for dropdowns on the UI thread
                    if (getActivity() != null) {
                        ArrayAdapter<String> adapter = new ArrayAdapter<>(requireContext(),
                                android.R.layout.simple_dropdown_item_1line, names);
                        actvFrom.setAdapter(adapter);
                        actvTo.setAdapter(adapter);

                        // Restore previously selected station ids (if any)
                        SharedPreferences sp = requireContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                        int savedFromId = sp.getInt(KEY_FROM_ID, -1);
                        int savedToId = sp.getInt(KEY_TO_ID, -1);
                        if (savedFromId != -1) {
                            Station sf = stationById.get(savedFromId);
                            if (sf != null) {
                                selectedFrom = sf;
                                actvFrom.setText(sf.name, false);
                            }
                        }

                        if (savedToId != -1) {
                            Station st = stationById.get(savedToId);
                            if (st != null) {
                                selectedTo = st;
                                actvTo.setText(st.name, false);
                            }
                        }
                    }

                    Log.d(TAG, "onResponse: stations size = " + stations.size());
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
}
