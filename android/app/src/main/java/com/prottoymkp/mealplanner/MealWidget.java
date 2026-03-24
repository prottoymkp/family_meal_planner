package com.prottoymkp.mealplanner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
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
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_meal_planner);

        // Set today's date label
        String today = new SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(new Date());
        views.setTextViewText(R.id.widget_date, today);

        // Tap widget → open the app
        Intent launchIntent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_title, pendingIntent);

        // Show loading state
        views.setTextViewText(R.id.widget_status, "Updating…");
        views.setViewVisibility(R.id.widget_status, android.view.View.VISIBLE);
        appWidgetManager.updateAppWidget(widgetId, views);

        // Fetch data in background
        String dateParam = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        new FetchMealsTask(context, appWidgetManager, widgetId, dateParam).execute();
    }

    // ── AsyncTask to fetch meals from Apps Script ──────────────────────────
    private static class FetchMealsTask extends AsyncTask<Void, Void, String[]> {
        private final Context context;
        private final AppWidgetManager manager;
        private final int widgetId;
        private final String date;
        private String error = null;

        FetchMealsTask(Context ctx, AppWidgetManager mgr, int wid, String date) {
            this.context = ctx;
            this.manager = mgr;
            this.widgetId = wid;
            this.date = date;
        }

        @Override
        protected String[] doInBackground(Void... voids) {
            try {
                String urlStr = API_URL + "?action=getMealPlanDay&date=" + date;
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                conn.setRequestMethod("GET");

                int code = conn.getResponseCode();
                if (code != 200) { error = "Server error " + code; return null; }

                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream())
                );
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();

                JSONObject json = new JSONObject(sb.toString());
                JSONArray meals = json.optJSONArray("meals");

                String[] slots = {"", "", "", ""}; // BF, LN, SN, DN
                if (meals != null) {
                    for (int i = 0; i < meals.length(); i++) {
                        JSONObject meal = meals.getJSONObject(i);
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

            } catch (Exception e) {
                error = "Could not load";
                return null;
            }
        }

        @Override
        protected void onPostExecute(String[] slots) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_meal_planner);
            String today = new SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(new Date());
            views.setTextViewText(R.id.widget_date, today);

            // Tap → open app
            Intent launchIntent = new Intent(context, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_title, pi);

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
                views.setTextViewText(R.id.widget_status, error != null ? error : "No data");
                views.setViewVisibility(R.id.widget_status, android.view.View.VISIBLE);
            }
            manager.updateAppWidget(widgetId, views);
        }
    }
}
