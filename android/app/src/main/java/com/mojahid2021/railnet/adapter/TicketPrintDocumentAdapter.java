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
 * TicketPrintDocumentAdapter handles PDF generation for railway tickets.
 *
 * Features:
 * - Professional railway ticket layout
 * - QR code generation for verification
 * - RailNet font support
 * - Status-based color coding
 * - Comprehensive passenger and journey details
 */
public class TicketPrintDocumentAdapter extends PrintDocumentAdapter {

    // Constants
    private static final String TAG = "TicketPrintAdapter";

    // Page dimensions (A4 in points)
    private static final float PAGE_WIDTH = 595f;
    private static final float PAGE_HEIGHT = 842f;
    private static final float MARGIN = 40f;

    // Typography constants
    private static final float FONT_SIZE_LOGO = 28f;
    private static final float FONT_SIZE_SUBTITLE = 10f;
    private static final float FONT_SIZE_BADGE = 12f;
    private static final float FONT_SIZE_TICKET_ID = 16f;
    private static final float FONT_SIZE_SECTION_TITLE = 14f;
    private static final float FONT_SIZE_BODY_LARGE = 12f;
    private static final float FONT_SIZE_BODY_MEDIUM = 11f;
    private static final float FONT_SIZE_CAPTION = 9f;
    private static final float FONT_SIZE_FINE_PRINT = 8f;

    // Spacing constants
    private static final float LINE_HEIGHT_BODY = 16f;
    private static final float LINE_HEIGHT_CAPTION = 12f;
    private static final float SECTION_SPACING = 18f;
    private static final float BOX_PADDING = 12f;

    // Layout constants
    private static final float HEADER_HEIGHT = 90f;
    private static final float JOURNEY_BOX_HEIGHT = 140f;
    private static final float PASSENGER_BOX_HEIGHT = 160f;
    private static final float FOOTER_HEIGHT = 110f;
    private static final float QR_SIZE = 76f;
    private static final float CORNER_RADIUS = 8f;

    // Color constants
    private static final int COLOR_PRIMARY = 0xFF0898D9;
    private static final int COLOR_BACKGROUND_LIGHT = 0xFFFAFAFA;
    private static final int COLOR_BACKGROUND_HEADER = 0xFFEAF6FF;
    private static final int COLOR_WHITE = 0xFFFFFFFF;
    private static final int COLOR_GRAY_LIGHT = 0xFFEEEEEE;
    private static final int COLOR_GRAY_DARK = 0xFF424242;
    private static final int COLOR_GRAY_MEDIUM = 0xFF757575;

    // Status colors
    private static final int COLOR_STATUS_CONFIRMED = 0xFF4CAF50;
    private static final int COLOR_STATUS_PENDING = 0xFFFF9800;
    private static final int COLOR_STATUS_CANCELLED = 0xFFF44336;
    private static final int COLOR_STATUS_COMPLETED = 0xFF2196F3;
    private static final int COLOR_STATUS_EXPIRED = 0xFF9E9E9E;

    // Payment status colors
    private static final int COLOR_PAYMENT_PAID = 0xFF4CAF50;
    private static final int COLOR_PAYMENT_PENDING = 0xFFFF9800;
    private static final int COLOR_PAYMENT_FAILED = 0xFFF44336;
    private static final int COLOR_PAYMENT_REFUNDED = 0xFF2196F3;
    private static final int COLOR_PAYMENT_EXPIRED = 0xFF9E9E9E;

    // Instance variables
    private final Context context;
    private final UserTicket ticket;
    private final com.google.gson.JsonObject jsonTicket;
    private final Typeface railNetTypeface;

    /**
     * Constructor for UserTicket model
     */
    public TicketPrintDocumentAdapter(Context context, UserTicket ticket) {
        this.context = context;
        this.ticket = ticket;
        this.jsonTicket = null;
        this.railNetTypeface = loadRailNetTypeface();
    }

    /**
     * Constructor for JSON object
     */
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

        String documentName = generateDocumentName();
        PrintDocumentInfo info = new PrintDocumentInfo.Builder(documentName)
                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                .setPageCount(1)
                .build();

        callback.onLayoutFinished(info, true);
    }

    @Override
    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                        CancellationSignal cancellationSignal, WriteResultCallback callback) {
        PdfDocument pdfDocument = new PdfDocument();

        try {
            PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(
                    (int) PAGE_WIDTH, (int) PAGE_HEIGHT, 1).create();
            PdfDocument.Page page = pdfDocument.startPage(pageInfo);

            drawTicket(page.getCanvas());
            pdfDocument.finishPage(page);

            writePdfToDestination(pdfDocument, destination);
            callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});

        } catch (IOException e) {
            Log.e(TAG, "Error writing PDF", e);
            callback.onWriteFailed(e.getMessage());
        } finally {
            pdfDocument.close();
        }
    }

    /**
     * Generates a document name based on ticket ID
     */
    private String generateDocumentName() {
        String ticketId = safeGet("ticket", "ticketId");
        if (ticketId != null && !ticketId.isEmpty()) {
            return "RailNet_Ticket_" + ticketId;
        }
        return "RailNet_Ticket";
    }

    /**
     * Writes PDF document to the destination file descriptor
     */
    private void writePdfToDestination(PdfDocument pdfDocument, ParcelFileDescriptor destination)
            throws IOException {
        try (FileOutputStream outputStream = new FileOutputStream(destination.getFileDescriptor())) {
            pdfDocument.writeTo(outputStream);
        }
    }

    /**
     * Main method to draw the ticket on the canvas
     */
    private void drawTicket(Canvas canvas) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ensureNormalTypeface(paint);
        paint.setColor(COLOR_GRAY_DARK);

        RectF ticketBounds = new RectF(MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN);

        // Draw ticket background
        drawTicketBackground(canvas, paint, ticketBounds);

        // Draw ticket sections
        float currentY = ticketBounds.top + 8;
        currentY = drawTicketHeader(canvas, paint, ticketBounds, currentY);
        drawMainContent(canvas, paint, ticketBounds, currentY);
        drawTicketFooter(canvas, paint, ticketBounds);
    }

    /**
     * Draws the ticket background
     */
    private void drawTicketBackground(Canvas canvas, Paint paint, RectF bounds) {
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(COLOR_WHITE);
        canvas.drawRect(bounds, paint);
    }

    /**
     * Draws the ticket header section
     */
    private float drawTicketHeader(Canvas canvas, Paint paint, RectF bounds, float startY) {
        ensureNormalTypeface(paint);

        RectF headerBounds = new RectF(bounds.left + 12, startY,
                bounds.right - 12, startY + HEADER_HEIGHT);

        // Draw header background
        paint.setColor(COLOR_BACKGROUND_HEADER);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(headerBounds, CORNER_RADIUS, CORNER_RADIUS, paint);

        // Draw logo and title
        drawHeaderLogoAndTitle(canvas, paint, headerBounds);

        // Draw ticket info (ID, status, expiry)
        drawHeaderTicketInfo(canvas, paint, headerBounds);

        return headerBounds.bottom + 12;
    }

    /**
     * Draws the logo and title in the header
     */
    private void drawHeaderLogoAndTitle(Canvas canvas, Paint paint, RectF headerBounds) {
        float leftX = headerBounds.left + 18;
        float y = headerBounds.top + 24;

        // Logo
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_LOGO);
        drawTextLeft(canvas, paint, "RailNet", leftX, y);

        // Subtitle
        paint.setTextSize(FONT_SIZE_SUBTITLE);
        paint.setColor(COLOR_GRAY_DARK);
        drawTextLeft(canvas, paint, "BANGLADESH RAILWAY NETWORK", leftX, y + 18);
    }

    /**
     * Draws ticket information in the header
     */
    private void drawHeaderTicketInfo(Canvas canvas, Paint paint, RectF headerBounds) {
        float rightX = headerBounds.right - 18;

        // Ticket ID
        String ticketId = safeGet("ticket", "ticketId");
        if (ticketId == null || ticketId.isEmpty()) ticketId = "TKT-XXXX";

        paint.setTextSize(FONT_SIZE_TICKET_ID);
        paint.setColor(Color.BLACK);
        drawTextRight(canvas, paint, "TICKET #" + ticketId, rightX, headerBounds.top + 22);

        // Status badge
        String status = safeGet("ticket", "status");
        String statusText = getStatusWithEmoji(status);
        int statusColor = getStatusColor(status);
        paint.setTextSize(FONT_SIZE_BADGE);
        paint.setColor(statusColor);
        drawTextRight(canvas, paint, statusText, rightX, headerBounds.top + 42);

        // Expiry
        paint.setTextSize(FONT_SIZE_SUBTITLE);
        paint.setColor(COLOR_GRAY_MEDIUM);
        String expiresAt = safeGet("ticket", "expiresAt");
        if (expiresAt != null && !expiresAt.isEmpty()) {
            drawTextRight(canvas, paint, "Expires: " + formatExpiry(expiresAt),
                    rightX, headerBounds.top + 56);
        }

        // Print timestamp
        String printed = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, Locale.getDefault())
                .format(new Date());
        drawTextRight(canvas, paint, printed, rightX, headerBounds.bottom - 10);
    }

    /**
     * Draws the main content sections (journey, passenger, QR)
     */
    private void drawMainContent(Canvas canvas, Paint paint, RectF bounds, float startY) {
        float contentWidth = bounds.width() - 30;
        float leftSectionWidth = contentWidth * 0.58f;
        float rightSectionWidth = contentWidth * 0.38f;
        float sectionSpacing = contentWidth * 0.04f;

        float leftX = bounds.left + 15;
        float rightX = leftX + leftSectionWidth + sectionSpacing;

        // Draw journey and passenger sections
        float journeyHeight = drawJourneySection(canvas, paint, leftX, startY, leftSectionWidth);
        float passengerHeight = drawPassengerSection(canvas, paint, rightX, startY, rightSectionWidth);

        // Draw QR code section
        float qrY = startY + Math.max(journeyHeight, passengerHeight) + SECTION_SPACING;
        drawQRCodeSection(canvas, paint, bounds, qrY);
    }

    /**
     * Draws the journey details section
     */
    private float drawJourneySection(Canvas canvas, Paint paint, float x, float y, float width) {
        ensureNormalTypeface(paint);

        // Section title
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_SECTION_TITLE);
        drawTextLeft(canvas, paint, "JOURNEY DETAILS", x, y + 14);

        // Content box
        float boxHeight = JOURNEY_BOX_HEIGHT;
        RectF contentBox = new RectF(x, y + 24, x + width, y + 24 + boxHeight);
        drawContentBox(canvas, paint, contentBox);

        // Content
        float contentY = contentBox.top + BOX_PADDING;
        contentY = drawJourneyContent(canvas, paint, x + BOX_PADDING, contentY);

        return boxHeight + 26;
    }

    /**
     * Draws the journey content inside the box
     */
    private float drawJourneyContent(Canvas canvas, Paint paint, float x, float contentY) {
        float lineHeight = LINE_HEIGHT_BODY;

        // Train info
        paint.setColor(Color.BLACK);
        paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
        String trainName = safeGet("journey", "train", "name");
        String trainNumber = safeGet("journey", "train", "number");
        String trainInfo = buildTrainInfo(trainName, trainNumber);
        if (!trainInfo.isEmpty()) {
            drawTextLeft(canvas, paint, "🚂 Train: " + trainInfo, x, contentY);
            contentY += lineHeight;
        }

        // Route
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_BODY_LARGE);
        String from = safeGet("journey", "route", "from");
        String to = safeGet("journey", "route", "to");
        String routeText = buildRouteText(from, to);
        if (!routeText.isEmpty()) {
            drawTextLeft(canvas, paint, "📍 Route: " + routeText, x, contentY);
            contentY += lineHeight + 6;
        }

        // Departure
        paint.setColor(COLOR_GRAY_DARK);
        paint.setTextSize(FONT_SIZE_CAPTION);
        String date = safeGet("journey", "schedule", "date");
        String time = safeGet("journey", "schedule", "departureTime");
        String departureText = buildDepartureText(date, time);
        if (!departureText.isEmpty()) {
            drawTextLeft(canvas, paint, "📅 Departure: " + departureText, x, contentY);
            contentY += lineHeight;
        }

        // Status
        String ticketStatus = safeGet("ticket", "status");
        if (ticketStatus != null && !ticketStatus.isEmpty()) {
            paint.setColor(getStatusColor(ticketStatus));
            paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
            drawTextLeft(canvas, paint, "📋 Status: " + getStatusWithEmoji(ticketStatus), x, contentY);
        }

        return contentY;
    }

    /**
     * Builds train information string
     */
    private String buildTrainInfo(String name, String number) {
        StringBuilder info = new StringBuilder();
        if (name != null && !name.isEmpty()) {
            info.append(name);
        }
        if (number != null && !number.isEmpty()) {
            if (info.length() > 0) info.append(" ");
            info.append("(").append(number).append(")");
        }
        return info.toString();
    }

    /**
     * Builds route text
     */
    private String buildRouteText(String from, String to) {
        StringBuilder route = new StringBuilder();
        if (from != null && !from.isEmpty()) {
            route.append(from);
        }
        if (to != null && !to.isEmpty()) {
            if (route.length() > 0) route.append(" → ");
            else route.append("To: ");
            route.append(to);
        }
        return route.toString();
    }

    /**
     * Builds departure text
     */
    private String buildDepartureText(String date, String time) {
        StringBuilder departure = new StringBuilder();
        if (date != null && !date.isEmpty()) {
            departure.append(formatDate(date));
        }
        if (time != null && !time.isEmpty()) {
            if (departure.length() > 0) departure.append(" at ");
            departure.append(time);
        }
        return departure.toString();
    }

    /**
     * Draws the passenger details section
     */
    private float drawPassengerSection(Canvas canvas, Paint paint, float x, float y, float width) {
        ensureNormalTypeface(paint);

        // Section title
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_SECTION_TITLE);
        drawTextLeft(canvas, paint, "PASSENGER DETAILS", x, y + 14);

        // Content box
        float boxHeight = PASSENGER_BOX_HEIGHT;
        RectF contentBox = new RectF(x, y + 24, x + width, y + 24 + boxHeight);
        drawContentBox(canvas, paint, contentBox);

        // Content
        float contentY = contentBox.top + BOX_PADDING;
        drawPassengerContent(canvas, paint, x + BOX_PADDING, contentY);

        return boxHeight + 26;
    }

    /**
     * Draws the passenger content inside the box
     */
    private void drawPassengerContent(Canvas canvas, Paint paint, float x, float contentY) {
        float lineHeight = LINE_HEIGHT_BODY;

        // Name
        paint.setColor(Color.BLACK);
        paint.setTextSize(FONT_SIZE_BODY_MEDIUM);
        String passengerName = safeGet("passenger", "name");
        if (passengerName != null && !passengerName.isEmpty()) {
            drawTextLeft(canvas, paint, "👤 Name: " + passengerName, x, contentY);
            contentY += lineHeight;
        }

        // Age and Gender
        String age = safeGet("passenger", "age");
        String gender = safeGet("passenger", "gender");
        String demographics = buildDemographicsText(age, gender);
        if (!demographics.isEmpty()) {
            drawTextLeft(canvas, paint, "📊 " + demographics, x, contentY);
            contentY += lineHeight;
        }

        // Seat
        String compartment = safeGet("seat", "compartment");
        String seatNumber = safeGet("seat", "number");
        String seatInfo = buildSeatInfo(compartment, seatNumber);
        if (!seatInfo.isEmpty()) {
            drawTextLeft(canvas, paint, "💺 Seat: " + seatInfo, x, contentY);
            contentY += lineHeight;
        }

        // Class
        String seatClass = safeGet("seat", "class");
        if (seatClass != null && !seatClass.isEmpty()) {
            drawTextLeft(canvas, paint, "🏷️ Class: " + seatClass, x, contentY);
            contentY += lineHeight;
        }

        // Payment status
        String paymentStatus = safeGet("ticket", "paymentStatus");
        if (paymentStatus != null && !paymentStatus.isEmpty()) {
            paint.setColor(getPaymentStatusColor(paymentStatus));
            drawTextLeft(canvas, paint, "💳 Payment: " + getPaymentStatusText(paymentStatus), x, contentY);
            contentY += lineHeight;
            paint.setColor(Color.BLACK);
        }

        // Fare
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(FONT_SIZE_BODY_LARGE);
        String amtStr = safeGet("pricing", "amount");
        String cur = safeGet("pricing", "currency");
        String price = formatPrice(amtStr, cur);
        if (price != null) {
            drawTextLeft(canvas, paint, "💰 Fare: " + price, x, contentY);
        }
    }

    /**
     * Builds demographics text (age and gender)
     */
    private String buildDemographicsText(String age, String gender) {
        StringBuilder demographics = new StringBuilder();
        if (age != null && !age.isEmpty()) {
            demographics.append("Age: ").append(age);
        }
        if (gender != null && !gender.isEmpty()) {
            if (demographics.length() > 0) demographics.append(" • ");
            demographics.append(gender);
        }
        return demographics.toString();
    }

    /**
     * Builds seat information text
     */
    private String buildSeatInfo(String compartment, String seatNumber) {
        StringBuilder seatInfo = new StringBuilder();
        if (compartment != null && !compartment.isEmpty()) {
            seatInfo.append(compartment);
        }
        if (seatNumber != null && !seatNumber.isEmpty()) {
            if (seatInfo.length() > 0) seatInfo.append(" - ");
            seatInfo.append(seatNumber);
        }
        return seatInfo.toString();
    }

    /**
     * Formats price with currency
     */
    private String formatPrice(String amountStr, String currencyCode) {
        if (amountStr == null || amountStr.isEmpty()) return null;

        try {
            double amount = Double.parseDouble(amountStr);
            return formatCurrency(amount, currencyCode != null ? currencyCode : "BDT");
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Draws the QR code section
     */
    private void drawQRCodeSection(Canvas canvas, Paint paint, RectF bounds, float y) {
        ensureNormalTypeface(paint);

        float qrX = bounds.right - QR_SIZE - 28;
        RectF qrBox = new RectF(qrX - 5, y - 5, qrX + QR_SIZE + 5, y + QR_SIZE + 5);

        // QR box background
        paint.setColor(COLOR_GRAY_LIGHT);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(qrBox, CORNER_RADIUS, CORNER_RADIUS, paint);

        // QR box border
        paint.setColor(COLOR_GRAY_LIGHT);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(qrBox, CORNER_RADIUS, CORNER_RADIUS, paint);

        // QR label
        paint.setColor(COLOR_GRAY_DARK);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        paint.setStyle(Paint.Style.FILL);
        drawTextCenter(canvas, paint, "SCAN TO VERIFY", qrX + QR_SIZE / 2, y - 8);

        // Generate and draw QR code
        String ticketId = safeGet("ticket", "ticketId");
        if (ticketId == null || ticketId.isEmpty()) ticketId = "DEFAULT";
        Bitmap qr = generateQrBitmap(ticketId, (int) QR_SIZE);
        if (qr != null) {
            float left = qrBox.left + (qrBox.width() - qr.getWidth()) / 2f;
            float top = qrBox.top + (qrBox.height() - qr.getHeight()) / 2f;
            canvas.drawBitmap(qr, left, top, null);
        }
    }

    /**
     * Draws the ticket footer with terms and watermark
     */
    private void drawTicketFooter(Canvas canvas, Paint paint, RectF bounds) {
        ensureNormalTypeface(paint);

        RectF footerBounds = new RectF(bounds.left + 12, bounds.bottom - FOOTER_HEIGHT - 12,
                bounds.right - 12, bounds.bottom - 12);

        // Footer background
        paint.setColor(COLOR_GRAY_LIGHT);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(footerBounds, CORNER_RADIUS, CORNER_RADIUS, paint);

        // Footer border
        paint.setColor(COLOR_GRAY_LIGHT);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(footerBounds, CORNER_RADIUS, CORNER_RADIUS, paint);

        // Terms and conditions
        drawTermsAndConditions(canvas, paint, footerBounds);

        // Watermark
        drawWatermark(canvas, paint, bounds);
    }

    /**
     * Draws terms and conditions in the footer
     */
    private void drawTermsAndConditions(Canvas canvas, Paint paint, RectF footerBounds) {
        paint.setColor(COLOR_GRAY_DARK);
        paint.setTextSize(FONT_SIZE_FINE_PRINT);
        paint.setStyle(Paint.Style.FILL);

        float textX = footerBounds.left + BOX_PADDING;
        float textY = footerBounds.top + BOX_PADDING;
        float lineHeight = LINE_HEIGHT_CAPTION;

        // Title
        drawTextLeft(canvas, paint, "TERMS & CONDITIONS:", textX, textY);
        textY += lineHeight;

        // Terms list
        String[] terms = {
                "• This ticket is non-transferable and valid only for the named passenger.",
                "• Please arrive at the station at least 30 minutes before departure.",
                "• Valid government-issued ID proof is required for verification.",
                "• Cancellation charges apply as per railway regulations."
        };

        for (String term : terms) {
            drawTextLeft(canvas, paint, term, textX, textY);
            textY += lineHeight - 2;
        }

        // Timestamp
        paint.setColor(COLOR_GRAY_MEDIUM);
        paint.setTextSize(7);
        String timestamp = "Printed: " + new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(new Date());
        drawTextLeft(canvas, paint, timestamp, textX, footerBounds.bottom - BOX_PADDING);

        // Official text
        paint.setColor(COLOR_PRIMARY);
        paint.setTextSize(9);
        drawTextRight(canvas, paint, "OFFICIAL RAILNET TICKET", footerBounds.right - BOX_PADDING, footerBounds.bottom - BOX_PADDING);
    }

    /**
     * Draws the watermark
     */
    private void drawWatermark(Canvas canvas, Paint paint, RectF bounds) {
        paint.setColor(0xFFEAF6FF);
        paint.setTextSize(36);
        canvas.save();
        canvas.rotate(-45, bounds.centerX(), bounds.centerY());
        drawTextLeft(canvas, paint, "RAILNET", bounds.centerX() - 80, bounds.centerY());
        canvas.restore();
    }

    /**
     * Draws content box with background and border
     */
    private void drawContentBox(Canvas canvas, Paint paint, RectF bounds) {
        paint.setColor(COLOR_BACKGROUND_LIGHT);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawRoundRect(bounds, CORNER_RADIUS, CORNER_RADIUS, paint);

        paint.setColor(Color.LTGRAY);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1);
        canvas.drawRoundRect(bounds, CORNER_RADIUS, CORNER_RADIUS, paint);
    }

    /**
     * Generates QR code bitmap
     */
    private Bitmap generateQrBitmap(String data, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            HashMap<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, size, size, hints);
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);

            for (int x = 0; x < size; x++) {
                for (int y = 0; y < size; y++) {
                    bitmap.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }

            return bitmap;
        } catch (WriterException e) {
            Log.e(TAG, "QR generation failed", e);
            return null;
        }
    }

    /**
     * Draws text aligned to the left
     */
    private void drawTextLeft(Canvas canvas, Paint paint, String text, float x, float y) {
        ensureNormalTypeface(paint);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawText(text, x, y, paint);
    }

    /**
     * Draws text aligned to the right
     */
    private void drawTextRight(Canvas canvas, Paint paint, String text, float rightX, float y) {
        ensureNormalTypeface(paint);
        paint.setStyle(Paint.Style.FILL);
        float textWidth = paint.measureText(text);
        canvas.drawText(text, rightX - textWidth, y, paint);
    }

    /**
     * Draws text centered horizontally
     */
    private void drawTextCenter(Canvas canvas, Paint paint, String text, float centerX, float y) {
        ensureNormalTypeface(paint);
        paint.setStyle(Paint.Style.FILL);
        float textWidth = paint.measureText(text);
        canvas.drawText(text, centerX - textWidth / 2, y, paint);
    }

    /**
     * Formats date for display
     */
    private String formatDate(String input) {
        if (input == null || input.isEmpty()) return "";
        try {
            String datePart = input.length() >= 10 ? input.substring(0, 10) : input;
            SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            Date date = iso.parse(datePart);
            if (date != null) {
                return DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.getDefault()).format(date);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse date: " + input, e);
        }
        return input;
    }

    /**
     * Formats expiry date
     */
    private String formatExpiry(String iso) {
        if (iso == null || iso.isEmpty()) return "Expiry not set";
        try {
            String datePart = iso;
            String timePart = null;
            if (iso.contains("T")) {
                String[] parts = iso.split("T");
                datePart = parts[0];
                timePart = parts.length > 1 ? parts[1] : null;
            }

            Date date = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(datePart);
            String formattedDate = date != null ?
                    DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.getDefault()).format(date) : datePart;

            if (timePart != null && timePart.length() >= 5) {
                return formattedDate + " • " + timePart.substring(0, 5);
            }
            return formattedDate;
        } catch (Exception e) {
            Log.w(TAG, "Failed to format expiry: " + iso, e);
            return iso;
        }
    }

    /**
     * Formats currency amount
     */
    private String formatCurrency(double amount, String currencyCode) {
        try {
            Locale locale = Locale.getDefault();
            if (context != null) {
                Locale contextLocale = context.getResources().getConfiguration().getLocales().get(0);
                if (contextLocale != null) locale = contextLocale;
            }

            NumberFormat format = NumberFormat.getCurrencyInstance(locale);
            if (currencyCode != null && !currencyCode.isEmpty()) {
                try {
                    Currency currency = Currency.getInstance(currencyCode);
                    format.setCurrency(currency);
                } catch (Exception e) {
                    Log.w(TAG, "Invalid currency code: " + currencyCode, e);
                }
            }
            return format.format(amount);
        } catch (Exception e) {
            Log.w(TAG, "Currency formatting failed", e);
            return (currencyCode != null ? currencyCode : "BDT") + " " + String.format(Locale.getDefault(), "%.2f", amount);
        }
    }

    /**
     * Safely gets value from ticket or JSON
     */
    private String safeGet(String... path) {
        if (ticket != null) {
            return safeGetFromObject(ticket, path);
        } else if (jsonTicket != null) {
            return safeGetFromJson(jsonTicket, path);
        }
        return null;
    }

    /**
     * Safely gets value from object using reflection
     */
    private String safeGetFromObject(Object obj, String... path) {
        if (obj == null || path.length == 0) return null;

        Object current = obj;
        for (String segment : path) {
            if (current == null) return null;
            current = getFieldOrGetter(current, segment);
        }
        return current != null ? String.valueOf(current) : null;
    }

    /**
     * Safely gets value from JSON object
     */
    private String safeGetFromJson(com.google.gson.JsonObject json, String... path) {
        try {
            com.google.gson.JsonElement current = json;
            for (String key : path) {
                if (!(current instanceof com.google.gson.JsonObject)) return null;
                com.google.gson.JsonObject obj = current.getAsJsonObject();
                if (!obj.has(key)) return null;
                current = obj.get(key);
            }
            if (current == null || current.isJsonNull()) return null;
            if (current.isJsonPrimitive()) {
                return current.getAsJsonPrimitive().getAsString();
            }
            return current.toString();
        } catch (Exception e) {
            Log.w(TAG, "Error accessing JSON path: " + java.util.Arrays.toString(path), e);
            return null;
        }
    }

    /**
     * Gets field value using reflection
     */
    private Object getFieldOrGetter(Object obj, String name) {
        if (obj == null || name == null) return null;

        Class<?> clazz = obj.getClass();
        if (name.contains(".")) {
            String[] parts = name.split("\\.");
            Object current = obj;
            for (String part : parts) {
                current = getFieldOrGetter(current, part);
                if (current == null) return null;
            }
            return current;
        }

        String capitalized = Character.toUpperCase(name.charAt(0)) + name.substring(1);
        String[] methodNames = {"get" + capitalized, "is" + capitalized, name};

        for (String methodName : methodNames) {
            try {
                java.lang.reflect.Method method = clazz.getMethod(methodName);
                return method.invoke(obj);
            } catch (Exception ignored) {}
        }

        try {
            java.lang.reflect.Field field = clazz.getField(name);
            return field.get(obj);
        } catch (Exception ignored) {}

        try {
            java.lang.reflect.Field field = clazz.getDeclaredField(name);
            field.setAccessible(true);
            return field.get(obj);
        } catch (Exception ignored) {}

        return null;
    }

    /**
     * Gets status text with emoji
     */
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

    /**
     * Gets status color
     */
    private int getStatusColor(String status) {
        if (status == null) return COLOR_GRAY_MEDIUM;
        switch (status.toLowerCase()) {
            case "confirmed": return COLOR_STATUS_CONFIRMED;
            case "pending": return COLOR_STATUS_PENDING;
            case "cancelled": return COLOR_STATUS_CANCELLED;
            case "completed": return COLOR_STATUS_COMPLETED;
            case "expired": return COLOR_STATUS_EXPIRED;
            default: return COLOR_GRAY_MEDIUM;
        }
    }

    /**
     * Gets payment status text
     */
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

    /**
     * Gets payment status color
     */
    private int getPaymentStatusColor(String paymentStatus) {
        if (paymentStatus == null) return COLOR_GRAY_MEDIUM;
        switch (paymentStatus.toLowerCase()) {
            case "paid": return COLOR_PAYMENT_PAID;
            case "pending": return COLOR_PAYMENT_PENDING;
            case "failed": return COLOR_PAYMENT_FAILED;
            case "refunded": return COLOR_PAYMENT_REFUNDED;
            case "expired": return COLOR_PAYMENT_EXPIRED;
            default: return COLOR_GRAY_MEDIUM;
        }
    }

    /**
     * Ensures normal typeface is used
     */
    private void ensureNormalTypeface(Paint paint) {
        if (paint == null) return;
        try {
            if (railNetTypeface != null) {
                paint.setTypeface(railNetTypeface);
            } else {
                paint.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
            }
        } catch (Exception e) {
            paint.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        }
        paint.setFakeBoldText(false);
        paint.setTextSkewX(0f);
        paint.setTextScaleX(1f);
        try {
            paint.setSubpixelText(true);
            paint.setLinearText(true);
        } catch (Throwable ignored) {}
        try {
            paint.setLetterSpacing(0f);
        } catch (Throwable ignored) {}
    }

    /**
     * Loads RailNet typeface
     */
    private Typeface loadRailNetTypeface() {
        try {
            int resId = context.getResources().getIdentifier("railnet_regular", "font", context.getPackageName());
            if (resId != 0) {
                Typeface typeface = ResourcesCompat.getFont(context, resId);
                if (typeface != null) {
                    return Typeface.create(typeface, Typeface.NORMAL);
                }
            }
            try {
                return Typeface.createFromAsset(context.getAssets(), "fonts/RailNet-Regular.ttf");
            } catch (Exception ignored) {}
        } catch (Exception ignored) {}
        return Typeface.create("sans-serif", Typeface.NORMAL);
    }
}
