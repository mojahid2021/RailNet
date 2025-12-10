package com.mojahid2021.railnet.adapter;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.util.Log;

import androidx.core.content.res.ResourcesCompat;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.mojahid2021.railnet.model.UserTicket;

import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Currency;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;

/**
 * Clean, single-version TicketPrintDocumentAdapter.
 * - No outer border or perforated tear line
 * - Uses RailNet font when available (res/font or assets)
 * - Ensures same non-bold typeface for section titles and body
 */
public class TicketPrintDocumentAdapter extends PrintDocumentAdapter {

    private static final String TAG = "TicketPrintAdapter";
    private final Context context;
    private final UserTicket ticket; // may be null when jsonTicket used
    private final com.google.gson.JsonObject jsonTicket; // may be null when ticket used
    private final Typeface railNetTypeface;

    // Layout constants
    private static final float PAGE_WIDTH = 595f;
    private static final float PAGE_HEIGHT = 842f;
    private static final float MARGIN = 40f;

    // Typography
    private static final float FONT_SIZE_LOGO = 28f;
    private static final float FONT_SIZE_SUBTITLE = 10f;
    private static final float FONT_SIZE_BADGE = 12f;
    private static final float FONT_SIZE_TICKET_ID = 16f;
    private static final float FONT_SIZE_SECTION_TITLE = 14f;
    private static final float FONT_SIZE_BODY_LARGE = 12f;
    private static final float FONT_SIZE_BODY_MEDIUM = 11f;
    private static final float FONT_SIZE_CAPTION = 9f;
    private static final float FONT_SIZE_FINE_PRINT = 8f;

    private static final float LINE_HEIGHT_BODY = 16f;
    private static final float LINE_HEIGHT_CAPTION = 12f;

    // Colors
    private static final int COLOR_PRIMARY = 0xFF0898D9;
    private static final int COLOR_BACKGROUND_LIGHT = 0xFFFAFAFA;
    private static final int COLOR_BACKGROUND_HEADER = 0xFFEAF6FF;
    private static final int COLOR_WHITE = 0xFFFFFFFF;

    public TicketPrintDocumentAdapter(Context context, UserTicket ticket) {
        this.context = context;
        this.ticket = ticket;
        this.jsonTicket = null;
        this.railNetTypeface = loadRailNetTypeface();
    }

    public TicketPrintDocumentAdapter(Context context, com.google.gson.JsonObject jsonTicket) {
        this.context = context;
        this.ticket = null;
        this.jsonTicket = jsonTicket;
        this.railNetTypeface = loadRailNetTypeface();
    }

    @Override
    public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                         CancellationSignal cancellationSignal, LayoutResultCallback callback,
                         Bundle extras) {
        if (cancellationSignal != null && cancellationSignal.isCanceled()) {
            callback.onLayoutCancelled();
            return;
        }
        String name = "RailNet_Ticket";
        try {
            String id = safeGet(ticket, "ticket", "ticketId");
            if (id != null && !id.isEmpty()) name = "RailNet_Ticket_" + id;
        } catch (Exception ignored) {}

        PrintDocumentInfo info = new PrintDocumentInfo.Builder(name)
                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                .setPageCount(1)
                .build();
        callback.onLayoutFinished(info, true);
    }

    @Override
    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                        CancellationSignal cancellationSignal, WriteResultCallback callback) {
        PdfDocument pdfDocument = new PdfDocument();
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder((int) PAGE_WIDTH, (int) PAGE_HEIGHT, 1).create();
        PdfDocument.Page page = pdfDocument.startPage(pageInfo);
        Canvas canvas = page.getCanvas();

        drawProfessionalRailwayTicket(canvas);

        pdfDocument.finishPage(page);
        try {
            pdfDocument.writeTo(new FileOutputStream(destination.getFileDescriptor()));
            callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
        } catch (IOException e) {
            Log.e(TAG, "Error writing PDF", e);
            callback.onWriteFailed(e.getMessage());
        } finally {
            pdfDocument.close();
        }
    }

    private void drawProfessionalRailwayTicket(Canvas canvas) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ensureNormalTypeface(paint);
        paint.setColor(Color.DKGRAY);

        RectF ticketBounds = new RectF(MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN);

        // subtle white background (no heavy border)
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(COLOR_WHITE);
        canvas.drawRect(ticketBounds, paint);

        float currentY = ticketBounds.top + 8;
        currentY = drawTicketHeader(canvas, paint, ticketBounds, currentY);
        drawMainContent(canvas, paint, ticketBounds, currentY);
        drawTicketFooter(canvas, paint, ticketBounds);
    }

    private float drawTicketHeader(Canvas canvas, Paint paint, RectF bounds, float startY) {
        ensureNormalTypeface(paint);
        float headerHeight = 90;
        RectF headerBounds = new RectF(bounds.left + 12, startY, bounds.right - 12, startY + headerHeight);

        paint.setColor(COLOR_BACKGROUND_HEADER);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(headerBounds, 8, 8, paint);

        float leftX = headerBounds.left + 18;
        float y = headerBounds.top + 24;
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_LOGO);
        drawTextLeft(canvas, paint, "RailNet", leftX, y);

        paint.setTextSize(FONT_SIZE_SUBTITLE);
        paint.setColor(Color.DKGRAY);
        drawTextLeft(canvas, paint, "BANGLADESH RAILWAY NETWORK", leftX, y + 18);

        float rightX = headerBounds.right - 18;
        String ticketId = safeGet(ticket, "ticket", "ticketId");
        if (ticketId == null || ticketId.isEmpty()) ticketId = "TKT-XXXX";

        String status = safeGet(ticket, "ticket", "status");
        String statusText = getStatusWithEmoji(status);
        int statusColor = getStatusColor(status);
        float badgeY = headerBounds.top + 20;
        paint.setTextSize(FONT_SIZE_BADGE);
        paint.setColor(statusColor);
        drawTextRight(canvas, paint, statusText, rightX, badgeY);

        paint.setTextSize(FONT_SIZE_TICKET_ID);
        paint.setColor(Color.BLACK);
        drawTextRight(canvas, paint, "TICKET #" + ticketId, rightX, badgeY + 22);

        paint.setTextSize(FONT_SIZE_SUBTITLE);
        paint.setColor(Color.GRAY);
        String expiresAt = safeGet(ticket, "ticket", "expiresAt");
        if (expiresAt != null && !expiresAt.isEmpty()) {
            drawTextRight(canvas, paint, "Expires: " + formatExpiry(expiresAt), rightX, badgeY + 36);
        }

        String printed = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, Locale.getDefault()).format(new Date());
        drawTextRight(canvas, paint, printed, rightX, headerBounds.bottom - 10);

        return headerBounds.bottom + 12;
    }

    private String formatExpiry(String iso) {
        try {
            String datePart = iso.length() >= 10 ? iso.substring(0, 10) : iso;
            String timePart = null;
            if (iso.contains("T")) {
                String[] parts = iso.split("T");
                datePart = parts[0];
                timePart = parts.length > 1 ? parts[1] : null;
            }
            Date d = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(datePart);
            String dateStr = d != null ? DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.getDefault()).format(d) : datePart;
            if (timePart != null && timePart.length() >= 5) {
                return dateStr + " • " + timePart.substring(0, 5);
            }
            return dateStr;
        } catch (Exception e) {
            return iso;
        }
    }

    private void drawMainContent(Canvas canvas, Paint paint, RectF bounds, float startY) {
        float contentWidth = bounds.width() - 30;
        float leftSectionWidth = contentWidth * 0.58f;
        float rightSectionWidth = contentWidth * 0.38f;
        float sectionSpacing = contentWidth * 0.04f;

        float leftX = bounds.left + 15;
        float rightX = leftX + leftSectionWidth + sectionSpacing;

        float journeyHeight = drawJourneySection(canvas, paint, leftX, startY, leftSectionWidth);
        float passengerHeight = drawPassengerSection(canvas, paint, rightX, startY, rightSectionWidth);

        float qrY = startY + Math.max(journeyHeight, passengerHeight) + 18;
        drawQRCodeSection(canvas, paint, bounds, qrY);
    }

    private float drawJourneySection(Canvas canvas, Paint paint, float x, float y, float width) {
        ensureNormalTypeface(paint);
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_SECTION_TITLE);
        paint.setStyle(Paint.Style.FILL);
        drawTextLeft(canvas, paint, "JOURNEY DETAILS", x, y + 14);

        float boxHeight = 140;
        RectF contentBox = new RectF(x, y + 24, x + width, y + 24 + boxHeight);
        drawContentBox(canvas, paint, contentBox);

        float contentY = contentBox.top + 18;
        float lineHeight = LINE_HEIGHT_BODY;

        paint.setColor(Color.BLACK);
        paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
        String trainName = safeGet(ticket, "journey", "train", "name");
        String trainNumber = safeGet(ticket, "journey", "train", "number");
        String trainInfo = "";
        if (trainName != null && !trainName.isEmpty()) trainInfo += trainName;
        if (trainNumber != null && !trainNumber.isEmpty()) trainInfo += (trainInfo.isEmpty() ? "" : " ") + "(" + trainNumber + ")";
        if (!trainInfo.isEmpty()) {
            drawTextLeft(canvas, paint, "🚂 Train: " + trainInfo, x + 12, contentY);
            contentY += lineHeight;
        }

        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_BODY_LARGE);
        String from = safeGet(ticket, "journey", "route", "from");
        String to = safeGet(ticket, "journey", "route", "to");
        if ((from != null && !from.isEmpty()) || (to != null && !to.isEmpty())) {
            String routeText = (from == null ? "" : from) + " → " + (to == null ? "" : to);
            drawTextLeft(canvas, paint, "📍 Route: " + routeText, x + 12, contentY);
            contentY += lineHeight + 6;
        }

        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_CAPTION);
        String date = safeGet(ticket, "journey", "schedule", "date");
        String time = safeGet(ticket, "journey", "schedule", "departureTime");
        if ((date != null && !date.isEmpty()) || (time != null && !time.isEmpty())) {
            drawTextLeft(canvas, paint, "📅 Departure: " + (date == null ? "" : formatDate(date)) + (time == null || time.isEmpty() ? "" : " at " + time), x + 12, contentY);
            contentY += lineHeight;
        }

        String ticketStatus = safeGet(ticket, "ticket", "status");
        if (ticketStatus != null && !ticketStatus.isEmpty()) {
            paint.setColor(getStatusColor(ticketStatus));
            paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
            drawTextLeft(canvas, paint, "📋 Status: " + getStatusWithEmoji(ticketStatus), x + 12, contentY);
        }

        return boxHeight + 26;
    }

    private float drawPassengerSection(Canvas canvas, Paint paint, float x, float y, float width) {
        ensureNormalTypeface(paint);
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_SECTION_TITLE);
        paint.setStyle(Paint.Style.FILL);
        drawTextLeft(canvas, paint, "PASSENGER DETAILS", x, y + 14);

        float boxHeight = 160;
        RectF contentBox = new RectF(x, y + 24, x + width, y + 24 + boxHeight);
        drawContentBox(canvas, paint, contentBox);

        float contentY = contentBox.top + 18;
        float lineHeight = LINE_HEIGHT_BODY;

        paint.setColor(Color.BLACK);
        paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
        String passengerName = safeGet(ticket, "passenger", "name");
        if (passengerName != null && !passengerName.isEmpty()) {
            drawTextLeft(canvas, paint, "👤 Name: " + passengerName, x + 12, contentY);
            contentY += lineHeight;
        }

        String age = safeGet(ticket, "passenger", "age");
        String gender = safeGet(ticket, "passenger", "gender");
        String passengerInfo = "";
        if (age != null && !age.isEmpty()) passengerInfo += "Age: " + age;
        if (gender != null && !gender.isEmpty()) passengerInfo += (passengerInfo.isEmpty() ? "" : " • ") + gender;
        if (!passengerInfo.isEmpty()) {
            drawTextLeft(canvas, paint, "📊 " + passengerInfo, x + 12, contentY);
            contentY += lineHeight;
        }

        String compartment = safeGet(ticket, "seat", "compartment");
        String seatNumber = safeGet(ticket, "seat", "number");
        String seatInfo = "";
        if (compartment != null && !compartment.isEmpty() && seatNumber != null && !seatNumber.isEmpty()) {
            seatInfo = compartment + " - " + seatNumber;
        } else if (seatNumber != null && !seatNumber.isEmpty()) {
            seatInfo = seatNumber;
        } else if (compartment != null && !compartment.isEmpty()) {
            seatInfo = compartment;
        }
        if (!seatInfo.isEmpty()) {
            drawTextLeft(canvas, paint, "💺 Seat: " + seatInfo, x + 12, contentY);
            contentY += lineHeight;
        }

        String seatClass = safeGet(ticket, "seat", "class");
        if (seatClass != null && !seatClass.isEmpty()) {
            drawTextLeft(canvas, paint, "🏷️ Class: " + seatClass, x + 12, contentY);
            contentY += lineHeight;
        }

        String paymentStatus = safeGet(ticket, "ticket", "paymentStatus");
        if (paymentStatus != null && !paymentStatus.isEmpty()) {
            paint.setColor(getPaymentStatusColor(paymentStatus));
            drawTextLeft(canvas, paint, "💳 Payment: " + getPaymentStatusText(paymentStatus), x + 12, contentY);
            contentY += lineHeight;
            paint.setColor(Color.BLACK);
        }

        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_BODY_LARGE);
        String amtStr = safeGet(ticket, "pricing", "amount");
        String cur = safeGet(ticket, "pricing", "currency");
        double amt = 0.0;
        try { if (amtStr != null && !amtStr.isEmpty()) amt = Double.parseDouble(amtStr); } catch (Exception ignored) {}
        if (amtStr != null) {
            String price = formatCurrency(amt, cur == null ? "BDT" : cur);
            drawTextLeft(canvas, paint, "💰 Fare: " + price, x + 12, contentY);
        }

        return boxHeight + 26;
    }

    private void drawContentBox(Canvas canvas, Paint paint, RectF bounds) {
        paint.setColor(COLOR_BACKGROUND_LIGHT);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(bounds, 8, 8, paint);
        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(bounds, 8, 8, paint);
    }

    private void drawQRCodeSection(Canvas canvas, Paint paint, RectF bounds, float y) {
        ensureNormalTypeface(paint);
        float qrSize = 76;
        float qrX = bounds.right - qrSize - 28;
        RectF qrBox = new RectF(qrX - 5, y - 5, qrX + qrSize + 5, y + qrSize + 5);
        paint.setColor(Color.parseColor("#F8F9FA"));
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(qrBox, 8, 8, paint);
        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(qrBox, 8, 8, paint);

        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        drawTextCenter(canvas, paint, "SCAN TO VERIFY", qrX + qrSize/2, y - 8);

        String ticketId = safeGet(ticket, "ticket", "ticketId");
        if (ticketId == null || ticketId.isEmpty()) ticketId = "DEFAULT";
        Bitmap qr = generateQrBitmap(ticketId, (int) qrSize);
        if (qr != null) {
            float left = qrBox.left + (qrBox.width() - qr.getWidth()) / 2f;
            float top = qrBox.top + (qrBox.height() - qr.getHeight()) / 2f;
            canvas.drawBitmap(qr, left, top, null);
        }
    }

    private Bitmap generateQrBitmap(String data, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            HashMap<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix bm = writer.encode(data, BarcodeFormat.QR_CODE, size, size, hints);
            Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            for (int xx = 0; xx < size; xx++) {
                for (int yy = 0; yy < size; yy++) {
                    bmp.setPixel(xx, yy, bm.get(xx, yy) ? Color.BLACK : Color.WHITE);
                }
            }
            return bmp;
        } catch (WriterException e) {
            Log.e(TAG, "QR generation failed", e);
            return null;
        }
    }

    private void drawTicketFooter(Canvas canvas, Paint paint, RectF bounds) {
        ensureNormalTypeface(paint);
        float footerHeight = 110;
        RectF footerBounds = new RectF(bounds.left + 12, bounds.bottom - footerHeight - 12,
                bounds.right - 12, bounds.bottom - 12);

        paint.setColor(Color.parseColor("#F8F9FA"));
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(footerBounds, 8, 8, paint);

        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(footerBounds, 8, 8, paint);

        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        paint.setStyle(Paint.Style.FILL);

        float textX = footerBounds.left + 12;
        float textY = footerBounds.top + 18;
        float lineHeight = LINE_HEIGHT_CAPTION;

        drawTextLeft(canvas, paint, "TERMS & CONDITIONS:", textX, textY);
        textY += lineHeight;

        String[] terms = new String[]{
                "• This ticket is non-transferable and valid only for the named passenger.",
                "• Please arrive at the station at least 30 minutes before departure.",
                "• Valid government-issued ID proof is required for verification.",
                "• Cancellation charges apply as per railway regulations."
        };
        for (String term : terms) {
            drawTextLeft(canvas, paint, term, textX, textY);
            textY += lineHeight - 2;
        }

        paint.setColor(Color.LTGRAY);
        paint.setTextSize(7);
        String timestamp = "Printed: " + new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(new Date());
        drawTextLeft(canvas, paint, timestamp, textX, footerBounds.bottom - 12);

        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(9);
        drawTextRight(canvas, paint, "OFFICIAL RAILNET TICKET", footerBounds.right - 12, footerBounds.bottom - 12);

        drawWatermark(canvas, paint, bounds);
    }

    private void drawWatermark(Canvas canvas, Paint paint, RectF bounds) {
        paint.setColor(Color.parseColor("#EAF6FF"));
        paint.setTextSize(36);
        canvas.save();
        canvas.rotate(-45, bounds.centerX(), bounds.centerY());
        drawTextLeft(canvas, paint, "RAILNET", bounds.centerX() - 80, bounds.centerY());
        canvas.restore();
    }

    private void drawTextLeft(Canvas canvas, Paint paint, String text, float x, float y) {
        ensureNormalTypeface(paint);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawText(text, x, y, paint);
    }

    private void drawTextRight(Canvas canvas, Paint paint, String text, float rightX, float y) {
        ensureNormalTypeface(paint);
        paint.setStyle(Paint.Style.FILL);
        float textWidth = paint.measureText(text);
        canvas.drawText(text, rightX - textWidth, y, paint);
    }

    private void drawTextCenter(Canvas canvas, Paint paint, String text, float centerX, float y) {
        ensureNormalTypeface(paint);
        paint.setStyle(Paint.Style.FILL);
        float textWidth = paint.measureText(text);
        canvas.drawText(text, centerX - textWidth / 2, y, paint);
    }

    private String formatDate(String input) {
        if (input == null || input.isEmpty()) return "";
        try {
            String s = input.length() >= 10 ? input.substring(0, 10) : input;
            SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date d = iso.parse(s);
            if (d != null) return DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.getDefault()).format(d);
        } catch (Exception ignored) {}
        return input;
    }

    private String formatCurrency(double amount, String currencyCode) {
        try {
            Locale locale = Locale.getDefault();
            try {
                if (context != null) {
                    Locale ctxLocale = context.getResources().getConfiguration().getLocales().get(0);
                    if (ctxLocale != null) locale = ctxLocale;
                }
            } catch (Exception ignored) {}
            NumberFormat nf = NumberFormat.getCurrencyInstance(locale);
            if (currencyCode != null && !currencyCode.isEmpty()) {
                try {
                    Currency c = Currency.getInstance(currencyCode);
                    nf.setCurrency(c);
                } catch (Exception ignored) {}
            }
            return nf.format(amount);
        } catch (Exception e) {
            return (currencyCode == null ? "BDT" : currencyCode) + " " + String.format(Locale.getDefault(), "%.2f", amount);
        }
    }

    // Reflection-safe getters for model or JSON
    private String safeGet(Object root, String... path) {
        if (root == null) {
            if (jsonTicket != null) return safeGetJson(jsonTicket, path);
            return null;
        }
        Object cur = root;
        for (String p : path) {
            if (cur == null) return null;
            cur = getFieldOrGetter(cur, p);
        }
        return cur == null ? null : String.valueOf(cur);
    }

    private String safeGet(String... path) {
        if (jsonTicket != null) return safeGetJson(jsonTicket, path);
        return safeGet(ticket, path);
    }

    private String safeGetJson(com.google.gson.JsonObject obj, String... path) {
        try {
            com.google.gson.JsonElement cur = obj;
            for (String p : path) {
                if (!(cur instanceof com.google.gson.JsonObject)) return null;
                com.google.gson.JsonObject jo = cur.getAsJsonObject();
                if (!jo.has(p)) return null;
                cur = jo.get(p);
            }
            if (cur == null || cur.isJsonNull()) return null;
            if (cur.isJsonPrimitive()) return cur.getAsJsonPrimitive().getAsString();
            return cur.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private Object getFieldOrGetter(Object obj, String name) {
        if (obj == null || name == null) return null;
        Class<?> cls = obj.getClass();
        if (name.contains(".")) {
            String[] parts = name.split("\\.");
            Object cur = obj;
            for (String p : parts) {
                cur = getFieldOrGetter(cur, p);
                if (cur == null) return null;
            }
            return cur;
        }
        String cap = Character.toUpperCase(name.charAt(0)) + name.substring(1);
        String[] methods = new String[]{"get" + cap, "is" + cap, name};
        for (String mName : methods) {
            try {
                Method m = cls.getMethod(mName);
                return m.invoke(obj);
            } catch (Exception ignored) {}
        }
        try {
            Field f = cls.getField(name);
            return f.get(obj);
        } catch (Exception ignored) {}
        try {
            Field f = cls.getDeclaredField(name);
            f.setAccessible(true);
            return f.get(obj);
        } catch (Exception ignored) {}
        return null;
    }

    private String getStatusWithEmoji(String status) {
        if (status == null) return "Unknown";
        switch (status.toLowerCase()) {
            case "confirmed": return "✅ Confirmed";
            case "pending": return "⏳ Pending";
            case "cancelled": return "❌ Cancelled";
            case "completed": return "🎉 Completed";
            case "expired": return "⏰ Expired";
            default: return status;
        }
    }

    private int getStatusColor(String status) {
        if (status == null) return Color.GRAY;
        switch (status.toLowerCase()) {
            case "confirmed": return Color.parseColor("#4CAF50");
            case "pending": return Color.parseColor("#FF9800");
            case "cancelled": return Color.parseColor("#F44336");
            case "completed": return Color.parseColor("#2196F3");
            case "expired": return Color.parseColor("#9E9E9E");
            default: return Color.GRAY;
        }
    }

    private String getPaymentStatusText(String paymentStatus) {
        if (paymentStatus == null) return "Unknown";
        switch (paymentStatus.toLowerCase()) {
            case "paid": return "Paid";
            case "pending": return "Pending";
            case "failed": return "Failed";
            case "refunded": return "Refunded";
            case "expired": return "Expired";
            default: return paymentStatus;
        }
    }

    private int getPaymentStatusColor(String paymentStatus) {
        if (paymentStatus == null) return Color.GRAY;
        switch (paymentStatus.toLowerCase()) {
            case "paid": return Color.parseColor("#4CAF50");
            case "pending": return Color.parseColor("#FF9800");
            case "failed": return Color.parseColor("#F44336");
            case "refunded": return Color.parseColor("#2196F3");
            case "expired": return Color.parseColor("#9E9E9E");
            default: return Color.GRAY;
        }
    }

    private void ensureNormalTypeface(Paint paint) {
        if (paint == null) return;
        try {
            if (railNetTypeface != null) paint.setTypeface(railNetTypeface);
            else paint.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        } catch (Exception ignored) {
            paint.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        }
        paint.setFakeBoldText(false);
        paint.setTextSkewX(0f);
        paint.setTextScaleX(1f);
        try { paint.setSubpixelText(true); paint.setLinearText(true); } catch (Throwable ignored) {}
        try { paint.setLetterSpacing(0f); } catch (Throwable ignored) {}
    }

    private Typeface loadRailNetTypeface() {
        try {
            int resId = context.getResources().getIdentifier("railnet_regular", "font", context.getPackageName());
            if (resId != 0) {
                Typeface t = ResourcesCompat.getFont(context, resId);
                if (t != null) return Typeface.create(t, Typeface.NORMAL);
            }
            try {
                return Typeface.createFromAsset(context.getAssets(), "fonts/RailNet-Regular.ttf");
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}
        return Typeface.create("sans-serif", Typeface.NORMAL);
    }
}
