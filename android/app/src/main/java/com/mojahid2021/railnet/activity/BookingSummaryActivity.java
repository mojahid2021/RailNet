package com.mojahid2021.railnet.activity;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import java.util.HashMap;
import java.util.Map;

import okhttp3.MediaType;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * BookingSummaryActivity handles the final step of ticket booking process.
 * Displays passenger details form, processes booking, and initiates payment.
 */
public class BookingSummaryActivity extends AppCompatActivity {

    // Constants
    private static final String TAG = "BookingSummaryActivity";
    private static final String[] GENDERS = {"Male", "Female", "Other"};
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json");

    // UI Components
    private EditText etName;
    private EditText etAge;
    private AutoCompleteTextView spinnerGender;
    private Button btnConfirm;
    private Button btnDone;
    private Button btnPay;
    private View progressBooking;
    private View cardResult;
    private View cardPassenger;
    private TextView tvPrice;
    private TextView tvError;
    private TextView tvTicketId;
    private TextView tvTicketStatus;
    private TextView tvTicketExpiry;
    private TextView tvPassengerName;
    private TextView tvPassengerAge;
    private TextView tvPassengerGender;

    // Data
    private int trainScheduleId;
    private int compartmentId;
    private String seatNumber;
    private int fromStationId;
    private int toStationId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_summary);

        setupWindow();
        initializeViews();
        extractIntentData();
        setupGenderDropdown();
        setupClickListeners();
        updateUI();
    }

    @Override
    protected void onResume() {
        super.onResume();
        handlePaymentReturn();
    }

    /**
     * Sets up edge-to-edge display and status bar appearance
     */
    private void setupWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

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
    }

    /**
     * Initializes all view references
     */
    private void initializeViews() {
        etName = findViewById(R.id.etName);
        etAge = findViewById(R.id.etAge);
        spinnerGender = findViewById(R.id.spinnerGender);
        btnConfirm = findViewById(R.id.btnConfirm);
        btnDone = findViewById(R.id.btnDone);
        btnPay = findViewById(R.id.btnPay);
        progressBooking = findViewById(R.id.progressBooking);
        cardResult = findViewById(R.id.cardResult);
        cardPassenger = findViewById(R.id.cardPassenger);
        tvPrice = findViewById(R.id.tvPrice);
        tvError = findViewById(R.id.tvError);
        tvTicketId = findViewById(R.id.tvTicketId);
        tvTicketStatus = findViewById(R.id.tvTicketStatus);
        tvTicketExpiry = findViewById(R.id.tvTicketExpiry);
        tvPassengerName = findViewById(R.id.tvPassengerName);
        tvPassengerAge = findViewById(R.id.tvPassengerAge);
        tvPassengerGender = findViewById(R.id.tvPassengerGender);
    }

    /**
     * Extracts data from intent extras
     */
    private void extractIntentData() {
        trainScheduleId = getIntent().getIntExtra("trainScheduleId", -1);
        compartmentId = getIntent().getIntExtra("compartmentId", -1);
        seatNumber = getIntent().getStringExtra("seatNumber");
        fromStationId = parseIntSafely(getIntent().getStringExtra("fromStationId"));
        toStationId = parseIntSafely(getIntent().getStringExtra("toStationId"));
    }

    /**
     * Safely parses string to int, returns -1 on failure
     */
    private int parseIntSafely(String value) {
        try {
            return value != null ? Integer.parseInt(value) : -1;
        } catch (NumberFormatException e) {
            Log.w(TAG, "Failed to parse int: " + value, e);
            return -1;
        }
    }

    /**
     * Sets up the gender dropdown with predefined options
     */
    private void setupGenderDropdown() {
        android.widget.ArrayAdapter<String> adapter = new android.widget.ArrayAdapter<>(
            this, android.R.layout.simple_dropdown_item_1line, GENDERS);
        spinnerGender.setAdapter(adapter);
    }

    /**
     * Sets up all click listeners
     */
    private void setupClickListeners() {
        btnConfirm.setOnClickListener(v -> handleBookingConfirmation());
        btnDone.setOnClickListener(v -> finish());
        btnPay.setOnClickListener(v -> initiatePayment());
    }

    /**
     * Updates initial UI state
     */
    private void updateUI() {
        tvPrice.setText(getString(R.string.amount_placeholder));
    }

    /**
     * Handles booking confirmation button click
     */
    private void handleBookingConfirmation() {
        PassengerData passengerData = collectPassengerData();
        if (!isValidPassengerData(passengerData)) {
            showValidationError();
            return;
        }

        logBookingRequest(passengerData);
        performBooking(passengerData);
    }

    /**
     * Collects passenger data from input fields
     */
    private PassengerData collectPassengerData() {
        String name = etName.getText() != null ? etName.getText().toString().trim() : "";
        String ageStr = etAge.getText() != null ? etAge.getText().toString().trim() : "";
        String gender = spinnerGender.getText() != null ? spinnerGender.getText().toString().trim() : "";

        int age = -1;
        try {
            age = Integer.parseInt(ageStr);
        } catch (NumberFormatException ignored) {}

        return new PassengerData(name, age, gender);
    }

    /**
     * Validates passenger data
     */
    private boolean isValidPassengerData(PassengerData data) {
        return !data.name.isEmpty() && data.age > 0;
    }

    /**
     * Shows validation error to user
     */
    private void showValidationError() {
        // TODO: Show proper validation error message
        Log.w(TAG, "Invalid passenger data");
    }

    /**
     * Logs booking request details
     */
    private void logBookingRequest(PassengerData data) {
        Log.d(TAG, String.format("Booking request: name=%s, age=%d, gender=%s, trainScheduleId=%d, compartmentId=%d, seatNumber=%s",
            data.name, data.age, data.gender, trainScheduleId, compartmentId, seatNumber));
    }

    /**
     * Performs the booking API call
     */
    private void performBooking(PassengerData data) {
        showProgress(true);
        btnConfirm.setEnabled(false);

        TicketRequest request = new TicketRequest(trainScheduleId, fromStationId, toStationId,
            compartmentId, seatNumber, data.name, data.age, data.gender);

        Gson gson = new Gson();
        String jsonRequest = gson.toJson(request);
        RequestBody body = RequestBody.create(jsonRequest, JSON_MEDIA_TYPE);

        ApiService api = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = api.bookTicket(body);

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                handleBookingResponse(response);
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                handleBookingFailure(t);
            }
        });
    }

    /**
     * Handles booking API response
     */
    private void handleBookingResponse(Response<ResponseBody> response) {
        showProgress(false);
        btnConfirm.setEnabled(true);
        tvError.setVisibility(View.GONE);

        if (response.isSuccessful()) {
            processSuccessfulBooking(response);
        } else {
            handleBookingError(response);
        }
    }

    /**
     * Processes successful booking response
     */
    private void processSuccessfulBooking(Response<ResponseBody> response) {
        try {
            String responseBody = response.body().string();
            Log.d(TAG, "Booking response: " + responseBody);

            Gson gson = new Gson();
            JsonParser parser = new JsonParser();
            JsonElement jsonElement = parser.parse(responseBody);
            BookingResponse bookingResponse = gson.fromJson(jsonElement, BookingResponse.class);

            updateBookingUI(bookingResponse);
            showBookingSuccess(bookingResponse);

        } catch (Exception e) {
            Log.e(TAG, "Parse error", e);
            tvError.setText(getString(R.string.booking_response_error));
            tvError.setVisibility(View.VISIBLE);
        }
    }

    /**
     * Handles booking API error
     */
    private void handleBookingError(Response<ResponseBody> response) {
        Log.d(TAG, "Booking failed with code: " + response.code());
        String errorMessage = getString(R.string.booking_failed_code, response.code());

        try {
            if (response.errorBody() != null) {
                String errorBody = response.errorBody().string();
                Log.d(TAG, "Error body: " + errorBody);
                if (!errorBody.isEmpty()) {
                    errorMessage = "Booking failed: " + errorBody;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to read error body", e);
        }

        tvError.setText(errorMessage);
        tvError.setVisibility(View.VISIBLE);
    }

    /**
     * Handles booking network failure
     */
    private void handleBookingFailure(Throwable t) {
        Log.e(TAG, "Booking network error", t);
        showProgress(false);
        btnConfirm.setEnabled(true);
        tvError.setText(getString(R.string.network_error_booking, t.getMessage()));
        tvError.setVisibility(View.VISIBLE);
    }

    /**
     * Updates UI with booking response data
     */
    private void updateBookingUI(BookingResponse response) {
        if (response.pricing != null) {
            String currency = response.pricing.currency != null ? response.pricing.currency : "৳";
            String priceText = currency + " " + String.format("%.0f", response.pricing.amount);
            tvPrice.setText(priceText);
        }

        if (response.ticket != null) {
            tvTicketId.setText(response.ticket.ticketId != null ? response.ticket.ticketId : "N/A");
            tvTicketStatus.setText(getStatusWithEmoji(response.ticket.status));
            tvTicketExpiry.setText(formatExpiryDate(response.ticket.expiresAt));
        }

        if (response.passenger != null) {
            tvPassengerName.setText(response.passenger.name != null ? response.passenger.name : "N/A");
            tvPassengerAge.setText(String.valueOf(response.passenger.age));
            tvPassengerGender.setText(response.passenger.gender != null ? response.passenger.gender : "N/A");
        }
    }

    /**
     * Shows booking success state
     */
    private void showBookingSuccess(BookingResponse bookingResponse) {
        cardResult.setVisibility(View.VISIBLE);
        cardPassenger.setVisibility(View.GONE);
        btnConfirm.setVisibility(View.GONE);
        progressBooking.setVisibility(View.GONE);

        // Always show Pay button for successful booking
        btnPay.setVisibility(View.VISIBLE);
        // Set tag to ticketId if available, otherwise use id as string
        if (bookingResponse.ticket != null) {
            if (bookingResponse.ticket.ticketId != null && !bookingResponse.ticket.ticketId.isEmpty()) {
                btnPay.setTag(bookingResponse.ticket.ticketId);
            } else {
                btnPay.setTag(String.valueOf(bookingResponse.ticket.id));
            }
        } else {
            btnPay.setTag("UNKNOWN_TICKET_ID");
        }

        // Scroll to bottom to show the Pay button
        ScrollView scrollView = findViewById(R.id.scrollView);
        scrollView.post(() -> scrollView.fullScroll(View.FOCUS_DOWN));
    }

    /**
     * Initiates payment process
     */
    private void initiatePayment() {
        Object tag = btnPay.getTag();
        if (!(tag instanceof String)) return;

        String ticketId = (String) tag;
        showProgress(true);
        btnPay.setEnabled(false);

        Map<String, String> requestMap = new HashMap<>();
        requestMap.put("ticketId", ticketId);

        Gson gson = new Gson();
        String jsonRequest = gson.toJson(requestMap);
        RequestBody body = RequestBody.create(jsonRequest, JSON_MEDIA_TYPE);

        ApiService api = ApiClient.getRetrofit(this).create(ApiService.class);
        Log.d(TAG, "Payment request: " + jsonRequest);

        Call<com.mojahid2021.railnet.network.PaymentInitiateResponse> call = api.initiatePayment(requestMap);
        call.enqueue(new Callback<com.mojahid2021.railnet.network.PaymentInitiateResponse>() {
            @Override
            public void onResponse(Call<com.mojahid2021.railnet.network.PaymentInitiateResponse> call,
                                 Response<com.mojahid2021.railnet.network.PaymentInitiateResponse> response) {
                handlePaymentResponse(response);
            }

            @Override
            public void onFailure(Call<com.mojahid2021.railnet.network.PaymentInitiateResponse> call, Throwable t) {
                handlePaymentFailure(t);
            }
        });
    }

    /**
     * Handles payment API response
     */
    private void handlePaymentResponse(Response<com.mojahid2021.railnet.network.PaymentInitiateResponse> response) {
        showProgress(false);
        btnPay.setEnabled(true);
        tvError.setVisibility(View.GONE);

        if (response.isSuccessful()) {
            com.mojahid2021.railnet.network.PaymentInitiateResponse paymentResponse = response.body();
            if (paymentResponse != null && paymentResponse.paymentUrl != null && !paymentResponse.paymentUrl.isEmpty()) {
                Log.d(TAG, "Payment URL: " + paymentResponse.paymentUrl);
                android.content.Intent intent = new android.content.Intent(this, WebviewActivity.class);
                intent.putExtra("url", paymentResponse.paymentUrl);
                startActivity(intent);
            } else {
                Log.e(TAG, "Missing payment URL in response");
                tvError.setText("Payment initiation failed: Missing payment URL");
                tvError.setVisibility(View.VISIBLE);
            }
        } else {
            handlePaymentError(response);
        }
    }

    /**
     * Handles payment API error
     */
    private void handlePaymentError(Response<com.mojahid2021.railnet.network.PaymentInitiateResponse> response) {
        String errorMessage = "Payment initiation failed: " + response.code();
        try {
            if (response.errorBody() != null) {
                String errorBody = response.errorBody().string();
                Log.w(TAG, "Payment error body: " + errorBody);
                if (errorBody != null && !errorBody.isEmpty()) {
                    errorMessage = "Payment failed: " + errorBody;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to read payment error body", e);
        }
        Log.e(TAG, "Payment failed: " + errorMessage);
        tvError.setText(errorMessage);
        tvError.setVisibility(View.VISIBLE);
    }

    /**
     * Handles payment network failure
     */
    private void handlePaymentFailure(Throwable t) {
        Log.e(TAG, "Payment network error", t);
        showProgress(false);
        btnPay.setEnabled(true);
        tvError.setText(getString(R.string.network_error_booking, t.getMessage()));
        tvError.setVisibility(View.VISIBLE);
    }

    /**
     * Handles return from payment WebView
     */
    private void handlePaymentReturn() {
        if (getIntent().getBooleanExtra("payment_completed", false)) {
            handlePaymentSuccess();
        }
    }

    /**
     * Handles successful payment completion
     */
    private void handlePaymentSuccess() {
        showProgress(false);
        btnPay.setVisibility(View.GONE);
        btnDone.setVisibility(View.VISIBLE);
    }

    /**
     * Shows or hides progress indicator
     */
    private void showProgress(boolean show) {
        progressBooking.setVisibility(show ? View.VISIBLE : View.GONE);
    }

    /**
     * Formats expiry date for display
     */
    private String formatExpiryDate(String expiryString) {
        if (expiryString == null) return "Expiry not set";
        try {
            String datePart = expiryString;
            if (expiryString.contains("T")) {
                datePart = expiryString.split("T")[0];
            }
            String formattedDate = formatDisplayDate(datePart);

            if (expiryString.contains("T")) {
                String timePart = expiryString.split("T")[1];
                if (timePart.length() >= 5) {
                    return formattedDate + " • " + timePart.substring(0, 5);
                }
            }
            return formattedDate;
        } catch (Exception e) {
            Log.w(TAG, "Failed to format expiry: " + expiryString, e);
            return expiryString;
        }
    }

    /**
     * Formats display date
     */
    private String formatDisplayDate(String dateString) {
        if (dateString == null) return "Date not available";
        try {
            String[] parts = dateString.split("-");
            if (parts.length == 3) {
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                int day = Integer.parseInt(parts[2]);

                String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
                return monthNames[month - 1] + " " + day + ", " + year;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse date: " + dateString, e);
        }
        return dateString;
    }

    /**
     * Gets status text with emoji
     */
    private String getStatusWithEmoji(String status) {
        if (status == null) return "Unknown";
        switch (status.toLowerCase()) {
            case "confirmed": return "✅ Confirmed";
            case "pending": return "⏳ Pending";
            case "cancelled": return "❌ Cancelled";
            case "completed": return "🎉 Completed";
            default: return status;
        }
    }

    /**
     * Data class for passenger information
     */
    private static class PassengerData {
        final String name;
        final int age;
        final String gender;

        PassengerData(String name, int age, String gender) {
            this.name = name;
            this.age = age;
            this.gender = gender;
        }
    }

    // API Request/Response Models
    static class TicketRequest {
        int trainScheduleId;
        int fromStationId;
        int toStationId;
        int compartmentId;
        String seatNumber;
        String passengerName;
        int passengerAge;
        String passengerGender;

        TicketRequest(int trainScheduleId, int fromStationId, int toStationId, int compartmentId,
                     String seatNumber, String passengerName, int passengerAge, String passengerGender) {
            this.trainScheduleId = trainScheduleId;
            this.fromStationId = fromStationId;
            this.toStationId = toStationId;
            this.compartmentId = compartmentId;
            this.seatNumber = seatNumber;
            this.passengerName = passengerName;
            this.passengerAge = passengerAge;
            this.passengerGender = passengerGender;
        }
    }

    static class BookingResponse {
        Ticket ticket;
        Passenger passenger;
        Journey journey;
        Seat seat;
        Pricing pricing;
    }

    static class Ticket {
        public int id;
        public String ticketId;
        public String status;
        public String paymentStatus;
        public String expiresAt;
        public String createdAt;
    }

    static class Passenger {
        public String name;
        public int age;
        public String gender;
    }

    static class Journey {
        public TrainShort train;
        public RouteShort route;
        public Schedule schedule;
    }

    static class TrainShort {
        public String name;
        public String number;
    }

    static class RouteShort {
        public String from;
        public String to;
    }

    static class Schedule {
        public String date;
        public String departureTime;
    }

    static class Seat {
        public String number;
        public String compartment;
        public String clazz;
    }

    static class Pricing {
        public double amount;
        public String currency;
    }
}
