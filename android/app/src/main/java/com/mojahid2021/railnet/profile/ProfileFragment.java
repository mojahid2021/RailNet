package com.mojahid2021.railnet.profile;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

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
        btnMyBookings = view.findViewById(R.id.btnMyBookings);
        btnSavedRoutes = view.findViewById(R.id.btnSavedRoutes);
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
        btnMyBookings.setOnClickListener(v -> onMyBookingsClick());
        btnSavedRoutes.setOnClickListener(v -> onSavedRoutesClick());
        btnSettings.setOnClickListener(v -> onSettingsClick());
    }

    /**
     * Load user data (can be replaced with actual data from API/Database)
     */
    private void loadUserData() {
        // User data is currently loaded from strings.xml
        // In a real app, you would fetch this from a database or API
        // Example:
        // tvUserName.setText(userProfile.getName());
        // tvUserEmail.setText(userProfile.getEmail());
        // etc.
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

    private void onMyBookingsClick() {
        showToast("My Bookings clicked");
        // Navigate to bookings screen
    }

    private void onSavedRoutesClick() {
        showToast("Saved Routes clicked");
        // Navigate to saved routes screen
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