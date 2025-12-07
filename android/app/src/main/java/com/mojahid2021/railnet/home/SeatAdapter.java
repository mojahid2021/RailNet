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

/**
 * Adapter for displaying a list of seat identifiers (simple strings).
 *
 * This version is written to be easier to understand for beginners:
 * - clear method names
 * - JavaDoc & inline comments
 * - small helper methods for common actions (getSelectedSeat, clearSelection)
 * - selection updates only refresh the affected items (more efficient than full refresh)
 */
public class SeatAdapter extends RecyclerView.Adapter<SeatAdapter.ViewHolder> {

    // Underlying list of seat labels (e.g. "A1", "B3"). We keep this private for encapsulation.
    private final List<String> items = new ArrayList<>();

    // Listener for click events. Nullable: not required but useful for callbacks.
    private final OnSeatClickListener listener;

    // Track currently selected seat label (null = none selected).
    private String selectedSeat = null;

    /**
     * Listener interface to notify when a seat is clicked.
     */
    public interface OnSeatClickListener {
        void onSeatClick(String seat);
    }

    /**
     * Create an adapter.
     *
     * @param items    initial list of seat labels (can be null)
     * @param listener click listener (can be null)
     */
    public SeatAdapter(List<String> items, OnSeatClickListener listener) {
        if (items != null) this.items.addAll(items);
        this.listener = listener;
    }

    /**
     * Replace the list of seats and clear any selection.
     * This is safe to call from the main thread.
     *
     * @param newItems new items (can be null)
     */
    public void setItems(List<String> newItems) {
        this.items.clear();
        this.selectedSeat = null; // clear selection when data changes
        if (newItems != null) this.items.addAll(newItems);
        // Notify full change because the whole data set was replaced.
        notifyDataSetChanged();
    }

    /**
     * Programmatically set the selected seat. If the seat exists in the list it will be highlighted.
     * Only the previously selected and the newly selected item views are refreshed.
     *
     * @param seat seat label to select (null to clear)
     */
    public void setSelectedSeat(String seat) {
        if (seat != null && !items.contains(seat)) {
            // If the requested seat doesn't exist do nothing (safer for beginners).
            return;
        }

        // Find positions for efficient update
        int oldPos = indexOf(selectedSeat);
        int newPos = indexOf(seat);

        // Update the model
        selectedSeat = seat;

        // Refresh only the affected rows
        if (oldPos != -1) notifyItemChanged(oldPos);
        if (newPos != -1) notifyItemChanged(newPos);
    }

    /**
     * Get currently selected seat label or null if none.
     */
    public String getSelectedSeat() {
        return selectedSeat;
    }

    /**
     * Clear current selection (if any).
     */
    public void clearSelection() {
        setSelectedSeat(null);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_seat, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        String seatLabel = items.get(position);

        // Bind data to view
        holder.tv.setText(seatLabel);

        // Highlight view if this item is selected
        holder.itemView.setSelected(seatLabel.equals(selectedSeat));

        // Click handling: use a small helper to keep logic out of the anonymous listener
        holder.itemView.setOnClickListener(v -> onItemClicked(position));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    // Helper: return index of an item or -1 if not found or if item == null
    private int indexOf(String seat) {
        if (seat == null) return -1;
        return items.indexOf(seat);
    }

    // Called when an item is clicked in the list.
    private void onItemClicked(int position) {
        String seat = items.get(position);
        // Update selection efficiently
        setSelectedSeat(seat);

        // Notify external listener (if provided). Null-check for safety.
        if (listener != null) {
            listener.onSeatClick(seat);
        }
    }

    // ViewHolder class: keeps references to views for each item and is public so it's visible where needed.
    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView tv;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tv = itemView.findViewById(R.id.tvSeat);
        }
    }
}
