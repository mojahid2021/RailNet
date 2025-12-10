package com.mojahid2021.railnet.activity;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.reflect.TypeToken;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.adapter.TrainScheduleAdapter;
import com.mojahid2021.railnet.model.TrainSchedule;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * TrainsActivity displays available train schedules for selected route and date.
 * Handles API calls, parsing responses, and navigation to compartment selection.
 */
public class TrainsActivity extends AppCompatActivity {

    // Constants
    private static final String TAG = "TrainsActivity";
    private static final String EXTRA_FROM_STATION_ID = "fromStationId";
    private static final String EXTRA_TO_STATION_ID = "toStationId";
    private static final String EXTRA_DATE = "date";
    private static final String EXTRA_FROM_STATION_NAME = "fromStationName";
    private static final String EXTRA_TO_STATION_NAME = "toStationName";
    private static final String EXTRA_SCHEDULE_JSON = "scheduleJson";

    // UI Components
    private RecyclerView rvSchedules;
    private View progressContainer;
    private View emptyContainer;
    private TextView tvTrainCount;
    private TrainScheduleAdapter adapter;

    // Data
    private String fromId;
    private String toId;
    private String date;
    private String fromName;
    private String toName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_trains);

        setupWindow();
        initializeViews();
        extractIntentData();

        if (!validateIntentData()) {
            finish();
            return;
        }

        setupRecyclerView();
        fetchTrainSchedules();
    }

    /**
     * Sets up edge-to-edge display and status bar appearance
     */
    private void setupWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            v.setPadding(
                insets.getInsets(WindowInsetsCompat.Type.systemBars()).left,
                insets.getInsets(WindowInsetsCompat.Type.systemBars()).top,
                insets.getInsets(WindowInsetsCompat.Type.systemBars()).right,
                insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
            );
            return insets;
        });
    }

    /**
     * Initializes all view references
     */
    private void initializeViews() {
        rvSchedules = findViewById(R.id.rvSchedules);
        progressContainer = findViewById(R.id.progressContainer);
        emptyContainer = findViewById(R.id.emptyContainer);
        tvTrainCount = findViewById(R.id.tvTrainCount);
    }

    /**
     * Extracts data from intent extras
     */
    private void extractIntentData() {
        fromId = getIntent().getStringExtra(EXTRA_FROM_STATION_ID);
        toId = getIntent().getStringExtra(EXTRA_TO_STATION_ID);
        date = getIntent().getStringExtra(EXTRA_DATE);
        fromName = getIntent().getStringExtra(EXTRA_FROM_STATION_NAME);
        toName = getIntent().getStringExtra(EXTRA_TO_STATION_NAME);
    }

    /**
     * Validates that required intent data is present
     */
    private boolean validateIntentData() {
        return fromId != null && toId != null && date != null;
    }

    /**
     * Sets up the RecyclerView with layout manager and adapter
     */
    private void setupRecyclerView() {
        rvSchedules.setLayoutManager(new LinearLayoutManager(this));

        adapter = new TrainScheduleAdapter(schedule -> {
            navigateToCompartmentActivity(schedule);
        });

        rvSchedules.setAdapter(adapter);
    }

    /**
     * Navigates to CompartmentActivity with selected schedule
     */
    private void navigateToCompartmentActivity(TrainSchedule schedule) {
        Gson gson = new Gson();
        String json = gson.toJson(schedule);

        android.content.Intent intent = new android.content.Intent(this, CompartmentActivity.class);
        intent.putExtra(EXTRA_SCHEDULE_JSON, json);
        intent.putExtra(EXTRA_FROM_STATION_ID, fromId);
        intent.putExtra(EXTRA_TO_STATION_ID, toId);
        startActivity(intent);
    }

    /**
     * Fetches train schedules from the API
     */
    private void fetchTrainSchedules() {
        showLoading(true);

        ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = apiService.searchTrainSchedules(fromId, toId, date);

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                handleSchedulesResponse(response);
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                handleSchedulesFailure(t);
            }
        });
    }

    /**
     * Handles successful schedules API response
     */
    private void handleSchedulesResponse(Response<ResponseBody> response) {
        showLoading(false);

        if (!response.isSuccessful() || response.body() == null) {
            showEmptyState();
            return;
        }

        try (ResponseBody responseBody = response.body()) {
            String body = responseBody.string();
            List<TrainSchedule> schedules = parseSchedulesResponse(body);

            if (schedules == null || schedules.isEmpty()) {
                showEmptyState();
            } else {
                showSchedules(schedules);
            }

        } catch (IOException e) {
            Log.e(TAG, "Error reading response body", e);
            showEmptyState();
        }
    }

    /**
     * Parses the JSON response into TrainSchedule list
     */
    private List<TrainSchedule> parseSchedulesResponse(String body) {
        try {
            JsonParser parser = new JsonParser();
            JsonElement json = parser.parse(body);
            JsonArray array = extractSchedulesArray(json);

            if (array == null || array.size() == 0) {
                return null;
            }

            Gson gson = new Gson();
            Type listType = new TypeToken<List<TrainSchedule>>() {}.getType();
            return gson.fromJson(array, listType);

        } catch (Exception e) {
            Log.e(TAG, "Error parsing schedules response", e);
            return null;
        }
    }

    /**
     * Extracts the schedules array from JSON response
     */
    private JsonArray extractSchedulesArray(JsonElement json) {
        if (json.isJsonArray()) {
            return json.getAsJsonArray();
        } else if (json.isJsonObject()) {
            JsonObject obj = json.getAsJsonObject();
            if (obj.has("data") && obj.get("data").isJsonArray()) {
                return obj.getAsJsonArray("data");
            }
        }
        return null;
    }

    /**
     * Shows the schedules in the RecyclerView
     */
    private void showSchedules(List<TrainSchedule> schedules) {
        rvSchedules.setVisibility(View.VISIBLE);
        emptyContainer.setVisibility(View.GONE);
        tvTrainCount.setText(schedules.size() + " Trains");
        adapter.setItems(schedules);
    }

    /**
     * Shows empty state when no schedules are found
     */
    private void showEmptyState() {
        rvSchedules.setVisibility(View.GONE);
        emptyContainer.setVisibility(View.VISIBLE);
        tvTrainCount.setText("0 Trains");
    }

    /**
     * Handles schedules API network failure
     */
    private void handleSchedulesFailure(Throwable t) {
        showLoading(false);
        showEmptyState();
        Log.e(TAG, "Network error fetching schedules", t);
    }

    /**
     * Shows or hides loading state
     */
    private void showLoading(boolean loading) {
        progressContainer.setVisibility(loading ? View.VISIBLE : View.GONE);
        rvSchedules.setVisibility(loading ? View.GONE : View.VISIBLE);
        emptyContainer.setVisibility(loading ? View.GONE : View.VISIBLE);
    }
}