package com.mojahid2021.railnet.activity.myTickets;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.GridLayoutManager;
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
    private ProgressBar progress;
    private TextView tvEmpty;
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

        rv = findViewById(R.id.recyclerViewTickets);
        progress = findViewById(R.id.progressLoading);
        tvEmpty = findViewById(R.id.tvEmpty);

        // Use GridLayoutManager for a grid of ticket cards (not a simple list).
        int spanCount = 2; // two columns; adjust if you want different behavior
        GridLayoutManager glm = new GridLayoutManager(this, spanCount);
        rv.setLayoutManager(glm);

        // Add spacing between grid items (8dp)
        int spacing = dpToPx(8);
        rv.addItemDecoration(new GridSpacingItemDecoration(spanCount, spacing, true));

        adapter = new TicketsAdapter();
        rv.setAdapter(adapter);

        fetchTickets();
    }

    private void showLoading(boolean loading) {
        progress.setVisibility(loading ? View.VISIBLE : View.GONE);
        rv.setVisibility(loading ? View.GONE : View.VISIBLE);
        tvEmpty.setVisibility(View.GONE);
    }

    private void showEmpty() {
        progress.setVisibility(View.GONE);
        rv.setVisibility(View.GONE);
        tvEmpty.setVisibility(View.VISIBLE);
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
                        UserTicket[] arr = gson.fromJson(body, UserTicket[].class);
                        List<UserTicket> list = Arrays.asList(arr != null ? arr : new UserTicket[0]);
                        if (list.isEmpty()) {
                            showEmpty();
                        } else {
                            adapter.setItems(list);
                        }
                    } catch (IOException | JsonSyntaxException e) {
                        Log.e(TAG, "Failed to parse tickets: " + e.getMessage(), e);
                        showEmpty();
                    } finally {
                        rb.close();
                    }
                } else {
                    Log.e(TAG, "Tickets request failed: code=" + response.code());
                    showEmpty();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                showLoading(false);
                Log.e(TAG, "Tickets request error: " + t.getMessage(), t);
                showEmpty();
            }
        });
    }

    // Convert dp to pixels for spacing
    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    // Simple item decoration that adds consistent spacing around grid items
    private static class GridSpacingItemDecoration extends RecyclerView.ItemDecoration {
        private final int spanCount;
        private final int spacing;
        private final boolean includeEdge;

        GridSpacingItemDecoration(int spanCount, int spacing, boolean includeEdge) {
            this.spanCount = spanCount;
            this.spacing = spacing;
            this.includeEdge = includeEdge;
        }

        @Override
        public void getItemOffsets(android.graphics.Rect outRect, View view, RecyclerView parent, RecyclerView.State state) {
            int position = parent.getChildAdapterPosition(view); // item position
            int column = position % spanCount; // item column

            if (includeEdge) {
                outRect.left = spacing - column * spacing / spanCount; // spacing - column * ((1f / spanCount) * spacing)
                outRect.right = (column + 1) * spacing / spanCount; // (column + 1) * ((1f / spanCount) * spacing)

                if (position < spanCount) { // top edge
                    outRect.top = spacing;
                }
                outRect.bottom = spacing; // item bottom
            } else {
                outRect.left = column * spacing / spanCount; // column * ((1f / spanCount) * spacing)
                outRect.right = spacing - (column + 1) * spacing / spanCount; // spacing - (column + 1) * ((1f / spanCount) * spacing)
                if (position >= spanCount) {
                    outRect.top = spacing; // item top
                }
            }
        }
    }
}