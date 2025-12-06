package com.mojahid2021.railnet;

import static android.content.ContentValues.TAG;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

import com.mojahid2021.railnet.auth.LoginActivity;
import com.mojahid2021.railnet.home.HomeFragment;
import com.mojahid2021.railnet.map.MapFragment;
import com.mojahid2021.railnet.profile.ProfileFragment;
import com.mojahid2021.railnet.train.TrainFragment;


public class MainActivity extends AppCompatActivity {
    private LinearLayout homeLayout, trainLayout, mapLayout, profileLayout;
    private LinearLayout homeIconLayout, trainIconLayout, mapIconLayout, profileIconLayout;
    private ImageView homeIcon, trainIcon, mapIcon, profileIcon;
    private TextView homeText, trainText, mapText, profileText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);

        SharedPreferences sharedPreferences = getSharedPreferences("UserPreferences", MODE_PRIVATE);
        String token = sharedPreferences.getString("token", null);
        if (token == null) {
            Intent intent = new Intent(MainActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
            return;
        }

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

        homeLayout = findViewById(R.id.homeLayout);
        trainLayout = findViewById(R.id.trainLayout);
        mapLayout = findViewById(R.id.mapLayout);
        profileLayout = findViewById(R.id.profileLayout);

        homeIconLayout = findViewById(R.id.homeIconLayout);
        trainIconLayout = findViewById(R.id.trainIconLayout);
        mapIconLayout = findViewById(R.id.mapIconLayout);
        profileIconLayout = findViewById(R.id.profileIconLayout);

        homeIcon = findViewById(R.id.homeIcon);
        trainIcon = findViewById(R.id.trainIcon);
        mapIcon = findViewById(R.id.mapIcon);
        profileIcon = findViewById(R.id.profileIcon);

        homeText = findViewById(R.id.homeText);
        trainText = findViewById(R.id.trainText);
        mapText = findViewById(R.id.mapText);
        profileText = findViewById(R.id.profileText);

        configureNavigation();
        loadFragment(new HomeFragment());
        highLightNavigation(homeLayout);
    }

    private void highLightNavigation(LinearLayout layout) {
        resetNavigation();

        if (layout == null) {
            Log.e(TAG, "highLightNavigation: layout is null");
            return;
        }
        if (layout == homeLayout) {
            homeIconLayout.setBackgroundResource(R.drawable.selected_nav_background);
            homeIcon.setColorFilter(ContextCompat.getColor(this, R.color.white));
            homeText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (layout == trainLayout) {
            trainIconLayout.setBackgroundResource(R.drawable.selected_nav_background);
            trainIcon.setColorFilter(ContextCompat.getColor(this, R.color.white));
            trainText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (layout == mapLayout) {
            mapIconLayout.setBackgroundResource(R.drawable.selected_nav_background);
            mapIcon.setColorFilter(ContextCompat.getColor(this, R.color.white));
            mapText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (layout == profileLayout) {
            profileIconLayout.setBackgroundResource(R.drawable.selected_nav_background);
            profileIcon.setColorFilter(ContextCompat.getColor(this, R.color.white));
            profileText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        }

    }

    private void configureNavigation() {
        homeLayout.setOnClickListener(v -> {
            loadFragment(new HomeFragment());
            highLightNavigation(homeLayout);
        });

        trainLayout.setOnClickListener(v -> {
            loadFragment(new TrainFragment());
            highLightNavigation(trainLayout);
        });

        mapLayout.setOnClickListener(v -> {
            loadFragment(new MapFragment());
            highLightNavigation(mapLayout);
        });

        profileLayout.setOnClickListener(v -> {
            loadFragment(new ProfileFragment());
            highLightNavigation(profileLayout);
        });
    }

    private void resetNavigation() {
        homeIcon.setColorFilter(ContextCompat.getColor(this, R.color.darkPurple));
        trainIcon.setColorFilter(ContextCompat.getColor(this, R.color.darkPurple));
        mapIcon.setColorFilter(ContextCompat.getColor(this, R.color.darkPurple));
        profileIcon.setColorFilter(ContextCompat.getColor(this, R.color.darkPurple));

        homeIconLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));
        trainIconLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));
        mapIconLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));
        profileIconLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));

        homeText.setTextColor(ContextCompat.getColor(this, R.color.darkPurple));
        trainText.setTextColor(ContextCompat.getColor(this, R.color.darkPurple));
        mapText.setTextColor(ContextCompat.getColor(this, R.color.darkPurple));
        profileText.setTextColor(ContextCompat.getColor(this, R.color.darkPurple));
    }


    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragmentContainer, fragment)
                .commit();
    }
}