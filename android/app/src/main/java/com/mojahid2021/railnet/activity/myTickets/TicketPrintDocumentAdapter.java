package com.mojahid2021.railnet.activity.myTickets;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
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

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

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
 * Professional railway ticket print document adapter for RailNet
 * Creates an official-looking PDF ticket with modern design elements
 * - Uses normal (non-bold) typeface
 * - Localized date and currency formatting
 * - Safer null checks and clearer layout positioning
 */
public class TicketPrintDocumentAdapter extends PrintDocumentAdapter {

    private static final String TAG = "TicketPrintAdapter";
    private final Context context;
    private final UserTicket ticket;

    // Layout constants for professional printing
    private static final float PAGE_WIDTH = 595f;  // A4 width in points
    private static final float PAGE_HEIGHT = 842f; // A4 height in points
    private static final float MARGIN = 40f;

    // Professional typography constants (normal text)
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

    public TicketPrintDocumentAdapter(Context context, UserTicket ticket) {
        this.context = context;
        this.ticket = ticket;
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
        } catch (Exception ignored) { }

        PrintDocumentInfo.Builder builder = new PrintDocumentInfo.Builder(name)
                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                .setPageCount(1);

        PrintDocumentInfo info = builder.build();
        callback.onLayoutFinished(info, true);
    }

    @Override
    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                       CancellationSignal cancellationSignal, WriteResultCallback callback) {

        PdfDocument pdfDocument = new PdfDocument();

        // Create A4 page
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder((int)PAGE_WIDTH, (int)PAGE_HEIGHT, 1).create();
        PdfDocument.Page page = pdfDocument.startPage(pageInfo);

        Canvas canvas = page.getCanvas();

        // Draw the professional railway ticket
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
        // Always use normal (non-bold) sans-serif
        paint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
        paint.setColor(Color.DKGRAY);

        // Draw main ticket container with professional border
        RectF ticketBounds = new RectF(MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN);
        drawTicketBorder(canvas, paint, ticketBounds);

        // Draw ticket content in structured sections
        float currentY = ticketBounds.top + 18;

        // Header section
        currentY = drawTicketHeader(canvas, paint, ticketBounds, currentY);

        // Perforated tear line
        currentY = drawPerforatedLine(canvas, paint, ticketBounds, currentY);

        // Main content area
        drawMainContent(canvas, paint, ticketBounds, currentY);

        // Footer with terms and official markings
        drawTicketFooter(canvas, paint, ticketBounds);
    }

    private void drawTicketBorder(Canvas canvas, Paint paint, RectF bounds) {
        // Outer border with railway ticket styling
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(3);
        canvas.drawRoundRect(bounds, 16, 16, paint);

        // Inner background
        paint.setColor(Color.WHITE);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(bounds, 16, 16, paint);

        // Subtle inner shadow effect
        paint.setColor(Color.parseColor("#F5F5F5"));
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        RectF innerBounds = new RectF(bounds.left + 2, bounds.top + 2, bounds.right - 2, bounds.bottom - 2);
        canvas.drawRoundRect(innerBounds, 14, 14, paint);
    }

    private float drawTicketHeader(Canvas canvas, Paint paint, RectF bounds, float startY) {
        float headerHeight = 88;
        RectF headerBounds = new RectF(bounds.left + 12, startY, bounds.right - 12, startY + headerHeight);

        // Header background
        paint.setColor(Color.parseColor("#EAF6FF"));
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(headerBounds, 10, 10, paint);

        // Header border
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1.5f);
        canvas.drawRoundRect(headerBounds, 10, 10, paint);

        // Left side - RailNet branding (normal text)
        float leftX = headerBounds.left + 18;
        float y = headerBounds.top + 22;
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setTextSize(FONT_SIZE_LOGO);
        drawTextLeft(canvas, paint, "RailNet", leftX, y);

        paint.setTextSize(FONT_SIZE_SUBTITLE);
        paint.setColor(Color.DKGRAY);
        drawTextLeft(canvas, paint, "BANGLADESH RAILWAY NETWORK", leftX, y + 18);

        // Right side - Ticket information
        float rightX = headerBounds.right - 18;
        paint.setTextSize(FONT_SIZE_BADGE);
        paint.setColor(Color.parseColor("#FF9800"));
        drawTextRight(canvas, paint, "OFFICIAL TICKET", rightX, headerBounds.top + 18);

        paint.setTextSize(FONT_SIZE_TICKET_ID);
        paint.setColor(Color.BLACK);
        String ticketId = safeGet(ticket, "ticket", "ticketId");
        if (ticketId == null || ticketId.isEmpty()) ticketId = "TKT-XXXX";
        drawTextRight(canvas, paint, "TICKET #" + ticketId, rightX, headerBounds.top + 40);

        // small printed time at right
        paint.setTextSize(FONT_SIZE_SUBTITLE - 1);
        paint.setColor(Color.GRAY);
        String printed = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, Locale.getDefault()).format(new Date());
        drawTextRight(canvas, paint, printed, rightX, headerBounds.top + 56);

        return headerBounds.bottom + 12;
    }

    private float drawPerforatedLine(Canvas canvas, Paint paint, RectF bounds, float startY) {
        float lineY = startY + 8;

        // Draw perforated line effect
        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        paint.setPathEffect(new DashPathEffect(new float[]{6f, 4f}, 0));

        Path perforatedPath = new Path();
        perforatedPath.moveTo(bounds.left + 24, lineY);
        perforatedPath.lineTo(bounds.right - 24, lineY);
        canvas.drawPath(perforatedPath, paint);

        // Reset path effect
        paint.setPathEffect(null);
        paint.setStyle(Paint.Style.FILL);

        // Add tear instruction
        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        drawTextCenter(canvas, paint, "TEAR ALONG THIS LINE", bounds.centerX(), lineY - 6);

        return lineY + 18;
    }

    private void drawMainContent(Canvas canvas, Paint paint, RectF bounds, float startY) {
        float contentWidth = bounds.width() - 30;
        float leftSectionWidth = contentWidth * 0.58f;
        float rightSectionWidth = contentWidth * 0.38f;
        float sectionSpacing = contentWidth * 0.04f;

        float leftX = bounds.left + 15;
        float rightX = leftX + leftSectionWidth + sectionSpacing;

        // Draw journey details section (left)
        float journeyHeight = drawJourneySection(canvas, paint, leftX, startY, leftSectionWidth);

        // Draw passenger details section (right)
        float passengerHeight = drawPassengerSection(canvas, paint, rightX, startY, rightSectionWidth);

        // Draw QR code section
        float qrY = startY + Math.max(journeyHeight, passengerHeight) + 18;
        drawQRCodeSection(canvas, paint, bounds, qrY);

        // drawing completed
    }

    private float drawJourneySection(Canvas canvas, Paint paint, float x, float y, float width) {
        // Section title
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setTextSize(FONT_SIZE_SECTION_TITLE);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawText("JOURNEY DETAILS", x, y + 14, paint);

        // Content box
        float boxHeight = 130;
        RectF contentBox = new RectF(x, y + 24, x + width, y + 24 + boxHeight);
        drawContentBox(canvas, paint, contentBox);

        float contentY = contentBox.top + 18;
        float lineHeight = LINE_HEIGHT_BODY;

        // Train information (safe access)
        paint.setColor(Color.BLACK);
        paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
        String trainName = safeGet(ticket, "journey", "train", "name");
        String trainNumber = safeGet(ticket, "journey", "train", "number");
        String trainInfo = "";
        if (trainName != null && !trainName.isEmpty()) trainInfo += trainName;
        if (trainNumber != null && !trainNumber.isEmpty()) trainInfo += (trainInfo.isEmpty() ? "" : " ") + "(" + trainNumber + ")";
        if (!trainInfo.isEmpty()) {
            canvas.drawText("Train: " + trainInfo, x + 12, contentY, paint);
            contentY += lineHeight;
        }

        // Route (prominent)
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setTextSize(FONT_SIZE_BODY_LARGE);
        String from = safeGet(ticket, "journey", "route", "from");
        String to = safeGet(ticket, "journey", "route", "to");
        if ((from != null && !from.isEmpty()) || (to != null && !to.isEmpty())) {
            String routeText = (from == null ? "" : from) + " → " + (to == null ? "" : to);
            canvas.drawText(routeText, x + 12, contentY, paint);
            contentY += lineHeight + 6;
        }

        // Date and time (localized)
        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_CAPTION);
        String date = safeGet(ticket, "journey", "schedule", "date");
        String time = safeGet(ticket, "journey", "schedule", "departureTime");
        if ((date != null && !date.isEmpty()) || (time != null && !time.isEmpty())) {
            canvas.drawText("Departure: " + (date == null ? "" : formatDate(date)) + (time == null || time.isEmpty() ? "" : " at " + time), x + 12, contentY, paint);
        }

        return boxHeight + 26;
    }

    private float drawPassengerSection(Canvas canvas, Paint paint, float x, float y, float width) {
        // Section title
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setTextSize(FONT_SIZE_SECTION_TITLE);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawText("PASSENGER & SEAT", x, y + 14, paint);

        // Content box
        float boxHeight = 130;
        RectF contentBox = new RectF(x, y + 24, x + width, y + 24 + boxHeight);
        drawContentBox(canvas, paint, contentBox);

        float contentY = contentBox.top + 18;
        float lineHeight = LINE_HEIGHT_BODY;

        // Passenger name (safe)
        paint.setColor(Color.BLACK);
        paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
        String passengerName = safeGet(ticket, "passenger", "name");
        if (passengerName != null && !passengerName.isEmpty()) {
            canvas.drawText("Name: " + passengerName, x + 12, contentY, paint);
            contentY += lineHeight;
        }

        // Seat information (safe)
        String compartment = safeGet(ticket, "seat", "compartment");
        String seatNumber = safeGet(ticket, "seat", "number");
        String seatInfo = "";
        if (compartment != null && !compartment.isEmpty()) seatInfo += "Compartment " + compartment;
        if (seatNumber != null && !seatNumber.isEmpty()) seatInfo += (seatInfo.isEmpty() ? "" : ", ") + "Seat " + seatNumber;
        if (!seatInfo.isEmpty()) {
            canvas.drawText("Seat: " + seatInfo, x + 12, contentY, paint);
            contentY += lineHeight;
        }

        // Seat class (try several candidate fields)
        String seatClass = safeGetAny(ticket, new String[]{"seat.clazz", "seat.seatClass", "seat.classType", "seat.class"});
        if (seatClass == null || seatClass.isEmpty()) {
            // fallback: try nested safeGet with seat then field names
            seatClass = safeGet(ticket, "seat", "clazz");
            if (seatClass == null) seatClass = safeGet(ticket, "seat", "seatClass");
            if (seatClass == null) seatClass = safeGet(ticket, "seat", "classType");
            if (seatClass == null) seatClass = safeGet(ticket, "seat", "class");
        }
        if (seatClass != null && !seatClass.isEmpty()) {
            canvas.drawText("Class: " + seatClass, x + 12, contentY, paint);
            contentY += lineHeight;
        }

        // Pricing (localized formatting)
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setTextSize(FONT_SIZE_BODY_LARGE);
        String amtStr = safeGet(ticket, "pricing", "amount");
        String cur = safeGet(ticket, "pricing", "currency");
        double amt = 0.0;
        try { if (amtStr != null && !amtStr.isEmpty()) amt = Double.parseDouble(amtStr); } catch (Exception ignored) { }
        if (amtStr != null) {
            String price = formatCurrency(amt, cur == null ? "BDT" : cur);
            canvas.drawText("Fare: " + price, x + 12, contentY, paint);
        }

        return boxHeight + 26;
    }

    private void drawContentBox(Canvas canvas, Paint paint, RectF bounds) {
        // Light background
        paint.setColor(Color.parseColor("#FAFAFA"));
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(bounds, 8, 8, paint);

        // Border
        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(bounds, 8, 8, paint);
    }

    private void drawQRCodeSection(Canvas canvas, Paint paint, RectF bounds, float y) {
        float qrSize = 76;
        float qrX = bounds.right - qrSize - 28;

        // QR Code box
        RectF qrBox = new RectF(qrX - 5, y - 5, qrX + qrSize + 5, y + qrSize + 5);
        paint.setColor(Color.parseColor("#F8F9FA"));
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(qrBox, 8, 8, paint);
        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(qrBox, 8, 8, paint);

        // QR Code label
        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        drawTextCenter(canvas, paint, "SCAN TO VERIFY", qrX + qrSize/2, y - 8);

        // Generate actual QR code bitmap based on ticket ID and draw it
        String ticketId = safeGet(ticket, "ticket", "ticketId");
        if (ticketId == null || ticketId.isEmpty()) ticketId = "DEFAULT";
        Bitmap qr = generateQrBitmap(ticketId, (int)qrSize);
        if (qr != null) {
            // center the bitmap inside qrBox
            float left = qrBox.left + (qrBox.width() - qr.getWidth())/2f;
            float top = qrBox.top + (qrBox.height() - qr.getHeight())/2f;
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
            for (int x = 0; x < size; x++) {
                for (int y = 0; y < size; y++) {
                    bmp.setPixel(x, y, bm.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }
            return bmp;
        } catch (WriterException e) {
            Log.e(TAG, "QR generation failed", e);
            return null;
        }
    }

    private void drawTicketFooter(Canvas canvas, Paint paint, RectF bounds) {
        float footerHeight = 110;
        RectF footerBounds = new RectF(bounds.left + 12, bounds.bottom - footerHeight - 12,
                                     bounds.right - 12, bounds.bottom - 12);

        // Footer background
        paint.setColor(Color.parseColor("#F8F9FA"));
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(footerBounds, 8, 8, paint);

        // Footer border
        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(footerBounds, 8, 8, paint);

        // Terms and conditions
        paint.setColor(Color.DKGRAY);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        paint.setStyle(Paint.Style.FILL);

        float textX = footerBounds.left + 12;
        float textY = footerBounds.top + 18;
        float lineHeight = LINE_HEIGHT_CAPTION;

        canvas.drawText("TERMS & CONDITIONS:", textX, textY, paint);
        textY += lineHeight;

        String[] terms = {
            "• This ticket is non-transferable and valid only for the named passenger.",
            "• Please arrive at the station at least 30 minutes before departure.",
            "• Valid government-issued ID proof is required for verification.",
            "• Cancellation charges apply as per railway regulations."
        };

        for (String term : terms) {
            canvas.drawText(term, textX, textY, paint);
            textY += lineHeight - 2;
        }

        // Print timestamp and official markings
        paint.setColor(Color.LTGRAY);
        paint.setTextSize(7);
        String timestamp = "Printed: " + new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(new Date());
        canvas.drawText(timestamp, textX, footerBounds.bottom - 12, paint);

        // Official seal
        paint.setColor(Color.parseColor("#0898D9"));
        paint.setTextSize(9);
        drawTextRight(canvas, paint, "OFFICIAL RAILNET TICKET", footerBounds.right - 12, footerBounds.bottom - 12);

        // Subtle watermark
        drawWatermark(canvas, paint, bounds);
    }

    private void drawWatermark(Canvas canvas, Paint paint, RectF bounds) {
        paint.setColor(Color.parseColor("#EAF6FF"));
        paint.setTextSize(36);
        canvas.save();
        canvas.rotate(-45, bounds.centerX(), bounds.centerY());
        canvas.drawText("RAILNET", bounds.centerX() - 80, bounds.centerY(), paint);
        canvas.restore();
    }

    // Professional text drawing utilities
    private void drawTextLeft(Canvas canvas, Paint paint, String text, float x, float y) {
        paint.setStyle(Paint.Style.FILL);
        canvas.drawText(text, x, y, paint);
    }

    private void drawTextRight(Canvas canvas, Paint paint, String text, float rightX, float y) {
        paint.setStyle(Paint.Style.FILL);
        float textWidth = paint.measureText(text);
        canvas.drawText(text, rightX - textWidth, y, paint);
    }

    private void drawTextCenter(Canvas canvas, Paint paint, String text, float centerX, float y) {
        paint.setStyle(Paint.Style.FILL);
        float textWidth = paint.measureText(text);
        canvas.drawText(text, centerX - textWidth/2, y, paint);
    }

    // Helpers: localized formatting & safe reflection-based getters
    private String formatDate(String input) {
        if (input == null || input.isEmpty()) return "";
        // Try common patterns (yyyy-MM-dd or yyyy-MM-dd'T'..)
        try {
            String s = input.length() >= 10 ? input.substring(0, 10) : input;
            SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date d = iso.parse(s);
            if (d != null) return DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.getDefault()).format(d);
        } catch (Exception ignored) { }
        return input;
    }

    private String formatCurrency(double amount, String currencyCode) {
        try {
            Locale locale = Locale.getDefault();
            // prefer activity/app locale if context available
            try {
                if (context != null) {
                    Locale ctxLocale = context.getResources().getConfiguration().getLocales().get(0);
                    if (ctxLocale != null) locale = ctxLocale;
                }
            } catch (Exception ignored) { }
            NumberFormat nf = NumberFormat.getCurrencyInstance(locale);
            if (currencyCode != null && !currencyCode.isEmpty()) {
                try {
                    Currency c = Currency.getInstance(currencyCode);
                    nf.setCurrency(c);
                } catch (Exception ignored) { }
            }
            return nf.format(amount);
        } catch (Exception e) {
            return (currencyCode == null ? "BDT" : currencyCode) + " " + String.format(Locale.getDefault(), "%.2f", amount);
        }
    }

    // Reflection helpers: safe navigate nested properties/getters
    private String safeGet(Object root, String... path) {
        if (root == null || path == null || path.length == 0) return null;
        Object cur = root;
        for (String p : path) {
            if (cur == null) return null;
            cur = getFieldOrGetter(cur, p);
        }
        return cur == null ? null : String.valueOf(cur);
    }

    private String safeGetAny(Object root, String[] dottedCandidates) {
        if (root == null || dottedCandidates == null) return null;
        for (String cand : dottedCandidates) {
            if (cand == null || cand.isEmpty()) continue;
            String[] parts = cand.split("\\.");
            String val = safeGet(root, parts);
            if (val != null && !val.isEmpty()) return val;
        }
        return null;
    }

    private Object getFieldOrGetter(Object obj, String name) {
        if (obj == null || name == null) return null;
        Class<?> cls = obj.getClass();
        // try nested dotted name (e.g., "seat.number")
        if (name.contains(".")) {
            String[] parts = name.split("\\.");
            Object cur = obj;
            for (String p : parts) {
                cur = getFieldOrGetter(cur, p);
                if (cur == null) return null;
            }
            return cur;
        }
        // Try getter methods: getName, isName, name()
        String cap = Character.toUpperCase(name.charAt(0)) + name.substring(1);
        String[] methods = new String[]{"get" + cap, "is" + cap, name};
        for (String mName : methods) {
            try {
                Method m = cls.getMethod(mName);
                return m.invoke(obj);
            } catch (Exception ignored) { }
        }
        // try public field
        try {
            Field f = cls.getField(name);
            return f.get(obj);
        } catch (Exception ignored) { }
        // try declared field
        try {
            Field f = cls.getDeclaredField(name);
            f.setAccessible(true);
            return f.get(obj);
        } catch (Exception ignored) { }
        return null;
    }
}
