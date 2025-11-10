package com.mojahid2021.railnet;

import static android.content.ContentValues.TAG;

import android.os.Bundle;
import android.util.Log;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

import com.mojahid2021.railnet.home.HomeFragment;
import com.mojahid2021.railnet.map.MapFragment;
import com.mojahid2021.railnet.profile.ProfileFragment;
import com.mojahid2021.railnet.train.TrainFragment;


public class MainActivity extends AppCompatActivity {
    private LinearLayout homeLayout, trainLayout, mapLayout, profileLayout;
    private ImageView homeIcon, trainIcon, mapIcon, profileIcon;
    private TextView homeText, trainText, mapText, profileText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        homeLayout = findViewById(R.id.homeLayout);
        trainLayout = findViewById(R.id.trainLayout);
        mapLayout = findViewById(R.id.mapLayout);
        profileLayout = findViewById(R.id.profileLayout);

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
            homeIcon.setColorFilter(ContextCompat.getColor(this, R.color.white));
            homeIcon.setBackgroundResource(R.drawable.selected_nav_background);
            homeText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (layout == trainLayout) {
            trainLayout.setBackgroundResource(R.drawable.selected_nav_background);
            trainIcon.setColorFilter(ContextCompat.getColor(this, R.color.primary));
            trainText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (layout == mapLayout) {
            mapLayout.setBackgroundResource(R.drawable.selected_nav_background);
            mapIcon.setColorFilter(ContextCompat.getColor(this, R.color.primary));
            mapText.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (layout == profileLayout) {
            profileLayout.setBackgroundResource(R.drawable.selected_nav_background);
            profileIcon.setColorFilter(ContextCompat.getColor(this, R.color.primary));
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

        homeLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));
        trainLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));
        mapLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));
        profileLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.transparent));

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