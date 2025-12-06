package com.mojahid2021.railnet;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
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
import com.mojahid2021.railnet.home.TrainScheduleAdapter;
import com.mojahid2021.railnet.home.model.TrainSchedule;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;
import com.mojahid2021.railnet.util.DateTimeUtils;

import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TrainsActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_trains);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Set status bar icons to black (dark icons)
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        // Set up edge-to-edge display
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


        // Use modern header instead of toolbar
        View btnBack = findViewById(R.id.btnBack);
        TextView headerTitle = findViewById(R.id.headerTitle);
        TextView headerSubtitle = findViewById(R.id.headerSubtitle);
        btnBack.setOnClickListener(v -> finish());

        // Read extras early so we can pass them when starting other activities
        String fromId = getIntent().getStringExtra("fromStationId");
        String toId = getIntent().getStringExtra("toStationId");
        String date = getIntent().getStringExtra("date");

        RecyclerView rvSchedules = findViewById(R.id.rvSchedules);
        rvSchedules.setLayoutManager(new LinearLayoutManager(this));
        TrainScheduleAdapter adapter = new TrainScheduleAdapter(schedule -> {
             // Start CompartmentActivity with schedule JSON
             Gson gson = new Gson();
             String json = gson.toJson(schedule);
             android.content.Intent intent = new android.content.Intent(TrainsActivity.this, com.mojahid2021.railnet.CompartmentActivity.class);
             intent.putExtra("scheduleJson", json);
             // pass through selected station ids
             intent.putExtra("fromStationId", fromId);
             intent.putExtra("toStationId", toId);
             startActivity(intent);
         });
         rvSchedules.setAdapter(adapter);

        ProgressBar progress = findViewById(R.id.progress);
        TextView tvEmpty = findViewById(R.id.tvEmpty);

        String fromName = getIntent().getStringExtra("fromStationName");
        String toName = getIntent().getStringExtra("toStationName");

        if (fromName != null && toName != null) {
            headerTitle.setText(String.format(getString(R.string.route_format), fromName, toName));
            headerSubtitle.setText(DateTimeUtils.formatDisplayDateFromIso(date));
        }

        // Validate
        if (fromId == null || toId == null || date == null) return;

        // Show loading
        progress.setVisibility(View.VISIBLE);
        rvSchedules.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.GONE);

        // Fetch schedules as raw response body
        ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = apiService.searchTrainSchedules(fromId, toId, date);
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                progress.setVisibility(View.GONE);
                if (response.isSuccessful()) {
                    ResponseBody rb = response.body();
                    if (rb == null) {
                        Log.e("TrainsActivity", "empty body");
                        tvEmpty.setVisibility(View.VISIBLE);
                        return;
                    }
                    try (ResponseBody bodyRes = rb) {
                        String body = bodyRes.string();
                        // Parse flexibly: either a JSON array or an object with 'data' array
                        JsonElement json = new JsonParser().parse(body);
                        JsonArray array = null;
                        if (json.isJsonArray()) {
                            array = json.getAsJsonArray();
                        } else if (json.isJsonObject()) {
                            JsonObject obj = json.getAsJsonObject();
                            if (obj.has("data") && obj.get("data").isJsonArray()) {
                                array = obj.getAsJsonArray("data");
                            }
                        }

                        if (array == null || array.size() == 0) {
                            tvEmpty.setVisibility(View.VISIBLE);
                            rvSchedules.setVisibility(View.GONE);
                            return;
                        }

                        Gson gson = new Gson();
                        Type listType = new TypeToken<List<TrainSchedule>>() {}.getType();
                        List<TrainSchedule> schedules = gson.fromJson(array, listType);

                        rvSchedules.setVisibility(View.VISIBLE);
                        tvEmpty.setVisibility(View.GONE);
                        adapter.setItems(schedules);

                    } catch (IOException e) {
                        Log.e("TrainsActivity", "error reading body", e);
                        tvEmpty.setVisibility(View.VISIBLE);
                    }
                } else {
                    Log.e("TrainsActivity", "search failed: " + response.code());
                    tvEmpty.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                progress.setVisibility(View.GONE);
                tvEmpty.setVisibility(View.VISIBLE);
                Log.e("TrainsActivity", "network error", t);
            }
        });
    }
}