package com.mojahid2021.railnet.home;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.mojahid2021.railnet.R;

import java.util.ArrayList;
import java.util.List;

public class SeatAdapter extends RecyclerView.Adapter<SeatAdapter.VH> {
    private final List<String> items = new ArrayList<>();
    private final OnSeatClickListener listener;
    private String selectedSeat = null;

    public interface OnSeatClickListener { void onSeatClick(String seat); }

    public SeatAdapter(List<String> items, OnSeatClickListener listener) {
        if (items != null) this.items.addAll(items);
        this.listener = listener;
    }

    public void setItems(List<String> newItems) {
        this.items.clear();
        this.selectedSeat = null;
        if (newItems != null) this.items.addAll(newItems);
        notifyDataSetChanged();
    }

    public void setSelectedSeat(String seat) {
        this.selectedSeat = seat;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_seat, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        String s = items.get(position);
        holder.tv.setText(s);
        holder.itemView.setSelected(s.equals(selectedSeat));
        holder.itemView.setOnClickListener(v -> {
            setSelectedSeat(s);
            listener.onSeatClick(s);
        });
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class VH extends RecyclerView.ViewHolder {
        TextView tv;
        VH(@NonNull View itemView) { super(itemView); tv = itemView.findViewById(R.id.tvSeat); }
    }
}
