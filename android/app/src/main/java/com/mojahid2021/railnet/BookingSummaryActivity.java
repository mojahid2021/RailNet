package com.mojahid2021.railnet;

import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import okhttp3.MediaType;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookingSummaryActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_summary);

        TextView tvSummary = findViewById(R.id.tvSummary);
        Button btnConfirm = findViewById(R.id.btnConfirm);
        Button btnDone = findViewById(R.id.btnDone);
        android.view.View progressBooking = findViewById(R.id.progressBooking);
        android.view.View cardResult = findViewById(R.id.cardResult);
        android.view.View cardPassenger = findViewById(R.id.cardPassenger);
        android.view.View cardJourney = findViewById(R.id.cardJourney);
        android.widget.TextView tvJourneyTrain = findViewById(R.id.tvJourneyTrain);
        android.widget.TextView tvJourneyRoute = findViewById(R.id.tvJourneyRoute);
        android.widget.TextView tvJourneySchedule = findViewById(R.id.tvJourneySchedule);
        android.widget.TextView tvSeatInfo = findViewById(R.id.tvSeatInfo);
        android.widget.TextView tvPriceView = findViewById(R.id.tvPrice);
        Button btnPay = findViewById(R.id.btnPay);

        // Read extras
        final int trainScheduleId = getIntent().getIntExtra("trainScheduleId", -1);
        final int compartmentId = getIntent().getIntExtra("compartmentId", -1);
        final String seatNumber = getIntent().getStringExtra("seatNumber");
        final String fromStationId = getIntent().getStringExtra("fromStationId");
        final String toStationId = getIntent().getStringExtra("toStationId");
        final int fromIdInt;
        final int toIdInt;
        int tmpFrom = -1, tmpTo = -1;
        try { if (fromStationId != null) tmpFrom = Integer.parseInt(fromStationId); } catch (NumberFormatException ignored) {}
        try { if (toStationId != null) tmpTo = Integer.parseInt(toStationId); } catch (NumberFormatException ignored) {}
        fromIdInt = tmpFrom; toIdInt = tmpTo;

        // Hook up inputs
        final android.widget.EditText etName = findViewById(R.id.etName);
        final android.widget.EditText etAge = findViewById(R.id.etAge);
        final android.widget.Spinner spinnerGender = findViewById(R.id.spinnerGender);

        // Populate spinner
        String[] genders = new String[]{"Male", "Female", "Other"};
        android.widget.ArrayAdapter<String> genderAdapter = new android.widget.ArrayAdapter<>(this, android.R.layout.simple_spinner_item, genders);
        genderAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerGender.setAdapter(genderAdapter);

        // Prefill if we had seat/travel info
        // Prefill seat & price UI; journey fields will show layout placeholders unless real data provided
        String seatLabel = "Seat: " + (seatNumber != null ? seatNumber : "-") + " • Compartment: " + compartmentId;
        tvSeatInfo.setText(seatLabel);
        tvPriceView.setText(getString(R.string.amount_placeholder));
        String baseSummary = "";

        btnConfirm.setOnClickListener(v -> {
            String passengerName = etName.getText() != null ? etName.getText().toString().trim() : "";
            String ageStr = etAge.getText() != null ? etAge.getText().toString().trim() : "";
            int passengerAge = -1;
            try { passengerAge = Integer.parseInt(ageStr); } catch (NumberFormatException ignored) {}
            String passengerGender = (String) spinnerGender.getSelectedItem();

            if (passengerName.isEmpty() || passengerAge <= 0) {
                tvSummary.setText(getString(R.string.please_enter_valid_passenger));
                return;
            }

            // build JSON body
            Gson g = new Gson();
            String jsonReq = g.toJson(new TicketRequest(trainScheduleId, fromIdInt, toIdInt, compartmentId, seatNumber, passengerName, passengerAge, passengerGender));
            RequestBody body = RequestBody.create(jsonReq, MediaType.parse("application/json"));
            ApiService api = ApiClient.getRetrofit(this).create(ApiService.class);
            Call<ResponseBody> call = api.bookTicket(body);
            // show temporary message & lock UI
            progressBooking.setVisibility(android.view.View.VISIBLE);
            btnConfirm.setEnabled(false);
            tvSummary.setText(getString(R.string.booking_progress_passenger, passengerName));
            call.enqueue(new Callback<ResponseBody>() {
                @Override
                public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                    if (response.isSuccessful()) {
                        ResponseBody rb = response.body();
                        if (rb == null) {
                            tvSummary.setText(getString(R.string.booking_failed_empty));
                            return;
                        }
                        try (ResponseBody bodyRes = rb) {
                            String resp = bodyRes.string();
                            // parse booking response JSON into BookingResponse (use instance parser for older Gson)
                            JsonElement je = new JsonParser().parse(resp);
                            BookingResponse br = g.fromJson(je, BookingResponse.class);
                            // build display
                            StringBuilder out = new StringBuilder();
                            String bookedTicketId = null;
                            if (br.ticket != null) {
                                bookedTicketId = br.ticket.ticketId;
                                out.append("Ticket ID: ").append(br.ticket.ticketId).append("\nStatus: ").append(br.ticket.status).append("\nPayment: ").append(br.ticket.paymentStatus).append("\nExpires: ").append(br.ticket.expiresAt).append("\n\n");
                            }
                            if (br.passenger != null) {
                                out.append("Passenger: ").append(br.passenger.name).append(" (" + br.passenger.age + ") ").append(br.passenger.gender).append("\n");
                            }
                            if (br.journey != null) {
                                if (br.journey.train != null) out.append("Train: ").append(br.journey.train.name).append(" (").append(br.journey.train.number).append(")\n");
                                if (br.journey.route != null) out.append("Route: ").append(br.journey.route.from).append(" → ").append(br.journey.route.to).append("\n");
                                if (br.journey.schedule != null) out.append("Date: ").append(br.journey.schedule.date).append(" Departs: ").append(br.journey.schedule.departureTime).append("\n");
                            }
                            if (br.seat != null) out.append("Seat: ").append(br.seat.number).append(" (" + br.seat.compartment + ") " + br.seat.clazz).append("\n");
                            if (br.pricing != null) out.append("Amount: ").append(br.pricing.amount).append(" ").append(br.pricing.currency).append("\n");
                            // show result card and reveal Pay button (store ticket id on the button tag)
                            cardResult.setVisibility(android.view.View.VISIBLE);
                            cardPassenger.setVisibility(android.view.View.GONE);
                            tvSummary.setText(out.toString());
                            if (bookedTicketId != null) {
                                btnPay.setTag(bookedTicketId);
                                btnPay.setVisibility(android.view.View.VISIBLE);
                            }
                            btnConfirm.setVisibility(android.view.View.GONE);
                            progressBooking.setVisibility(android.view.View.GONE);
                        } catch (Exception ex) {
                            Log.e("Booking", "parse error", ex);
                            tvSummary.setText(getString(R.string.booking_response_error));
                            progressBooking.setVisibility(android.view.View.GONE);
                            btnConfirm.setEnabled(true);
                        }
                    } else {
                        tvSummary.setText(getString(R.string.booking_failed_code, response.code()));
                        progressBooking.setVisibility(android.view.View.GONE);
                        btnConfirm.setEnabled(true);
                    }
                }

                @Override
                public void onFailure(Call<ResponseBody> call, Throwable t) {
                    Log.e("Booking", "error", t);
                    tvSummary.setText(getString(R.string.network_error_booking, t.getMessage()));
                    progressBooking.setVisibility(android.view.View.GONE);
                    btnConfirm.setEnabled(true);
                }
            });
        });

        btnDone.setOnClickListener(v -> finish());
        // Pay button behavior: simulate payment then show success and Done
        btnPay.setOnClickListener(v -> {
            Object tag = v.getTag();
            if (!(tag instanceof String)) return;
            String ticketIdToPay = (String) tag;
            // disable and show progress
            btnPay.setEnabled(false);
            progressBooking.setVisibility(android.view.View.VISIBLE);
            tvSummary.setText(getString(R.string.payment_in_progress));

            // build payment initiate body
            Gson gson = new Gson();
            String json = gson.toJson(new java.util.HashMap<String, String>() {{ put("ticketId", ticketIdToPay); }});
            RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
            ApiService api = ApiClient.getRetrofit(this).create(ApiService.class);
            // Debug: log request body and base URL to help diagnose failures
            try { Log.d("Payment", "initiatePayment request json=" + json + ", baseUrl=" + ApiClient.getRetrofit(BookingSummaryActivity.this).baseUrl()); } catch (Exception _e) { /* ignore */ }
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put("ticketId", ticketIdToPay);
            Call<com.mojahid2021.railnet.network.PaymentInitiateResponse> call = api.initiatePayment(map);
            call.enqueue(new Callback<com.mojahid2021.railnet.network.PaymentInitiateResponse>() {
                @Override
                public void onResponse(Call<com.mojahid2021.railnet.network.PaymentInitiateResponse> call, retrofit2.Response<com.mojahid2021.railnet.network.PaymentInitiateResponse> response) {
                    progressBooking.setVisibility(android.view.View.GONE);
                    if (response.isSuccessful()) {
                        com.mojahid2021.railnet.network.PaymentInitiateResponse pr = response.body();
                        if (pr == null) {
                            Log.e("Payment", "initiatePayment: parsed response is null");
                            tvSummary.setText(getString(R.string.booking_failed_empty));
                            btnPay.setEnabled(true);
                            return;
                        }
                        Log.d("Payment", "parsed initiatePayment: paymentUrl=" + pr.paymentUrl + ", transactionId=" + pr.transactionId);
                        if (pr.paymentUrl != null && !pr.paymentUrl.isEmpty()) {
                            android.content.Intent intent = new android.content.Intent(BookingSummaryActivity.this, WebviewActivity.class);
                            intent.putExtra("url", pr.paymentUrl);
                            startActivity(intent);
                        } else {
                            Log.e("Payment", "initiatePayment: missing paymentUrl in parsed response");
                            tvSummary.setText("Payment initiation failed");
                            btnPay.setEnabled(true);
                        }
                    } else {
                        // Try to read error body for debugging
                        String errBody = null;
                        try {
                            if (response.errorBody() != null) errBody = response.errorBody().string();
                        } catch (Exception e) {
                            Log.w("Payment", "failed to read errorBody", e);
                        }
                        Log.e("Payment", "initiatePayment failed: code=" + response.code() + ", errorBody=" + errBody);
                        tvSummary.setText("Payment initiation failed: " + response.code());
                        btnPay.setEnabled(true);
                    }
                }

                @Override
                public void onFailure(Call<com.mojahid2021.railnet.network.PaymentInitiateResponse> call, Throwable t) {
                    progressBooking.setVisibility(android.view.View.GONE);
                    Log.e("Payment", "initiatePayment network error", t);
                    tvSummary.setText(getString(R.string.network_error_booking, t.getMessage()));
                    btnPay.setEnabled(true);
                }
            });
        });
    }

    static class TicketRequest {
        int trainScheduleId;
        int fromStationId;
        int toStationId;
        int compartmentId;
        String seatNumber;
        String passengerName;
        int passengerAge;
        String passengerGender;

        public TicketRequest(int trainScheduleId, int fromStationId, int toStationId, int compartmentId, String seatNumber, String passengerName, int passengerAge, String passengerGender) {
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

    // BookingResponse model matching your provided JSON
    static class BookingResponse {
        Ticket ticket;
        Passenger passenger;
        Journey journey;
        Seat seat;
        Pricing pricing;
    }

    static class Ticket { public int id; public String ticketId; public String status; public String paymentStatus; public String expiresAt; public String createdAt; }
    static class Passenger { public String name; public int age; public String gender; }
    static class Journey { public TrainShort train; public RouteShort route; public Schedule schedule; }
    static class TrainShort { public String name; public String number; }
    static class RouteShort { public String from; public String to; }
    static class Schedule { public String date; public String departureTime; }
    static class Seat { public String number; public String compartment; public String clazz; }
    static class Pricing { public double amount; public String currency; }
}
