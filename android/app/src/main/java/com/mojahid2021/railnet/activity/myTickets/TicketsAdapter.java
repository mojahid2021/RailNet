package com.mojahid2021.railnet.activity.myTickets;

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

import com.mojahid2021.railnet.R;

import java.util.ArrayList;
import java.util.List;

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
            String seat = (ut.seat.compartment != null ? ut.seat.compartment + " " : "") + (ut.seat.number != null ? ut.seat.number : "");
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
        try {
            // Show printing message
            Toast.makeText(context, context.getString(R.string.printing_ticket), Toast.LENGTH_SHORT).show();

            // Use Android's PrintManager to print the ticket
            PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) {
                Toast.makeText(context, "Print service not available", Toast.LENGTH_SHORT).show();
                return;
            }

            PrintDocumentAdapter adapter = new TicketPrintDocumentAdapter(context, ut);
            PrintAttributes.Builder builder = new PrintAttributes.Builder();
            builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
            builder.setResolution(new PrintAttributes.Resolution("pdf", "pdf", 600, 600));
            builder.setMinMargins(PrintAttributes.Margins.NO_MARGINS);

            String jobName = "RailNet_Ticket_" + (ut.ticket != null && ut.ticket.ticketId != null ? ut.ticket.ticketId : "Unknown");
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
