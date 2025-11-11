package com.mojahid2021.railnet.map;

import android.Manifest;
import android.animation.ValueAnimator;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.location.Location;
import android.os.Bundle;
import android.os.Looper;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.LinearInterpolator;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapView;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.mojahid2021.railnet.R;

public class MapFragment extends Fragment {
    private MapView mapView;
    private GoogleMap googleMap;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Marker currentLocationMarker;
    private Circle accuracyCircle;
    private boolean movedToCurrentLocation = false;

    // keep pulse animator reference to cancel when fragment pauses/destroys
    private ValueAnimator pulseAnimator;

    // desired marker size in dp
    private static final float MARKER_DP_SIZE = 24f;

    private final ActivityResultLauncher<String> requestPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (Boolean.TRUE.equals(isGranted)) {
                    startLocationUpdates();
                    enableLocationOnMap();
                } else {
                    // Permission denied — inform the user briefly
                    if (isAdded()) {
                        Toast.makeText(requireContext(), "Location permission denied. Enable it in Settings to see live location.", Toast.LENGTH_LONG).show();
                    }
                }
            });

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_map, container, false);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireContext());

        mapView = view.findViewById(R.id.mapView);

        mapView.onCreate(savedInstanceState);
        mapView.getMapAsync(map -> {
            googleMap = map;
            // Always follow user's live location; ask permission if needed
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                enableLocationOnMap();
                startLocationUpdates();
            } else {
                requestPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION);
            }
        });

        return view;
    }

    private BitmapDescriptor bitmapDescriptorFromVector(Context context, int vectorResId) {
        Drawable vectorDrawable = ContextCompat.getDrawable(context, vectorResId);
        if (vectorDrawable == null) return null;

        // scale vector to the desired dp size for consistent on-screen size
        int px = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, MARKER_DP_SIZE, context.getResources().getDisplayMetrics());

        vectorDrawable.setBounds(0, 0, px, px);
        Bitmap bitmap = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        vectorDrawable.draw(canvas);
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    private void enableLocationOnMap() {
        if (googleMap == null) return;
        try {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                // we show a custom user marker instead of the default blue dot
                googleMap.setMyLocationEnabled(false);
                googleMap.getUiSettings().setMyLocationButtonEnabled(false);
            }
        } catch (SecurityException e) {
            // ignore or log
        }
    }

    private void startLocationUpdates() {
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        // Use the modern LocationRequest.Builder API
        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000)
                .setMinUpdateIntervalMillis(1000)
                .build();

        if (locationCallback == null) {
            locationCallback = new LocationCallback() {
                @Override
                public void onLocationResult(@NonNull LocationResult locationResult) {
                    Location location = locationResult.getLastLocation();
                    if (location != null && googleMap != null) {
                        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());

                        // Update or create accuracy circle
                        if (accuracyCircle == null) {
                            double baseRadius = Math.max(location.getAccuracy(), 5.0); // sensible minimum
                            accuracyCircle = googleMap.addCircle(new CircleOptions()
                                    .center(latLng)
                                    .radius(baseRadius)
                                    .strokeWidth(0f)
                                    .fillColor(0x5533B5E5) // semi-transparent blue
                            );
                            startPulseAnimation(accuracyCircle, baseRadius);
                        } else {
                            accuracyCircle.setCenter(latLng);
                            double baseRadius = Math.max(location.getAccuracy(), 5.0);
                            accuracyCircle.setRadius(baseRadius);
                        }

                        // Create custom marker if needed
                        if (currentLocationMarker == null) {
                            BitmapDescriptor icon = bitmapDescriptorFromVector(requireContext(), R.drawable.ic_profile);
                            MarkerOptions opts = new MarkerOptions().position(latLng).anchor(0.5f, 0.5f);
                            if (icon != null) opts.icon(icon);
                            currentLocationMarker = googleMap.addMarker(opts);
                            // make marker flat so rotation works
                            if (currentLocationMarker != null) currentLocationMarker.setFlat(true);
                        } else {
                            // animate marker position smoothly
                            animateMarkerToPosition(currentLocationMarker, latLng);
                            float bearing = location.hasBearing() ? location.getBearing() : 0f;
                            animateMarkerRotation(currentLocationMarker, bearing);
                        }

                        // Always follow the user — auto-center
                        if (!movedToCurrentLocation) {
                            googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 17f));
                            movedToCurrentLocation = true;
                        } else {
                            // small camera movement to follow user smoothly
                            googleMap.animateCamera(CameraUpdateFactory.newLatLng(latLng));
                        }
                    }
                }
            };
        }

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());

        // Also try last known location immediately
        fusedLocationClient.getLastLocation().addOnSuccessListener(location -> {
            if (location != null && googleMap != null) {
                LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());
                if (currentLocationMarker == null) {
                    BitmapDescriptor icon = bitmapDescriptorFromVector(requireContext(), R.drawable.ic_profile);
                    MarkerOptions opts = new MarkerOptions().position(latLng).anchor(0.5f, 0.5f);
                    if (icon != null) opts.icon(icon);
                    currentLocationMarker = googleMap.addMarker(opts);
                    if (currentLocationMarker != null) currentLocationMarker.setFlat(true);
                } else {
                    currentLocationMarker.setPosition(latLng);
                }

                if (accuracyCircle == null) {
                    double baseRadius = Math.max(location.getAccuracy(), 5.0);
                    accuracyCircle = googleMap.addCircle(new CircleOptions()
                            .center(latLng)
                            .radius(baseRadius)
                            .strokeWidth(0f)
                            .fillColor(0x5533B5E5)
                    );
                    startPulseAnimation(accuracyCircle, baseRadius);
                }

                if (!movedToCurrentLocation) {
                    googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 17f));
                    movedToCurrentLocation = true;
                }
            }
        });
    }

    // pulse animation uses base radius to avoid exponential growth
    private void startPulseAnimation(Circle circle, double baseRadius) {
        if (circle == null) return;
        stopPulseAnimation();
        pulseAnimator = ValueAnimator.ofFloat(0.9f, 1.2f);
        pulseAnimator.setRepeatMode(ValueAnimator.REVERSE);
        pulseAnimator.setRepeatCount(ValueAnimator.INFINITE);
        pulseAnimator.setDuration(1200);
        pulseAnimator.setInterpolator(new LinearInterpolator());
        pulseAnimator.addUpdateListener(animation -> {
            float scale = (float) animation.getAnimatedValue();
            circle.setRadius(baseRadius * scale);
        });
        pulseAnimator.start();
    }

    private void stopPulseAnimation() {
        if (pulseAnimator != null) {
            pulseAnimator.cancel();
            pulseAnimator = null;
        }
    }

    // animate marker movement using ValueAnimator for smooth human-like motion
    private void animateMarkerToPosition(final Marker marker, final LatLng toPosition) {
        if (marker == null) return;
        final LatLng startLatLng = marker.getPosition();
        final long duration = 1000; // 1 second animation

        ValueAnimator animator = ValueAnimator.ofFloat(0, 1);
        animator.setDuration(duration);
        animator.setInterpolator(new LinearInterpolator());
        animator.addUpdateListener(valueAnimator -> {
            float fraction = valueAnimator.getAnimatedFraction();
            double lat = (toPosition.latitude - startLatLng.latitude) * fraction + startLatLng.latitude;
            double lng = (toPosition.longitude - startLatLng.longitude) * fraction + startLatLng.longitude;
            marker.setPosition(new LatLng(lat, lng));
        });
        animator.start();
    }

    // smoothly animate marker rotation to target bearing (shortest path)
    private void animateMarkerRotation(final Marker marker, float toRotation) {
        if (marker == null) return;
        float start = marker.getRotation();
        // normalize to [0,360)
        float normalizedStart = ((start % 360) + 360) % 360;
        float normalizedTo = ((toRotation % 360) + 360) % 360;
        float delta = normalizedTo - normalizedStart;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        final float finalTo = normalizedStart + delta;

        ValueAnimator animator = ValueAnimator.ofFloat(0f, 1f);
        animator.setDuration(500);
        animator.setInterpolator(new LinearInterpolator());
        animator.addUpdateListener(a -> {
            float frac = a.getAnimatedFraction();
            float rot = normalizedStart + (finalTo - normalizedStart) * frac;
            marker.setRotation(rot);
        });
        animator.start();
    }

    private void stopLocationUpdates() {
        if (locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
        stopPulseAnimation();
    }

    // Forward lifecycle events to the MapView
    @Override
    public void onResume() {
        super.onResume();
        if (mapView != null) mapView.onResume();
        // resume pulse animation if needed (it will be restarted by next location update)
    }

    @Override
    public void onPause() {
        if (mapView != null) mapView.onPause();
        stopLocationUpdates();
        super.onPause();
    }

    @Override
    public void onDestroyView() {
        if (mapView != null) mapView.onDestroy();
        stopLocationUpdates();
        super.onDestroyView();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        if (mapView != null) mapView.onLowMemory();
    }

    @Override
    public void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (mapView != null) mapView.onSaveInstanceState(outState);
    }
}
