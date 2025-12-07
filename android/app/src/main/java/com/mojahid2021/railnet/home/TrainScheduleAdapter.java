package com.mojahid2021.railnet.home;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.home.model.TrainSchedule;
import com.mojahid2021.railnet.util.DateTimeUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Adapter for showing a list of train schedules.
 *
 * Improvements for beginners:
 * - Clear method names and JavaDoc comments
 * - Small helper methods that each do one thing
 * - A named DiffUtil.Callback implementation for readability
 * - Safe null handling and small guard clauses
 */
public class TrainScheduleAdapter extends RecyclerView.Adapter<TrainScheduleAdapter.ViewHolder> {
    // Internal list of schedules. Kept private to encapsulate state.
    private final List<TrainSchedule> items = new ArrayList<>();
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(TrainSchedule schedule);
    }

    // Constructor: listener is required so clicks can be handled externally
    public TrainScheduleAdapter(OnItemClickListener listener) {
        this.listener = listener;
    }

    /**
     * Replace the adapter's data. Uses DiffUtil to update the RecyclerView efficiently.
     * @param newItems new list of schedules (may be null)
     */
    public void setItems(List<TrainSchedule> newItems) {
        if (newItems == null) newItems = new ArrayList<>();

        final List<TrainSchedule> oldList = new ArrayList<>(items);
        final List<TrainSchedule> newList = new ArrayList<>(newItems);

        // Calculate difference with a named callback for clarity
        DiffUtil.DiffResult diff = DiffUtil.calculateDiff(new TrainScheduleDiffCallback(oldList, newList));

        items.clear();
        items.addAll(newList);

        // Apply the calculated updates to the adapter
        diff.dispatchUpdatesTo(this);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_train_schedule, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        TrainSchedule ts = items.get(position);
        bindToHolder(holder, ts);

        // Forward click events to the provided listener
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onItemClick(ts);
        });
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    // Bind a TrainSchedule to the ViewHolder. Split logic into helper methods for readability.
    private void bindToHolder(@NonNull ViewHolder holder, TrainSchedule ts) {
        holder.tvTrainName.setText(formatTrainName(ts));
        holder.tvTimes.setText(formatTimesAndRoute(ts));
        holder.tvPrice.setText(formatPrice(ts));
    }

    // Helper: produce a user-friendly train name + number or '-'
    private static String formatTrainName(TrainSchedule ts) {
        if (ts == null || ts.train == null) return "-";
        String name = ts.train.name != null ? ts.train.name : "";
        String number = ts.train.number != null ? (" (" + ts.train.number + ")") : "";
        String combined = (name + number).trim();
        return combined.isEmpty() ? "-" : combined;
    }

    // Helper: produce "dep → arr  (RouteStart → RouteEnd)" string
    private static String formatTimesAndRoute(TrainSchedule ts) {
        String depRaw = "-", arrRaw = "-";
        if (ts != null && ts.stationTimes != null && !ts.stationTimes.isEmpty()) {
            TrainSchedule.StationTime first = ts.stationTimes.get(0);
            TrainSchedule.StationTime last = ts.stationTimes.get(ts.stationTimes.size() - 1);
            depRaw = first != null ? (first.departureTime != null ? first.departureTime : (first.arrivalTime != null ? first.arrivalTime : "-")) : "-";
            arrRaw = last != null ? (last.arrivalTime != null ? last.arrivalTime : (last.departureTime != null ? last.departureTime : "-")) : "-";
        }

        String dep = formatTimeSmart(depRaw);
        String arr = formatTimeSmart(arrRaw);

        String route = getRouteString(ts);

        return String.format("%s → %s  (%s)", dep, arr, route);
    }

    // Helper: format a raw time string; prefer ISO parsing, fall back to display helper
    private static String formatTimeSmart(String raw) {
        if (raw == null) return "-";
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return "-";
        String fromIso = DateTimeUtils.formatTimeFromIso(trimmed);
        if (!fromIso.isEmpty()) return fromIso;
        String fromPlain = DateTimeUtils.formatTimeForDisplay(trimmed);
        if (fromPlain != null && !fromPlain.isEmpty()) return fromPlain;
        return trimmed;
    }

    // Helper: return a compact route string like "Start → End" or "-" when unknown
    private static String getRouteString(TrainSchedule ts) {
        if (ts == null || ts.trainRoute == null) return "-";
        String s = ts.trainRoute.startStation != null ? ts.trainRoute.startStation.name : null;
        String e = ts.trainRoute.endStation != null ? ts.trainRoute.endStation.name : null;
        if (s != null && e != null) return s + " → " + e;
        if (s != null) return s;
        if (e != null) return e;
        return "-";
    }

    // Helper: find minimum compartment price and format it for display
    private static String formatPrice(TrainSchedule ts) {
        double min = findMinPrice(ts);
        if (min < 0) return "৳-";
        return String.format(java.util.Locale.getDefault(), "৳%.2f", min);
    }

    private static double findMinPrice(TrainSchedule ts) {
        if (ts == null || ts.train == null || ts.train.compartments == null || ts.train.compartments.isEmpty()) return -1;
        double min = -1;
        for (TrainSchedule.CompartmentAssignment ca : ts.train.compartments) {
            if (ca == null || ca.compartment == null) continue;
            double p = ca.compartment.price;
            if (min < 0 || p < min) min = p;
        }
        return min;
    }

    // Public ViewHolder with clear name for beginners
    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView tvTrainName, tvTimes, tvPrice;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTrainName = itemView.findViewById(R.id.tvTrainName);
            tvTimes = itemView.findViewById(R.id.tvTimes);
            tvPrice = itemView.findViewById(R.id.tvPrice);
        }
    }

    // Named DiffUtil callback to keep diff logic readable and separated
    private static class TrainScheduleDiffCallback extends DiffUtil.Callback {
        private final List<TrainSchedule> oldList;
        private final List<TrainSchedule> newList;

        TrainScheduleDiffCallback(List<TrainSchedule> oldList, List<TrainSchedule> newList) {
            this.oldList = oldList;
            this.newList = newList;
        }

        @Override
        public int getOldListSize() { return oldList.size(); }

        @Override
        public int getNewListSize() { return newList.size(); }

        @Override
        public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
            TrainSchedule a = oldList.get(oldItemPosition);
            TrainSchedule b = newList.get(newItemPosition);
            // Use id equality when possible, guard against nulls
            if (a == null || b == null) return false;
            return a.id == b.id;
        }

        @Override
        public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
            TrainSchedule a = oldList.get(oldItemPosition);
            TrainSchedule b = newList.get(newItemPosition);
            if (a == b) return true;
            if (a == null || b == null) return false;

            // Compare train name+number
            String aTrain = (a.train != null ? (a.train.name != null ? a.train.name : "") + (a.train.number != null ? " (" + a.train.number + ")" : "") : "");
            String bTrain = (b.train != null ? (b.train.name != null ? b.train.name : "") + (b.train.number != null ? " (" + b.train.number + ")" : "") : "");

            // Compare departure/arrival times (first and last stationTimes) — normalize via DateTimeUtils
            String aDepRaw = "", aArrRaw = "";
            if (a.stationTimes != null && !a.stationTimes.isEmpty()) {
                TrainSchedule.StationTime fa = a.stationTimes.get(0);
                TrainSchedule.StationTime la = a.stationTimes.get(a.stationTimes.size() - 1);
                aDepRaw = fa != null ? (fa.departureTime != null ? fa.departureTime : (fa.arrivalTime != null ? fa.arrivalTime : "")) : "";
                aArrRaw = la != null ? (la.arrivalTime != null ? la.arrivalTime : (la.departureTime != null ? la.departureTime : "")) : "";
            }
            String bDepRaw = "", bArrRaw = "";
            if (b.stationTimes != null && !b.stationTimes.isEmpty()) {
                TrainSchedule.StationTime fb = b.stationTimes.get(0);
                TrainSchedule.StationTime lb = b.stationTimes.get(b.stationTimes.size() - 1);
                bDepRaw = fb != null ? (fb.departureTime != null ? fb.departureTime : (fb.arrivalTime != null ? fb.arrivalTime : "")) : "";
                bArrRaw = lb != null ? (lb.arrivalTime != null ? lb.arrivalTime : (lb.departureTime != null ? lb.departureTime : "")) : "";
            }

            String aDep = formatTimeSmart(aDepRaw);
            String aArr = formatTimeSmart(aArrRaw);
            String bDep = formatTimeSmart(bDepRaw);
            String bArr = formatTimeSmart(bArrRaw);

            // Compare min compartment price
            double aPrice = findMinPrice(a);
            double bPrice = findMinPrice(b);

            return aTrain.equals(bTrain) && aDep.equals(bDep) && aArr.equals(bArr) && Double.compare(aPrice, bPrice) == 0;
        }
    }
}
