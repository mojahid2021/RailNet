package com.mojahid2021.railnet.activity;

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
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.adapter.TicketsAdapter;
import com.mojahid2021.railnet.model.UserTicket;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * MyTicketsActivity displays the user's booked tickets.
 * Shows ticket list, statistics, and handles loading/error states.
 */
public class MyTicketsActivity extends AppCompatActivity {

    // Constants
    private static final String TAG = "MyTicketsActivity";
    private static final int VERTICAL_SPACING_DP = 16;
    private static final String DATE_FORMAT = "yyyy-MM-dd";

    // UI Components
    private RecyclerView rvTickets;
    private View progressContainer;
    private TextView tvEmpty;
    private TextView tvError;
    private TicketsAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_my_tickets);

        setupWindowInsets();
        initializeViews();
        setupRecyclerView();
        fetchTickets();
    }

    /**
     * Sets up edge-to-edge display with window insets
     */
    private void setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }

    /**
     * Initializes all view references
     */
    private void initializeViews() {
        rvTickets = findViewById(R.id.recyclerViewTickets);
        progressContainer = findViewById(R.id.progressContainer);
        tvEmpty = findViewById(R.id.tvEmpty);
        tvError = findViewById(R.id.tvError);

    }

    /**
     * Sets up the RecyclerView with layout manager and decorations
     */
    private void setupRecyclerView() {
        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        layoutManager.setOrientation(LinearLayoutManager.VERTICAL);
        rvTickets.setLayoutManager(layoutManager);

        // Add vertical spacing between items
        int verticalSpacing = dpToPx(VERTICAL_SPACING_DP);
        rvTickets.addItemDecoration(new RecyclerView.ItemDecoration() {
            @Override
            public void getItemOffsets(android.graphics.Rect outRect, View view,
                                     RecyclerView parent, RecyclerView.State state) {
                if (parent.getChildAdapterPosition(view) > 0) {
                    outRect.top = verticalSpacing;
                }
            }
        });

        adapter = new TicketsAdapter();
        rvTickets.setAdapter(adapter);
    }

    /**
     * Shows or hides loading state
     */
    private void showLoading(boolean loading) {
        progressContainer.setVisibility(loading ? View.VISIBLE : View.GONE);
        rvTickets.setVisibility(loading ? View.GONE : View.VISIBLE);
        tvEmpty.setVisibility(View.GONE);
        tvError.setVisibility(View.GONE);
    }

    /**
     * Shows empty state when no tickets are available
     */
    private void showEmpty() {
        progressContainer.setVisibility(View.GONE);
        rvTickets.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.VISIBLE);
        tvError.setVisibility(View.GONE);
    }

    /**
     * Shows error state with message
     */
    private void showError(String errorMessage) {
        progressContainer.setVisibility(View.GONE);
        rvTickets.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.GONE);
        tvError.setText(errorMessage);
        tvError.setVisibility(View.VISIBLE);
    }

    /**
     * Fetches tickets from the API
     */
    private void fetchTickets() {
        showLoading(true);
        ApiService api = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = api.getTickets();

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                handleTicketsResponse(response);
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                handleTicketsFailure(t);
            }
        });
    }

    /**
     * Handles successful tickets API response
     */
    private void handleTicketsResponse(Response<ResponseBody> response) {
        showLoading(false);

        if (!response.isSuccessful() || response.body() == null) {
            handleTicketsError(response);
            return;
        }

        try (ResponseBody responseBody = response.body()) {
            String body = responseBody.string();
            Log.d(TAG, "Tickets response: " + body);

            List<UserTicket> tickets = parseTickets(body);
            if (tickets.isEmpty()) {
                showEmpty();
            } else {
                adapter.setItems(tickets);
            }

        } catch (IOException | JsonSyntaxException e) {
            Log.e(TAG, "Failed to parse tickets: " + e.getMessage(), e);
            showError("Failed to load tickets. Please try again.");
        }
    }

    /**
     * Parses JSON response into UserTicket list
     */
    private List<UserTicket> parseTickets(String json) throws JsonSyntaxException {
        Gson gson = new Gson();
        UserTicket[] ticketsArray = gson.fromJson(json, UserTicket[].class);
        return Arrays.asList(ticketsArray != null ? ticketsArray : new UserTicket[0]);
    }

    /**
     * Handles tickets API error response
     */
    private void handleTicketsError(Response<ResponseBody> response) {
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

    /**
     * Handles tickets API network failure
     */
    private void handleTicketsFailure(Throwable t) {
        showLoading(false);
        Log.e(TAG, "Tickets request error: " + t.getMessage(), t);
        showError("Network error. Please check your connection and try again.");
    }


    /**
     * Converts dp to pixels
     */
    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }
}

