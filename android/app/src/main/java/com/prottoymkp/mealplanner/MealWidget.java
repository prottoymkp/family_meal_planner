package com.prottoymkp.mealplanner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MealWidget extends AppWidgetProvider {

    private static final String API_URL =
        "https://script.google.com/macros/s/AKfycbzdKhkahyOtt6zT06_jP60-6I46fGI-xzM2F9DKdKYXuvDWOSkrBHX7ygyEijtnVE17hg/exec";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int widgetId) {
        // Show initial loading state
        RemoteViews views = buildViews(context, null, "Loading…");
        appWidgetManager.updateAppWidget(widgetId, views);

        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler handler = new Handler(Looper.getMainLooper());

        executor.execute(() -> {
            String[] result = fetchMeals(dateStr);
            String errorMsg = (result == null) ? "Could not load data" : null;

            handler.post(() -> {
                RemoteViews updated = buildViews(context, result, errorMsg);
                appWidgetManager.updateAppWidget(widgetId, updated);
            });
        });
    }

    private static RemoteViews buildViews(Context context, String[] slots, String statusMsg) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_meal_planner);

        // Teal background
        views.setInt(R.id.widget_root, "setBackgroundColor", Color.parseColor("#0F6E56"));

        // Date label
        String today = new SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(new Date());
        views.setTextViewText(R.id.widget_date, today);

        // Tap → open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pi);

        if (slots != null) {
            views.setTextViewText(R.id.widget_breakfast, slots[0].isEmpty() ? "—" : slots[0]);
            views.setTextViewText(R.id.widget_lunch,     slots[1].isEmpty() ? "—" : slots[1]);
            views.setTextViewText(R.id.widget_snack,     slots[2].isEmpty() ? "—" : slots[2]);
            views.setTextViewText(R.id.widget_dinner,    slots[3].isEmpty() ? "—" : slots[3]);
            views.setViewVisibility(R.id.widget_status, android.view.View.GONE);
        } else {
            views.setTextViewText(R.id.widget_breakfast, "—");
            views.setTextViewText(R.id.widget_lunch,     "—");
            views.setTextViewText(R.id.widget_snack,     "—");
            views.setTextViewText(R.id.widget_dinner,    "—");
            views.setTextViewText(R.id.widget_status, statusMsg != null ? statusMsg : "");
            views.setViewVisibility(R.id.widget_status,
                statusMsg != null ? android.view.View.VISIBLE : android.view.View.GONE);
        }
        return views;
    }

    private static String[] fetchMeals(String date) {
        try {
            String urlStr = API_URL + "?action=getMealPlanDay&date=" + date;

            // Follow up to 5 redirects (Apps Script redirects HTTPS→HTTPS)
            for (int i = 0; i < 5; i++) {
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);
                conn.setInstanceFollowRedirects(false);
                conn.setRequestProperty("User-Agent", "MealPlannerWidget/1.0");

                int code = conn.getResponseCode();
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    String location = conn.getHeaderField("Location");
                    conn.disconnect();
                    if (location == null) return null;
                    urlStr = location;
                    continue;
                }
                if (code != 200) return null;

                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();
                conn.disconnect();

                JSONObject json = new JSONObject(sb.toString());
                JSONArray meals = json.optJSONArray("meals");
                String[] slots = {"", "", "", ""};
                if (meals != null) {
                    for (int j = 0; j < meals.length(); j++) {
                        JSONObject meal = meals.getJSONObject(j);
                        String slot = meal.optString("slot", "");
                        String name = meal.optString("recipeName", "");
                        switch (slot) {
                            case "Breakfast": slots[0] = name; break;
                            case "Lunch":     slots[1] = name; break;
                            case "Snack":     slots[2] = name; break;
                            case "Dinner":    slots[3] = name; break;
                        }
                    }
                }
                return slots;
            }
        } catch (Exception e) {
            // fall through
        }
        return null;
    }
}
