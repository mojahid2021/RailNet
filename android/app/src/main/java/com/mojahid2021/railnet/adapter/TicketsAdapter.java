package com.mojahid2021.railnet.adapter;

import static android.content.ContentValues.TAG;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.model.UserTicket;
import com.mojahid2021.railnet.network.ApiClient;
import com.mojahid2021.railnet.network.ApiService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Simple adapter to show a user's tickets in a RecyclerView.
 * Designed to be easy to read for beginners.
 */
public class TicketsAdapter extends RecyclerView.Adapter<TicketsAdapter.VH> {

    private final List<UserTicket> items = new ArrayList<>();

    public void setItems(List<UserTicket> list) {
        items.clear();
        if (list != null) items.addAll(list);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ticket, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        UserTicket ut = items.get(position);
        if (ut == null) return;

        // Bind ticket ID and status with color coding
        if (ut.ticket != null) {
            holder.tvTicketId.setText(ut.ticket.ticketId != null ? ut.ticket.ticketId : "N/A");
            String status = ut.ticket.status != null ? ut.ticket.status : "Unknown";
            holder.tvStatus.setText(getStatusWithEmoji(status));
            holder.tvStatus.setTextColor(getStatusColor(status));
        } else {
            holder.tvStatus.setText("Unknown");
            holder.tvStatus.setTextColor(android.graphics.Color.GRAY);
        }

        // Bind payment status with color coding
        if (ut.ticket != null && ut.ticket.paymentStatus != null) {
            String paymentStatus = ut.ticket.paymentStatus;
            holder.tvPaymentStatus.setText(getPaymentStatusText(paymentStatus));
            holder.tvPaymentStatus.setTextColor(getPaymentStatusColor(paymentStatus));
        } else {
            holder.tvPaymentStatus.setText("Unknown");
            holder.tvPaymentStatus.setTextColor(android.graphics.Color.GRAY);
        }

        // Bind train and route information
        if (ut.journey != null) {
            String train = (ut.journey.train != null ? (ut.journey.train.name != null ? ut.journey.train.name : "") + (ut.journey.train.number != null ? (" (" + ut.journey.train.number + ")") : "") : "-");
            String route = (ut.journey.route != null ? (ut.journey.route.from != null ? ut.journey.route.from : "") + " → " + (ut.journey.route.to != null ? ut.journey.route.to : "") : "-");
            holder.tvTrain.setText(train + "  " + route);

            if (ut.journey.schedule != null) {
                String dateTime = ut.journey.schedule.date != null ? ut.journey.schedule.date : "-";
                if (ut.journey.schedule.departureTime != null) {
                    dateTime += " • " + ut.journey.schedule.departureTime;
                }
                holder.tvDate.setText(dateTime);
            }
        }

        // Bind seat information
        if (ut.seat != null) {
            String seat = ut.seat.number != null ? ut.seat.number : "N/A";
            holder.tvSeat.setText(seat);
        }

        // Bind pricing information
        if (ut.pricing != null) {
            holder.tvPrice.setText(String.format(java.util.Locale.getDefault(), "%s %.2f", (ut.pricing.currency != null ? ut.pricing.currency : "BDT"), ut.pricing.amount));
        }

        // Set up print button click listener
        holder.btnPrint.setOnClickListener(v -> {
            printTicket(holder.itemView.getContext(), ut);
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    public static class VH extends RecyclerView.ViewHolder {
        final TextView tvTicketId, tvStatus, tvPaymentStatus, tvTrain, tvSeat, tvDate, tvPrice;
        final Button btnPrint;

        VH(@NonNull View itemView) {
            super(itemView);
            tvTicketId = itemView.findViewById(R.id.tvTicketId);
            tvStatus = itemView.findViewById(R.id.tvStatus);
            tvPaymentStatus = itemView.findViewById(R.id.tvPaymentStatus);
            tvTrain = itemView.findViewById(R.id.tvTrain);
            tvSeat = itemView.findViewById(R.id.tvSeat);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvPrice = itemView.findViewById(R.id.tvPrice);
            btnPrint = itemView.findViewById(R.id.btnPrint);
        }
    }

    private void printTicket(Context context, UserTicket ut) {
        // First, fetch fresh ticket data by ID
        if (ut.ticket == null || ut.ticket.ticketId == null || ut.ticket.ticketId.isEmpty()) {
            Toast.makeText(context, "Invalid ticket ID", Toast.LENGTH_SHORT).show();
            return;
        }

        String ticketId = ut.ticket.ticketId;

        // Show loading message
        Toast.makeText(context, "Fetching ticket details...", Toast.LENGTH_SHORT).show();

        // Fetch fresh ticket data
        ApiService api = ApiClient.getRetrofit(context).create(ApiService.class);
        Call<ResponseBody> call = api.getTicketById(ticketId);
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ResponseBody rb = response.body();
                    try {
                        String body = rb.string();
                        Log.d(TAG, "Raw API response: " + body); // Log the raw response
                        Gson gson = new Gson();
                        UserTicket freshTicket = gson.fromJson(body, UserTicket.class);

                        // Also parse as JsonObject to ensure perfect field matching (compat with older Gson)
                        com.google.gson.JsonObject jsonObj = gson.fromJson(body, com.google.gson.JsonObject.class);

                        if (jsonObj != null) {
                            // Now proceed with printing using JSON-based adapter for accuracy
                            proceedWithPrintingJson(context, jsonObj);
                        } else if (freshTicket != null) {
                            proceedWithPrinting(context, freshTicket);
                        } else {
                            Toast.makeText(context, "Failed to parse ticket data", Toast.LENGTH_SHORT).show();
                        }
                    } catch (IOException | JsonSyntaxException e) {
                        Log.e("TicketsAdapter", "Failed to parse fresh ticket data: " + e.getMessage(), e);
                        Toast.makeText(context, "Failed to load ticket details", Toast.LENGTH_SHORT).show();
                    } finally {
                        rb.close();
                    }
                } else {
                    Log.e("TicketsAdapter", "Failed to fetch ticket by ID: code=" + response.code());
                    String errorMessage = "Failed to load ticket details";
                    try {
                        if (response.errorBody() != null) {
                            String errorBody = response.errorBody().string();
                            if (!errorBody.isEmpty()) {
                                errorMessage = "Error: " + errorBody;
                            }
                        }
                    } catch (Exception e) {
                        Log.e("TicketsAdapter", "Failed to read error body", e);
                    }
                    Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Log.e("TicketsAdapter", "Network error fetching ticket: " + t.getMessage(), t);
                Toast.makeText(context, "Network error. Please check your connection.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private void proceedWithPrinting(Context context, UserTicket ticket) {
        try {
            // Show printing message
            Toast.makeText(context, context.getString(R.string.printing_ticket), Toast.LENGTH_SHORT).show();

            // Use Android's PrintManager to print the ticket
            PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) {
                Toast.makeText(context, "Print service not available", Toast.LENGTH_SHORT).show();
                return;
            }

            PrintDocumentAdapter adapter = new TicketPrintDocumentAdapter(context, ticket);
            PrintAttributes.Builder builder = new PrintAttributes.Builder();
            builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
            builder.setResolution(new PrintAttributes.Resolution("pdf", "pdf", 600, 600));
            builder.setMinMargins(PrintAttributes.Margins.NO_MARGINS);

            String jobName = "RailNet_Ticket_" + (ticket.ticket != null && ticket.ticket.ticketId != null ? ticket.ticket.ticketId : "Unknown");
            printManager.print(jobName, adapter, builder.build());

        } catch (Exception e) {
            Log.e("TicketsAdapter", "Error printing ticket", e);
            Toast.makeText(context, "Error printing ticket: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void proceedWithPrintingJson(Context context, com.google.gson.JsonObject jsonObj) {
        try {
            // Show printing message
            Toast.makeText(context, context.getString(R.string.printing_ticket), Toast.LENGTH_SHORT).show();

            // Use Android's PrintManager to print the ticket
            PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) {
                Toast.makeText(context, "Print service not available", Toast.LENGTH_SHORT).show();
                return;
            }

            PrintDocumentAdapter adapter = new TicketPrintDocumentAdapter(context, jsonObj);
            PrintAttributes.Builder builder = new PrintAttributes.Builder();
            builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
            builder.setResolution(new PrintAttributes.Resolution("pdf", "pdf", 600, 600));
            builder.setMinMargins(PrintAttributes.Margins.NO_MARGINS);

            String jobName = "RailNet_Ticket_" + (jsonObj.has("ticketId") ? jsonObj.get("ticketId").getAsString() : "Unknown");
            printManager.print(jobName, adapter, builder.build());

        } catch (Exception e) {
            Log.e("TicketsAdapter", "Error printing ticket", e);
            Toast.makeText(context, "Error printing ticket: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private String getStatusWithEmoji(String status) {
        if (status == null) return "Unknown";
        switch (status.toLowerCase()) {
            case "confirmed":
                return "✅ Confirmed";
            case "pending":
                return "⏳ Pending";
            case "cancelled":
                return "❌ Cancelled";
            case "completed":
                return "🎉 Completed";
            default:
                return status;
        }
    }

    private int getStatusColor(String status) {
        if (status == null) return android.graphics.Color.GRAY;
        switch (status.toLowerCase()) {
            case "confirmed":
                return android.graphics.Color.parseColor("#4CAF50"); // Green
            case "pending":
                return android.graphics.Color.parseColor("#FF9800"); // Orange
            case "cancelled":
                return android.graphics.Color.parseColor("#F44336"); // Red
            case "completed":
                return android.graphics.Color.parseColor("#2196F3"); // Blue
            default:
                return android.graphics.Color.GRAY;
        }
    }

    private String getPaymentStatusText(String paymentStatus) {
        if (paymentStatus == null) return "Unknown";
        switch (paymentStatus.toLowerCase()) {
            case "paid":
                return "Paid";
            case "pending":
                return "Pending";
            case "failed":
                return "Failed";
            case "refunded":
                return "Refunded";
            default:
                return paymentStatus;
        }
    }

    private int getPaymentStatusColor(String paymentStatus) {
        if (paymentStatus == null) return android.graphics.Color.GRAY;
        switch (paymentStatus.toLowerCase()) {
            case "paid":
                return android.graphics.Color.parseColor("#4CAF50"); // Green
            case "pending":
                return android.graphics.Color.parseColor("#FF9800"); // Orange
            case "failed":
                return android.graphics.Color.parseColor("#F44336"); // Red
            case "refunded":
                return android.graphics.Color.parseColor("#2196F3"); // Blue
            default:
                return android.graphics.Color.GRAY;
        }
    }
}
