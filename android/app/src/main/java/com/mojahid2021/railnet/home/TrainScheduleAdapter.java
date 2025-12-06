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

public class TrainScheduleAdapter extends RecyclerView.Adapter<TrainScheduleAdapter.VH> {
    private final List<TrainSchedule> items = new ArrayList<>();
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(TrainSchedule schedule);
    }

    // Accept only listener; items will be provided via setItems()
    public TrainScheduleAdapter(OnItemClickListener listener) {
        this.listener = listener;
    }

    // Helper: format time string for display (try ISO, then plain time)
    private static String formatTimeSmart(String raw) {
        if (raw == null) return "";
        String t = raw.trim();
        String fromIso = DateTimeUtils.formatTimeFromIso(t);
        if (!fromIso.isEmpty()) return fromIso;
        String fromPlain = DateTimeUtils.formatTimeForDisplay(t);
        return (fromPlain != null && !fromPlain.isEmpty()) ? fromPlain : t;
    }

    // Replace list contents using DiffUtil
    public void setItems(List<TrainSchedule> newItems) {
        if (newItems == null) newItems = new ArrayList<>();
        final List<TrainSchedule> old = new ArrayList<>(items);
        final List<TrainSchedule> newList = newItems; // make effectively final for inner class
        DiffUtil.DiffResult diff = DiffUtil.calculateDiff(new DiffUtil.Callback() {
            @Override
            public int getOldListSize() { return old.size(); }

            @Override
            public int getNewListSize() { return newList.size(); }

            @Override
            public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
                return old.get(oldItemPosition).id == newList.get(newItemPosition).id;
            }

            @Override
            public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
                TrainSchedule a = old.get(oldItemPosition);
                TrainSchedule b = newList.get(newItemPosition);
                if (a == b) return true;
                if (a == null || b == null) return false;

                // Compare train name+number
                String aTrain = "";
                if (a.train != null) aTrain = (a.train.name != null ? a.train.name : "") + (a.train.number != null ? " (" + a.train.number + ")" : "");
                String bTrain = "";
                if (b.train != null) bTrain = (b.train.name != null ? b.train.name : "") + (b.train.number != null ? " (" + b.train.number + ")" : "");

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
                double aPrice = -1, bPrice = -1;
                if (a.train != null && a.train.compartments != null) {
                    for (TrainSchedule.CompartmentAssignment ca : a.train.compartments) {
                        if (ca != null && ca.compartment != null) {
                            double p = ca.compartment.price;
                            if (aPrice < 0 || p < aPrice) aPrice = p;
                        }
                    }
                }
                if (b.train != null && b.train.compartments != null) {
                    for (TrainSchedule.CompartmentAssignment cb : b.train.compartments) {
                        if (cb != null && cb.compartment != null) {
                            double p = cb.compartment.price;
                            if (bPrice < 0 || p < bPrice) bPrice = p;
                        }
                    }
                }

                return aTrain.equals(bTrain) && aDep.equals(bDep) && aArr.equals(bArr) && Double.compare(aPrice, bPrice) == 0;
            }
        });

        items.clear();
        items.addAll(newItems);
        diff.dispatchUpdatesTo(this);
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_train_schedule, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        TrainSchedule ts = items.get(position);
        // Train name and number
        String trainName = "-";
        if (ts.train != null) {
            trainName = (ts.train.name != null ? ts.train.name : "") + (ts.train.number != null ? " (" + ts.train.number + ")" : "");
            if (trainName.trim().isEmpty()) trainName = "-";
        }
        holder.tvTrainName.setText(trainName);

        // Route: startStation -> endStation
        String route = "-";
        if (ts.trainRoute != null) {
            String s = ts.trainRoute.startStation != null ? ts.trainRoute.startStation.name : null;
            String e = ts.trainRoute.endStation != null ? ts.trainRoute.endStation.name : null;
            if (s != null && e != null) route = s + " → " + e;
            else if (s != null) route = s;
            else if (e != null) route = e;
        }

        // Departure and arrival times from stationTimes sequence (first and last)
        String dep = "-";
        String arr = "-";
        if (ts.stationTimes != null && !ts.stationTimes.isEmpty()) {
            TrainSchedule.StationTime first = ts.stationTimes.get(0);
            TrainSchedule.StationTime last = ts.stationTimes.get(ts.stationTimes.size() - 1);
            dep = first.departureTime != null ? first.departureTime : (first.arrivalTime != null ? first.arrivalTime : "-");
            arr = last.arrivalTime != null ? last.arrivalTime : (last.departureTime != null ? last.departureTime : "-");
        }

        // Format times for display using DateTimeUtils
        String depFmt = formatTimeSmart(dep);
        String arrFmt = formatTimeSmart(arr);
        holder.tvTimes.setText(String.format("%s → %s  (%s)", depFmt, arrFmt, route));

        // Price: pick the minimum compartment price if available
        String priceText = "৳-";
        double price = -1;
        if (ts.train != null && ts.train.compartments != null && !ts.train.compartments.isEmpty()) {
            for (TrainSchedule.CompartmentAssignment ca : ts.train.compartments) {
                if (ca != null && ca.compartment != null) {
                    double p = ca.compartment.price;
                    if (price < 0 || p < price) price = p;
                }
            }
        }
        if (price >= 0) priceText = String.format(java.util.Locale.getDefault(), "৳%.2f", price);
        holder.tvPrice.setText(priceText);
        holder.itemView.setOnClickListener(v -> listener.onItemClick(ts));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    public static class VH extends RecyclerView.ViewHolder {
        TextView tvTrainName, tvTimes, tvPrice;

        VH(@NonNull View itemView) {
            super(itemView);
            tvTrainName = itemView.findViewById(R.id.tvTrainName);
            tvTimes = itemView.findViewById(R.id.tvTimes);
            tvPrice = itemView.findViewById(R.id.tvPrice);
        }
    }
}
