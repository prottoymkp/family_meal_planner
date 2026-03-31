package com.prottoymkp.mealplanner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.RemoteViews;
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
import org.json.JSONArray;
import org.json.JSONObject;

public class MealWidget extends AppWidgetProvider {

    private static final String TAG = "MealWidget";
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    static void updateWidget(Context context, AppWidgetManager appWidgetManager, int widgetId) {
        String apiUrl = MealPlannerConfig.getApiUrl(context);
        boolean demoMode = MealPlannerConfig.isDemoMode(context);

        if (demoMode || apiUrl.isEmpty()) {
            RemoteViews views = buildViews(
                context,
                null,
                null,
                "Open the app and connect your Google Sheet to enable the widget."
            );
            appWidgetManager.updateAppWidget(widgetId, views);
            return;
        }

        RemoteViews loadingViews = buildViews(context, null, null, "Loading...");
        appWidgetManager.updateAppWidget(widgetId, loadingViews);

        String dateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        Handler handler = new Handler(Looper.getMainLooper());

        EXECUTOR.execute(() -> {
            String[] meals = fetchMeals(dateStr, apiUrl);
            ShopData shop = fetchShopping(dateStr, apiUrl);
            String statusMsg = (meals == null && shop == null) ? "Could not load live data." : null;

            handler.post(() -> {
                RemoteViews updated = buildViews(context, meals, shop, statusMsg);
                appWidgetManager.updateAppWidget(widgetId, updated);
            });
        });
    }

    static class ShopData {
        int total;
        int checked;
        int progress;
        List<String> uncheckedItems = new ArrayList<>();
    }

    private static RemoteViews buildViews(Context context, String[] meals, ShopData shop, String statusMsg) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_meal_planner);

        views.setInt(R.id.widget_root, "setBackgroundColor", Color.parseColor("#1A1A2E"));
        String today = new SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(new Date());
        views.setTextViewText(R.id.widget_date, today);

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        if (meals != null) {
            views.setTextViewText(R.id.widget_breakfast, meals[0].isEmpty() ? "-" : meals[0]);
            views.setTextViewText(R.id.widget_lunch, meals[1].isEmpty() ? "-" : meals[1]);
            views.setTextViewText(R.id.widget_snack, meals[2].isEmpty() ? "-" : meals[2]);
            views.setTextViewText(R.id.widget_dinner, meals[3].isEmpty() ? "-" : meals[3]);
        } else {
            views.setTextViewText(R.id.widget_breakfast, "-");
            views.setTextViewText(R.id.widget_lunch, "-");
            views.setTextViewText(R.id.widget_snack, "-");
            views.setTextViewText(R.id.widget_dinner, "-");
        }

        if (shop != null) {
            views.setTextViewText(R.id.widget_shop_progress, shop.progress + "%");
            int barWidthDp = Math.max(2, (int) (shop.progress * 2.8f));
            views.setInt(R.id.widget_shop_bar, "setMinimumWidth", dpToPx(context, barWidthDp));
            views.setInt(R.id.widget_shop_bar, "setBackgroundColor", Color.parseColor("#7B68EE"));

            String s1 = shop.uncheckedItems.size() > 0 ? "o  " + shop.uncheckedItems.get(0) : "";
            String s2 = shop.uncheckedItems.size() > 1 ? "o  " + shop.uncheckedItems.get(1) : "";
            String s3 = shop.uncheckedItems.size() > 2 ? "o  " + shop.uncheckedItems.get(2) : "";
            views.setTextViewText(R.id.widget_shop1, s1);
            views.setTextViewText(R.id.widget_shop2, s2);
            views.setTextViewText(R.id.widget_shop3, s3);
        } else {
            views.setTextViewText(R.id.widget_shop_progress, "-");
            views.setTextViewText(R.id.widget_shop1, "");
            views.setTextViewText(R.id.widget_shop2, "");
            views.setTextViewText(R.id.widget_shop3, "");
        }

        if (statusMsg != null && !statusMsg.isEmpty()) {
            views.setTextViewText(R.id.widget_status, statusMsg);
            views.setViewVisibility(R.id.widget_status, android.view.View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_status, android.view.View.GONE);
        }

        return views;
    }

    private static int dpToPx(Context context, int dp) {
        return (int) (dp * context.getResources().getDisplayMetrics().density);
    }

    private static String[] fetchMeals(String date, String apiUrl) {
        try {
            String json = fetchUrl(apiUrl + "?action=getMealPlanDay&date=" + date);
            if (json == null) return null;

            JSONObject obj = new JSONObject(json);
            JSONArray meals = obj.optJSONArray("meals");
            if (meals == null) return null;

            String[] slots = {"", "", "", ""};
            for (int i = 0; i < meals.length(); i++) {
                JSONObject meal = meals.getJSONObject(i);
                String slot = meal.optString("slot", "");
                String name = meal.optString("recipeName", "");
                switch (slot) {
                    case "Breakfast":
                        slots[0] = name;
                        break;
                    case "Lunch":
                        slots[1] = name;
                        break;
                    case "Snack":
                        slots[2] = name;
                        break;
                    case "Dinner":
                        slots[3] = name;
                        break;
                    default:
                        break;
                }
            }

            return slots;
        } catch (Exception e) {
            Log.e(TAG, "fetchMeals error", e);
            return null;
        }
    }

    private static ShopData fetchShopping(String date, String apiUrl) {
        try {
            String json = fetchUrl(apiUrl + "?action=getShopping&date=" + date);
            if (json == null) return null;

            JSONObject obj = new JSONObject(json);
            if (obj.has("error")) return null;

            ShopData shop = new ShopData();
            shop.total = obj.optInt("total", 0);
            shop.checked = obj.optInt("checked", 0);
            shop.progress = obj.optInt("progress", 0);

            JSONObject categories = obj.optJSONObject("categories");
            if (categories != null) {
                Iterator<String> keys = categories.keys();
                while (keys.hasNext() && shop.uncheckedItems.size() < 3) {
                    JSONArray items = categories.optJSONArray(keys.next());
                    if (items == null) continue;

                    for (int i = 0; i < items.length() && shop.uncheckedItems.size() < 3; i++) {
                        JSONObject item = items.getJSONObject(i);
                        if (item.optBoolean("checked", false)) continue;

                        String ingredient = item.optString("ingredient", "");
                        String quantity = item.optString("quantity", "");
                        if (!ingredient.isEmpty()) {
                            shop.uncheckedItems.add(
                                quantity.isEmpty() ? ingredient : ingredient + " (" + quantity + ")"
                            );
                        }
                    }
                }
            }

            return shop;
        } catch (Exception e) {
            Log.e(TAG, "fetchShopping error", e);
            return null;
        }
    }

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
                    String location = conn.getHeaderField("Location");
                    conn.disconnect();
                    if (location == null) return null;
                    urlStr = location;
                    continue;
                }

                if (code != 200) {
                    conn.disconnect();
                    return null;
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder builder = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    builder.append(line);
                }
                reader.close();
                conn.disconnect();
                return builder.toString();
            }
        } catch (Exception e) {
            Log.e(TAG, "fetchUrl error: " + urlStr, e);
        }

        return null;
    }
}
