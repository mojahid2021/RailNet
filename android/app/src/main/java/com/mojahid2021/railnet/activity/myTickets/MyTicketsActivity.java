package com.mojahid2021.railnet.activity.myTickets;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
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
        progress = findViewById(R.id.progressContainer);
        tvEmpty = findViewById(R.id.tvEmpty);

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
}