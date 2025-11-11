package com.mojahid2021.railnet.map;

import android.Manifest;
import android.animation.ValueAnimator;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.location.Location;
import android.os.Bundle;
import android.os.Looper;
import android.view.View;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import android.util.TypedValue;
import android.view.LayoutInflater;
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
import com.google.android.gms.maps.model.MapStyleOptions;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import android.util.Log;
import java.nio.charset.StandardCharsets;

import com.mojahid2021.railnet.R;

import java.util.HashMap;
import java.util.Map;

public class MapFragment extends Fragment {
    private MapView mapView;
    private GoogleMap googleMap;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Marker currentLocationMarker;
    private Circle accuracyCircle;
    private boolean movedToCurrentLocation = false;
    // last known location used to compute bearing fallback
    private Location lastLocation = null;

    // keep pulse animator reference to cancel when fragment pauses/destroys
    private ValueAnimator pulseAnimator;

    // desired base marker size in dp (reasonable default)
    private static final float MARKER_DP_SIZE = 28f;

    // caching last used dp to avoid recreating icon too often
    private int lastMarkerDp = -1;

    // cache generated descriptors by dp size
    private final Map<Integer, BitmapDescriptor> pointerCache = new HashMap<>();

    // whether the map should follow the user's live location
    private boolean followUser = true;

    private ImageButton btnMyLocation;

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
        btnMyLocation = view.findViewById(R.id.btn_my_location);
        btnMyLocation.setVisibility(View.GONE);

        btnMyLocation.setOnClickListener(v -> {
            // On recenter: re-enable follow mode and center to current marker
            followUser = true;
            btnMyLocation.setVisibility(View.GONE);
            if (currentLocationMarker != null && googleMap != null) {
                googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(currentLocationMarker.getPosition(), 17f));
            }
        });

        mapView.onCreate(savedInstanceState);
        mapView.getMapAsync(map -> {
            googleMap = map;

            // Apply custom map style. Try raw resource first, then fall back to assets.
            boolean styleApplied = false;
            try {
                try {
                    MapStyleOptions rawStyle = MapStyleOptions.loadRawResourceStyle(requireContext(), R.raw.map_style);
                    if (googleMap.setMapStyle(rawStyle)) {
                        styleApplied = true;
                        Log.d("MapFragment", "Applied map style from raw resource");
                    } else {
                        Log.d("MapFragment", "Raw resource style parsed but setMapStyle returned false - will try reading raw text");
                        // Extra diagnostic: read the raw resource as text and try applying it directly
                        try (InputStream ris = requireContext().getResources().openRawResource(R.raw.map_style)) {
                            ByteArrayOutputStream rbaos = new ByteArrayOutputStream();
                            byte[] rbuf = new byte[1024];
                            int rlen;
                            while ((rlen = ris.read(rbuf)) != -1) {
                                rbaos.write(rbuf, 0, rlen);
                            }
                            String rawJson = new String(rbaos.toByteArray(), StandardCharsets.UTF_8);
                            boolean successFromRawText = googleMap.setMapStyle(new MapStyleOptions(rawJson));
                            Log.d("MapFragment", "Attempted setMapStyle from raw resource text, success=" + successFromRawText);
                            if (!successFromRawText) {
                                Log.d("MapFragment", "Raw resource JSON (first 1000 chars): \n" + (rawJson.length() > 1000 ? rawJson.substring(0, 1000) : rawJson));
                            } else {
                                styleApplied = true;
                            }
                        } catch (Exception exReadRaw) {
                            Log.w("MapFragment", "Failed to read/parse raw resource as text: " + Log.getStackTraceString(exReadRaw));
                        }
                    }
                } catch (Exception exRaw) {
                    Log.w("MapFragment", "Raw resource style load failed, will try assets: " + Log.getStackTraceString(exRaw));
                }

                if (!styleApplied) {
                    // fallback: try loading from assets/map_style.json
                    InputStream is = null;
                    try {
                        is = requireContext().getAssets().open("map_style.json");
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        byte[] buffer = new byte[1024];
                        int len;
                        while ((len = is.read(buffer)) != -1) {
                            baos.write(buffer, 0, len);
                        }
                        String json = new String(baos.toByteArray(), StandardCharsets.UTF_8);
                        boolean success = googleMap.setMapStyle(new MapStyleOptions(json));
                        if (success) {
                            styleApplied = true;
                            Log.d("MapFragment", "Map style applied successfully from assets");
                        } else {
                            Log.e("MapFragment", "Failed to apply map style from assets — setMapStyle returned false");
                            Log.d("MapFragment", "Style JSON (first 600 chars): " + (json.length() > 600 ? json.substring(0, 600) : json));
                        }
                    } finally {
                        if (is != null) try { is.close(); } catch (Exception ignore) {}
                    }
                }

                if (!styleApplied) {
                    Log.e("MapFragment", "No map style applied (both raw and assets attempts failed)");
                    if (isAdded()) {
                        Toast.makeText(requireContext(), "Map style failed to load. Check logs for details.", Toast.LENGTH_SHORT).show();
                    }
                }

            } catch (Exception e) {
                Log.e("MapFragment", "Error loading map style", e);
            }

            // If user moves the camera (gestures), show recenter button and stop auto-follow
            googleMap.setOnCameraMoveStartedListener(reason -> {
                if (reason == GoogleMap.OnCameraMoveStartedListener.REASON_GESTURE) {
                    // user initiated move; stop following
                    followUser = false;
                    if (btnMyLocation != null) btnMyLocation.setVisibility(View.VISIBLE);
                }
            });

            // update marker size on camera idle so the icon scales nicely with zoom
            googleMap.setOnCameraIdleListener(() -> {
                if (currentLocationMarker == null || googleMap == null) return;
                float zoom = googleMap.getCameraPosition().zoom;
                int dp = getScaledDpForZoom(zoom);
                if (dp != lastMarkerDp) {
                    BitmapDescriptor icon = getPointerDescriptor(requireContext(), dp);
                    currentLocationMarker.setIcon(icon);
                    lastMarkerDp = dp;
                }
            });

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

    // Wrapper: get from cache or create and cache a pointer descriptor for dp size
    private BitmapDescriptor getPointerDescriptor(Context context, int dpSize) {
        BitmapDescriptor d = pointerCache.get(dpSize);
        if (d != null) return d;
        BitmapDescriptor created = createPointerDescriptor(context, dpSize);
        pointerCache.put(dpSize, created);
        return created;
    }

    // Create a mannequin/human-like BitmapDescriptor (head + torso + limbs + subtle shadow)
    private BitmapDescriptor createPointerDescriptor(Context context, int dpSize) {
        if (dpSize <= 0) dpSize = Math.round(MARKER_DP_SIZE);
        int px = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dpSize, context.getResources().getDisplayMetrics());

        Bitmap bitmap = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        // Soft shadow under feet
        Paint shadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        shadowPaint.setColor(0x33000000);
        float cx = px * 0.5f;
        float cy = px * 0.88f;
        float rx = px * 0.30f;
        float ry = px * 0.09f;
        RectF shadowOval = new RectF(cx - rx, cy - ry, cx + rx, cy + ry);
        canvas.drawOval(shadowOval, shadowPaint);

        // Mannequin proportions
        float headCx = px * 0.5f;
        float headCy = px * 0.26f;
        float headR = px * 0.14f;

        float torsoTop = headCy + headR * 0.9f;
        float torsoBottom = px * 0.6f;
        float torsoW = px * 0.34f;
        float torsoLeft = headCx - torsoW / 2f;
        float torsoRight = headCx + torsoW / 2f;
        float torsoRadius = px * 0.06f;

        // Cobalt-blue palette optimized for white map backgrounds
        int topColor = 0xFF1E88E5;    // Cobalt / Blue 600 (brighter)
        int bottomColor = 0xFF0D47A1; // Deep navy for contrast
        int outlineColor = 0xFF062F4A; // Dark outline for crisp edges on white

        // prepare stroke paint for thin outline
        Paint strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        strokePaint.setStyle(Paint.Style.STROKE);
        strokePaint.setColor(outlineColor);
        strokePaint.setStrokeWidth(Math.max(1f, px * 0.04f));

        // Head gradient
        LinearGradient headGrad = new LinearGradient(0, headCy - headR, 0, headCy + headR, topColor, bottomColor, Shader.TileMode.CLAMP);
        Paint headPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        headPaint.setShader(headGrad);
        canvas.drawCircle(headCx, headCy, headR, headPaint);
        // outline head
        canvas.drawCircle(headCx, headCy, headR, strokePaint);

        // Subtle highlight on head
        Paint hl = new Paint(Paint.ANTI_ALIAS_FLAG);
        hl.setColor(0x33FFFFFF);
        canvas.drawCircle(headCx - headR * 0.35f, headCy - headR * 0.45f, headR * 0.45f, hl);

        // Torso gradient
        LinearGradient torsoGrad = new LinearGradient(0, torsoTop, 0, torsoBottom, topColor, bottomColor, Shader.TileMode.CLAMP);
        Paint torsoPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        torsoPaint.setShader(torsoGrad);

        RectF torsoRect = new RectF(torsoLeft, torsoTop, torsoRight, torsoBottom);
        canvas.drawRoundRect(torsoRect, torsoRadius, torsoRadius, torsoPaint);
        // outline torso for contrast on white maps
        canvas.drawRoundRect(torsoRect, torsoRadius, torsoRadius, strokePaint);

        // Arms (simple rounded rectangles) — left and right
        float armW = torsoW * 0.28f;
        float armH = (torsoBottom - torsoTop) * 0.9f;
        float armTop = torsoTop + (torsoBottom - torsoTop) * 0.05f;
        RectF leftArm = new RectF(torsoLeft - armW * 0.9f, armTop, torsoLeft + armW * 0.1f, armTop + armH);
        RectF rightArm = new RectF(torsoRight - armW * 0.1f, armTop, torsoRight + armW * 0.9f, armTop + armH);
        canvas.drawRoundRect(leftArm, armW * 0.5f, armW * 0.5f, torsoPaint);
        canvas.drawRoundRect(rightArm, armW * 0.5f, armW * 0.5f, torsoPaint);
        canvas.drawRoundRect(leftArm, armW * 0.5f, armW * 0.5f, strokePaint);
        canvas.drawRoundRect(rightArm, armW * 0.5f, armW * 0.5f, strokePaint);

        // Legs (two narrow rounded rectangles) from torsoBottom down to near bottom
        float legW = torsoW * 0.34f;
        float legH = px * 0.28f;
        RectF leftLeg = new RectF(headCx - legW - legW * 0.15f, torsoBottom, headCx - legW * 0.15f, torsoBottom + legH);
        RectF rightLeg = new RectF(headCx + legW * 0.15f, torsoBottom, headCx + legW + legW * 0.15f, torsoBottom + legH);
        canvas.drawRoundRect(leftLeg, legW * 0.4f, legW * 0.4f, torsoPaint);
        canvas.drawRoundRect(rightLeg, legW * 0.4f, legW * 0.4f, torsoPaint);
        canvas.drawRoundRect(leftLeg, legW * 0.4f, legW * 0.4f, strokePaint);
        canvas.drawRoundRect(rightLeg, legW * 0.4f, legW * 0.4f, strokePaint);

        // Small glossy stripe on torso for extra depth
        Paint stripe = new Paint(Paint.ANTI_ALIAS_FLAG);
        stripe.setColor(0x22FFFFFF);
        float sx = headCx - torsoW * 0.15f;
        RectF stripeRect = new RectF(sx, torsoTop + (torsoBottom - torsoTop) * 0.15f, sx + torsoW * 0.12f, torsoTop + (torsoBottom - torsoTop) * 0.6f);
        canvas.drawRoundRect(stripeRect, torsoRadius * 0.5f, torsoRadius * 0.5f, stripe);

        // Tail (path) — simple triangular shape for pointer
        Paint tailPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        tailPaint.setColor(bottomColor);
        tailPaint.setStyle(Paint.Style.FILL);

        // Triangle path: tip at bottom center, base corners at torso bottom corners
        // place tip very close to bitmap bottom so anchor(0.5,1.0) matches tip position
        float tailTipY = px - Math.max(1f, px * 0.03f);
        float tailLeftX = headCx - legW * 0.5f;
        float tailRightX = headCx + legW * 0.5f;

        // Slightly rounded triangular path for tail
        android.graphics.Path tail = new android.graphics.Path();
        tail.moveTo(headCx, tailTipY);
        tail.lineTo(tailLeftX, torsoBottom);
        tail.lineTo(tailRightX, torsoBottom);
        tail.close();

        // Tail gradient: deep navy at base to cobalt at tip for contrast
        LinearGradient lgTail = new LinearGradient(0, torsoBottom, 0, tailTipY, bottomColor, topColor, Shader.TileMode.CLAMP);
        tailPaint.setShader(lgTail);
        canvas.drawPath(tail, tailPaint);

        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    // compute bearing in degrees from 'from' to 'to' (0..360, clockwise from north)
    private float bearingBetween(LatLng from, LatLng to) {
        double lat1 = Math.toRadians(from.latitude);
        double lon1 = Math.toRadians(from.longitude);
        double lat2 = Math.toRadians(to.latitude);
        double lon2 = Math.toRadians(to.longitude);
        double dLon = lon2 - lon1;
        double y = Math.sin(dLon) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        double brng = Math.toDegrees(Math.atan2(y, x));
        brng = (brng + 360.0) % 360.0;
        return (float) brng;
    }

    // Decide marker dp size based on zoom (you can tweak these thresholds)
    private int getScaledDpForZoom(float zoom) {
        // zoom typically ranges roughly 2..21; adjust factors to taste
        if (zoom < 12f) return Math.round(MARKER_DP_SIZE * 0.7f);
        if (zoom < 15f) return Math.round(MARKER_DP_SIZE * 0.85f);
        return Math.round(MARKER_DP_SIZE);
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
                            int dp = getScaledDpForZoom(googleMap.getCameraPosition().zoom);
                            BitmapDescriptor icon = getPointerDescriptor(requireContext(), dp);
                            MarkerOptions opts = new MarkerOptions().position(latLng).anchor(0.5f, 1.0f).icon(icon);
                            currentLocationMarker = googleMap.addMarker(opts);
                            // make marker flat so rotation works
                            if (currentLocationMarker != null) currentLocationMarker.setFlat(true);
                            lastMarkerDp = dp;
                            // set initial rotation if available
                            if (location.hasBearing()) currentLocationMarker.setRotation(location.getBearing());
                        } else {
                            // animate marker position smoothly
                            animateMarkerToPosition(currentLocationMarker, latLng);
                            float bearing;
                            // prefer device-provided bearing when moving at speed
                            if (location.hasBearing() && location.getSpeed() > 0.5f) {
                                bearing = location.getBearing();
                            } else if (lastLocation != null) {
                                bearing = bearingBetween(new LatLng(lastLocation.getLatitude(), lastLocation.getLongitude()), latLng);
                            } else {
                                bearing = 0f;
                            }
                            animateMarkerRotation(currentLocationMarker, bearing);
                        }

                        // Always follow the user — auto-center
                        if (followUser) {
                            if (!movedToCurrentLocation) {
                                googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 17f));
                                movedToCurrentLocation = true;
                            } else {
                                // small camera movement to follow user smoothly
                                googleMap.animateCamera(CameraUpdateFactory.newLatLng(latLng));
                            }
                        }

                        // store lastLocation for next bearing calculation
                        lastLocation = location;
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
                    int dp = getScaledDpForZoom(googleMap.getCameraPosition().zoom);
                    BitmapDescriptor icon = getPointerDescriptor(requireContext(), dp);
                    MarkerOptions opts = new MarkerOptions().position(latLng).anchor(0.5f, 1.0f).icon(icon);
                    currentLocationMarker = googleMap.addMarker(opts);
                    if (currentLocationMarker != null) currentLocationMarker.setFlat(true);
                    lastMarkerDp = dp;
                    if (location.hasBearing()) currentLocationMarker.setRotation(location.getBearing());
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

                // set lastLocation from last known
                lastLocation = location;

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
        // clear cached pointer descriptors to free memory
        pointerCache.clear();
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
