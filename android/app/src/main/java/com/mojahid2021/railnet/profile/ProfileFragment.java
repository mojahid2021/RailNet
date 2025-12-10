package com.mojahid2021.railnet.profile;

import static android.content.ContentValues.TAG;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.activity.MyTicketsActivity;
import com.mojahid2021.railnet.network.ApiService;
import com.mojahid2021.railnet.network.ApiClient;

import org.json.JSONObject;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Profile Fragment showing user information, stats, and menu options
 * Follows Material Design 3 guidelines with modern UI components
 * Features cover photo and profile image
 */
public class ProfileFragment extends Fragment {

    // UI Components
    private TextView tvUserName, tvMemberDate;
    private TextView tvUserEmail, tvUserPhone, tvUserLocation;
    private LinearLayout btnMyTickets;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initializeViews(view);
        setupClickListeners();
        loadUserData();
    }

    /**
     * Initialize all view components
     */
    private void initializeViews(View view) {

        tvUserName = view.findViewById(R.id.tvUserName);
        tvMemberDate = view.findViewById(R.id.tvMemberDate);

        // Contact info
        tvUserEmail = view.findViewById(R.id.tvUserEmail);
        tvUserPhone = view.findViewById(R.id.tvUserPhone);
        tvUserLocation = view.findViewById(R.id.tvUserLocation);

        // Menu items
        btnMyTickets = view.findViewById(R.id.btnMyTickets);
    }

    /**
     * Setup click listeners for interactive elements
     */
    private void setupClickListeners() {
        // Menu items
        btnMyTickets.setOnClickListener(v -> onMyTicketsClick());
    }

    /**
     * Load user data (can be replaced with actual data from API/Database)
     */
    private void loadUserData() {
        ApiService apiService = ApiClient.getRetrofit(requireActivity()).create(ApiService.class);
        Call<ResponseBody> call = apiService.getProfile();
        // Implement API call and populate UI with user data

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {

                if (response.isSuccessful() && response.body() != null) {
                    try {
                        String responseBody = response.body().string();
                        JSONObject jsonObject = new JSONObject(responseBody);
                        String firstName = jsonObject.getString("firstName");
                        String lastName = jsonObject.getString("lastName");
                        String email = jsonObject.getString("email");
                        String phone = jsonObject.getString("phone");
                        String location = jsonObject.getString("address");
                        String memberSince = jsonObject.getString("createdAt");

                        tvUserName.setText(firstName + " " + lastName);
                        tvUserEmail.setText(email);
                        tvMemberDate.setText("Member since: " + memberSince);
                        tvUserPhone.setText(phone);
                        tvUserLocation.setText(location);

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                } else {
                    showToast("Failed to load user data");

                    Log.d(TAG, "onResponse: " + response.code() + " " + response.message() + " " + response.body());
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {

                showToast("Error loading user data");
                Log.e(TAG, "onFailure: ", t);

            }
        });
    }


    private void onMyTicketsClick() {
        Intent intent = new Intent(getContext(), MyTicketsActivity.class);
        startActivity(intent);
    }

    /**
     * Helper method to show toast messages
     */
    private void showToast(String message) {
        if (getContext() != null) {
            Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
        }
    }
}