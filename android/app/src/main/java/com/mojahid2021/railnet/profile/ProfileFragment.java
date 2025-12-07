package com.mojahid2021.railnet.profile;

import static android.content.ContentValues.TAG;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.network.ApiService;
import com.mojahid2021.railnet.network.ApiClient;

import org.json.JSONObject;

import java.io.IOException;

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
    private ImageView ivCoverPhoto, ivProfileAvatar;
    private FloatingActionButton fabEditCover;
    private MaterialButton btnEditProfile;
    private TextView tvUserName, tvMemberDate;
    private TextView tvTripsCount, tvBookingsCount, tvSavedCount;
    private TextView tvUserEmail, tvUserPhone, tvUserLocation;
    private LinearLayout btnMyTickets, btnMyBookings, btnSavedRoutes, btnSettings;

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
        // Cover photo and profile image components
        ivCoverPhoto = view.findViewById(R.id.ivCoverPhoto);
        ivProfileAvatar = view.findViewById(R.id.ivProfileAvatar);
        fabEditCover = view.findViewById(R.id.fabEditCover);
        btnEditProfile = view.findViewById(R.id.btnEditProfile);
        tvUserName = view.findViewById(R.id.tvUserName);
        tvMemberDate = view.findViewById(R.id.tvMemberDate);

        // Stats
        tvTripsCount = view.findViewById(R.id.tvTripsCount);
        tvBookingsCount = view.findViewById(R.id.tvBookingsCount);
        tvSavedCount = view.findViewById(R.id.tvSavedCount);

        // Contact info
        tvUserEmail = view.findViewById(R.id.tvUserEmail);
        tvUserPhone = view.findViewById(R.id.tvUserPhone);
        tvUserLocation = view.findViewById(R.id.tvUserLocation);

        // Menu items
        btnMyTickets = view.findViewById(R.id.btnMyTickets);
        btnSettings = view.findViewById(R.id.btnSettings);
    }

    /**
     * Setup click listeners for interactive elements
     */
    private void setupClickListeners() {
        // Cover photo actions
        fabEditCover.setOnClickListener(v -> onChangeCoverPhotoClick());
        ivCoverPhoto.setOnClickListener(v -> onCoverPhotoClick());
        ivProfileAvatar.setOnClickListener(v -> onProfileAvatarClick());

        // Edit profile button
        btnEditProfile.setOnClickListener(v -> onEditProfileClick());

        // Menu items
        btnMyTickets.setOnClickListener(v -> onMyTicketsClick());
        btnSettings.setOnClickListener(v -> onSettingsClick());
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

    // Click handler methods
    private void onChangeCoverPhotoClick() {
        showToast("Change cover photo");
        // Open image picker or camera for cover photo
    }

    private void onCoverPhotoClick() {
        showToast("View cover photo");
        // Open full screen image viewer for cover photo
    }

    private void onProfileAvatarClick() {
        showToast("Change profile photo");
        // Open image picker or camera for profile photo
    }

    private void onEditProfileClick() {
        showToast("Edit Profile");
        // Navigate to edit profile screen
    }


    private void onMyTicketsClick() {
        showToast("My Tickets clicked");
        // Navigate to tickets screen
    }


    private void onSettingsClick() {
        showToast("Settings clicked");
        // Navigate to settings screen
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