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
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
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
        RemoteViews views = buildViews(context, null, null, "Loading…");
        appWidgetManager.updateAppWidget(widgetId, views);

        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler handler = new Handler(Looper.getMainLooper());

        executor.execute(() -> {
            String[] meals = fetchMeals(dateStr);
            ShopData shop = fetchShopping(dateStr);
            String err = (meals == null && shop == null) ? "Could not load data" : null;

            handler.post(() -> {
                RemoteViews updated = buildViews(context, meals, shop, err);
                appWidgetManager.updateAppWidget(widgetId, updated);
            });
        });
    }

    // ── Data classes ──────────────────────────────────────────────────────
    static class ShopData {
        int total, checked, progress;
        List<String> uncheckedItems = new ArrayList<>();
    }

    // ── Build RemoteViews ─────────────────────────────────────────────────
    private static RemoteViews buildViews(Context context, String[] meals, ShopData shop, String statusMsg) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_meal_planner);

        // Dark background
        v.setInt(R.id.widget_root, "setBackgroundColor", Color.parseColor("#1A1A2E"));

        // Date
        String today = new SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(new Date());
        v.setTextViewText(R.id.widget_date, today);

        // Tap → open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root, pi);

        // Meals
        if (meals != null) {
            v.setTextViewText(R.id.widget_breakfast, meals[0].isEmpty() ? "—" : meals[0]);
            v.setTextViewText(R.id.widget_lunch,     meals[1].isEmpty() ? "—" : meals[1]);
            v.setTextViewText(R.id.widget_snack,     meals[2].isEmpty() ? "—" : meals[2]);
            v.setTextViewText(R.id.widget_dinner,    meals[3].isEmpty() ? "—" : meals[3]);
        } else {
            v.setTextViewText(R.id.widget_breakfast, "—");
            v.setTextViewText(R.id.widget_lunch,     "—");
            v.setTextViewText(R.id.widget_snack,     "—");
            v.setTextViewText(R.id.widget_dinner,    "—");
        }

        // Shopping
        if (shop != null) {
            v.setTextViewText(R.id.widget_shop_progress, shop.progress + "%");

            // Progress bar width (percentage of parent)
            // We approximate via layout weight — not possible with RemoteViews
            // Instead we set a min width in dp based on percentage
            int barWidthDp = Math.max(2, (int)(shop.progress * 2.8)); // rough: 280dp max
            v.setInt(R.id.widget_shop_bar, "setMinimumWidth", dpToPx(context, barWidthDp));
            v.setInt(R.id.widget_shop_bar, "setBackgroundColor", Color.parseColor("#7B68EE"));

            // Unchecked items
            String s1 = shop.uncheckedItems.size() > 0 ? "○  " + shop.uncheckedItems.get(0) : "";
            String s2 = shop.uncheckedItems.size() > 1 ? "○  " + shop.uncheckedItems.get(1) : "";
            String s3 = shop.uncheckedItems.size() > 2 ? "○  " + shop.uncheckedItems.get(2) : "";
            v.setTextViewText(R.id.widget_shop1, s1);
            v.setTextViewText(R.id.widget_shop2, s2);
            v.setTextViewText(R.id.widget_shop3, s3);
        } else {
            v.setTextViewText(R.id.widget_shop_progress, "—");
            v.setTextViewText(R.id.widget_shop1, "");
            v.setTextViewText(R.id.widget_shop2, "");
            v.setTextViewText(R.id.widget_shop3, "");
        }

        // Status
        if (statusMsg != null) {
            v.setTextViewText(R.id.widget_status, statusMsg);
            v.setViewVisibility(R.id.widget_status, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.widget_status, android.view.View.GONE);
        }

        return v;
    }

    private static int dpToPx(Context ctx, int dp) {
        return (int)(dp * ctx.getResources().getDisplayMetrics().density);
    }

    // ── Fetch meals ───────────────────────────────────────────────────────
    private static String[] fetchMeals(String date) {
        try {
            String json = fetchUrl(API_URL + "?action=getMealPlanDay&date=" + date);
            if (json == null) return null;

            JSONObject obj = new JSONObject(json);
            JSONArray meals = obj.optJSONArray("meals");
            String[] slots = {"", "", "", ""};
            if (meals != null) {
                for (int i = 0; i < meals.length(); i++) {
                    JSONObject m = meals.getJSONObject(i);
                    String slot = m.optString("slot", "");
                    String name = m.optString("recipeName", "");
                    switch (slot) {
                        case "Breakfast": slots[0] = name; break;
                        case "Lunch":     slots[1] = name; break;
                        case "Snack":     slots[2] = name; break;
                        case "Dinner":    slots[3] = name; break;
                    }
                }
            }
            return slots;
        } catch (Exception e) { return null; }
    }

    // ── Fetch shopping ────────────────────────────────────────────────────
    private static ShopData fetchShopping(String date) {
        try {
            String json = fetchUrl(API_URL + "?action=getShopping&date=" + date);
            if (json == null) return null;

            JSONObject obj = new JSONObject(json);
            ShopData sd = new ShopData();
            sd.total = obj.optInt("total", 0);
            sd.checked = obj.optInt("checked", 0);
            sd.progress = obj.optInt("progress", 0);

            // Collect unchecked items across categories
            JSONObject cats = obj.optJSONObject("categories");
            if (cats != null) {
                Iterator<String> keys = cats.keys();
                while (keys.hasNext() && sd.uncheckedItems.size() < 3) {
                    JSONArray items = cats.optJSONArray(keys.next());
                    if (items == null) continue;
                    for (int i = 0; i < items.length() && sd.uncheckedItems.size() < 3; i++) {
                        JSONObject item = items.getJSONObject(i);
                        if (!item.optBoolean("checked", false)) {
                            String name = item.optString("ingredient", "");
                            String qty = item.optString("quantity", "");
                            sd.uncheckedItems.add(name + (qty.isEmpty() ? "" : " (" + qty + ")"));
                        }
                    }
                }
            }
            return sd;
        } catch (Exception e) { return null; }
    }

    // ── HTTP fetch with redirect following ────────────────────────────────
    private static String fetchUrl(String urlStr) {
        try {
            for (int i = 0; i < 5; i++) {
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);
                conn.setInstanceFollowRedirects(false);
                conn.setRequestProperty("User-Agent", "MealPlannerWidget/1.0");

                int code = conn.getResponseCode();
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    String loc = conn.getHeaderField("Location");
                    conn.disconnect();
                    if (loc == null) return null;
                    urlStr = loc;
                    continue;
                }
                if (code != 200) return null;

                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();
                conn.disconnect();
                return sb.toString();
            }
        } catch (Exception e) { /* fall through */ }
        return null;
    }
}
