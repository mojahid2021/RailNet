package com.mojahid2021.railnet.activity.myTickets;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MyTicketsActivity extends AppCompatActivity {

    private static final String TAG = "MyTicketsActivity";

    private RecyclerView rv;
    private View progress;
    private TextView tvEmpty;
    private TextView tvError;
    private TextView tvActiveTickets;
    private TextView tvUpcomingTrips;
    private TextView tvTotalBookings;
    private ImageView btnBack;
    private TicketsAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_my_tickets);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        rv = findViewById(R.id.recyclerViewTickets);
        progress = findViewById(R.id.progressContainer);
        tvEmpty = findViewById(R.id.tvEmpty);
        tvError = findViewById(R.id.tvError);
        tvActiveTickets = findViewById(R.id.tvActiveTickets);
        tvUpcomingTrips = findViewById(R.id.tvUpcomingTrips);
        tvTotalBookings = findViewById(R.id.tvTotalBookings);


        // Use LinearLayoutManager for vertical list view instead of grid
        androidx.recyclerview.widget.LinearLayoutManager layoutManager = new androidx.recyclerview.widget.LinearLayoutManager(this);
        layoutManager.setOrientation(androidx.recyclerview.widget.LinearLayoutManager.VERTICAL);
        rv.setLayoutManager(layoutManager);

        // Add simple vertical spacing between items (16dp)
        int verticalSpacing = dpToPx(16);
        rv.addItemDecoration(new androidx.recyclerview.widget.RecyclerView.ItemDecoration() {
            @Override
            public void getItemOffsets(android.graphics.Rect outRect, android.view.View view, androidx.recyclerview.widget.RecyclerView parent, androidx.recyclerview.widget.RecyclerView.State state) {
                if (parent.getChildAdapterPosition(view) > 0) { // Add top margin to all items except first
                    outRect.top = verticalSpacing;
                }
            }
        });

        adapter = new TicketsAdapter();
        rv.setAdapter(adapter);

        fetchTickets();
    }

    private void showLoading(boolean loading) {
        progress.setVisibility(loading ? View.VISIBLE : View.GONE);
        rv.setVisibility(loading ? View.GONE : View.VISIBLE);
        tvEmpty.setVisibility(View.GONE);
        tvError.setVisibility(View.GONE);
    }

    private void showEmpty() {
        progress.setVisibility(View.GONE);
        rv.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.VISIBLE);
        tvError.setVisibility(View.GONE);
    }

    private void showError(String errorMessage) {
        progress.setVisibility(View.GONE);
        rv.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.GONE);
        tvError.setText(errorMessage);
        tvError.setVisibility(View.VISIBLE);
    }

    private void fetchTickets() {
        showLoading(true);
        ApiService api = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = api.getTickets();
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ResponseBody rb = response.body();
                    try {
                        String body = rb.string();
                        Gson gson = new Gson();
                        Log.d(TAG, "onResponse: " + body);
                        UserTicket[] arr = gson.fromJson(body, UserTicket[].class);
                        List<UserTicket> list = Arrays.asList(arr != null ? arr : new UserTicket[0]);

                        // Update statistics
                        updateStatistics(list);

                        if (list.isEmpty()) {
                            showEmpty();
                        } else {
                            adapter.setItems(list);
                        }
                    } catch (IOException | JsonSyntaxException e) {
                        Log.e(TAG, "Failed to parse tickets: " + e.getMessage(), e);
                        showError("Failed to load tickets. Please try again.");
                    } finally {
                        rb.close();
                    }
                } else {
                    Log.e(TAG, "Tickets request failed: code=" + response.code());
                    String errorMessage = "Failed to load tickets";
                    try {
                        if (response.errorBody() != null) {
                            String errorBody = response.errorBody().string();
                            if (!errorBody.isEmpty()) {
                                errorMessage = "Error: " + errorBody;
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to read error body", e);
                    }
                    showError(errorMessage);
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                showLoading(false);
                Log.e(TAG, "Tickets request error: " + t.getMessage(), t);
                showError("Network error. Please check your connection and try again.");
            }
        });
    }

    private void updateStatistics(List<UserTicket> tickets) {
        int activeCount = 0;
        int upcomingCount = 0;
        int totalCount = tickets.size();

        // Get current date in YYYY-MM-DD format for comparison
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault());
        String todayStr = sdf.format(new java.util.Date());

        for (UserTicket ticket : tickets) {
            // Count active tickets (confirmed status)
            if (ticket.ticket != null && "confirmed".equalsIgnoreCase(ticket.ticket.status)) {
                activeCount++;
            }

            // Count upcoming trips (future dates)
            if (ticket.journey != null && ticket.journey.schedule != null && ticket.journey.schedule.date != null) {
                try {
                    String tripDateStr = ticket.journey.schedule.date;
                    // Simple string comparison for dates in YYYY-MM-DD format
                    if (tripDateStr.compareTo(todayStr) >= 0) {
                        upcomingCount++;
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Failed to parse date: " + ticket.journey.schedule.date, e);
                }
            }
        }

        tvActiveTickets.setText(String.valueOf(activeCount));
        tvUpcomingTrips.setText(String.valueOf(upcomingCount));
        tvTotalBookings.setText(String.valueOf(totalCount));
    }

    // Convert dp to pixels for spacing
    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }
}