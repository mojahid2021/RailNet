package com.mojahid2021.railnet.util;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Utility methods for parsing and formatting dates and times used across the app.
 *
 * - Parses common ISO-8601 date/time strings returned by the backend (with/without milliseconds).
 * - Formats dates for display (e.g. "Sat, Dec 6, 2025") and for API queries (yyyy-MM-dd).
 * - Formats time strings (hh:mm a) for display.
 *
 * Note: SimpleDateFormat is used for broad Android compatibility. Methods create new
 * formatter instances per-call because SimpleDateFormat is not thread-safe.
 */
public final class DateTimeUtils {

    private DateTimeUtils() {

    }

    // Display date format used in HomeFragment
    private static final String DISPLAY_DATE_PATTERN = "EEE, MMM d, yyyy"; // e.g. Sat, Dec 6, 2025
    private static final String API_DATE_PATTERN = "yyyy-MM-dd"; // e.g. 2025-12-06
    private static final String DISPLAY_TIME_PATTERN = "hh:mm a"; // e.g. 08:00 AM

    // Common ISO patterns used by backend
    private static final String ISO_MS_Z = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"; // with milliseconds + Z
    private static final String ISO_S_Z = "yyyy-MM-dd'T'HH:mm:ss'Z'"; // without milliseconds + Z
    private static final String ISO_DATE_ONLY = "yyyy-MM-dd";

    private static List<SimpleDateFormat> buildIsoParsers() {
        List<SimpleDateFormat> list = new ArrayList<>();
        SimpleDateFormat sdf1 = new SimpleDateFormat(ISO_MS_Z, Locale.getDefault());
        sdf1.setTimeZone(TimeZone.getTimeZone("UTC"));
        list.add(sdf1);

        SimpleDateFormat sdf2 = new SimpleDateFormat(ISO_S_Z, Locale.getDefault());
        sdf2.setTimeZone(TimeZone.getTimeZone("UTC"));
        list.add(sdf2);

        SimpleDateFormat sdf3 = new SimpleDateFormat(ISO_DATE_ONLY, Locale.getDefault());
        sdf3.setTimeZone(TimeZone.getDefault());
        list.add(sdf3);
        return list;
    }

    /**
     * Parse an ISO date/time string into {@link Date}.
     * Supports patterns with and without milliseconds and plain yyyy-MM-dd.
     * Returns null if parsing fails.
     */
    public static Date parseIsoToDate(String iso) {
        if (iso == null) return null;
        String s = iso.trim();
        List<SimpleDateFormat> parsers = buildIsoParsers();
        for (SimpleDateFormat p : parsers) {
            try {
                return p.parse(s);
            } catch (ParseException ignored) {
            }
        }
        return null;
    }

    /**
     * Format a {@link Date} for display in UI (e.g. "Sat, Dec 6, 2025").
     * Returns empty string for null date.
     */
    public static String formatDisplayDate(Date date) {
        if (date == null) return "";
        SimpleDateFormat sdf = new SimpleDateFormat(DISPLAY_DATE_PATTERN, Locale.getDefault());
        return sdf.format(date);
    }

    /**
     * Format a {@link Date} for API usage (yyyy-MM-dd). Returns empty string for null.
     */
    public static String formatApiDate(Date date) {
        if (date == null) return "";
        SimpleDateFormat sdf = new SimpleDateFormat(API_DATE_PATTERN, Locale.getDefault());
        sdf.setTimeZone(TimeZone.getDefault());
        return sdf.format(date);
    }

    /**
     * Convert an ISO date string to a display date string. Returns empty string if input invalid.
     */
    public static String formatDisplayDateFromIso(String iso) {
        Date d = parseIsoToDate(iso);
        return d == null ? "" : formatDisplayDate(d);
    }

    /**
     * Format a raw time string (like "08:00" or "08:00:00") into display time ("08:00 AM").
     * If parsing fails, returns the original string or empty if null.
     */
    public static String formatTimeForDisplay(String timeStr) {
        if (timeStr == null) return "";
        String s = timeStr.trim();
        // Try patterns HH:mm:ss and HH:mm
        String[] patterns = {"HH:mm:ss", "HH:mm"};
        for (String p : patterns) {
            try {
                SimpleDateFormat parser = new SimpleDateFormat(p, Locale.getDefault());
                Date d = parser.parse(s);
                if (d != null) {
                    SimpleDateFormat out = new SimpleDateFormat(DISPLAY_TIME_PATTERN, Locale.getDefault());
                    return out.format(d);
                }
            } catch (ParseException ignored) {}
        }
        // fallback
        return s;
    }

    /**
     * Format ISO datetime string to a display time (e.g. "08:00 AM"). Returns empty string on error.
     */
    public static String formatTimeFromIso(String iso) {
        Date d = parseIsoToDate(iso);
        if (d == null) return "";
        SimpleDateFormat out = new SimpleDateFormat(DISPLAY_TIME_PATTERN, Locale.getDefault());
        return out.format(d);
    }

    /**
     * Convert milliseconds since epoch to display date string.
     */
    public static String formatDisplayDateFromMillis(long millis) {
        return formatDisplayDate(new Date(millis));
    }

    /**
     * Convert a {@link Date} to epoch millis safely (0 if null).
     */
    public static long toMillis(Date date) {
        return date == null ? 0L : date.getTime();
    }
}

