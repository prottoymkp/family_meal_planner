package com.prottoymkp.mealplanner;

import android.content.Context;
import android.content.SharedPreferences;

final class MealPlannerConfig {

    static final String PREFS_NAME = "meal_planner_config";
    static final String KEY_API_URL = "api_url";
    static final String KEY_DEMO_MODE = "demo_mode";

    private MealPlannerConfig() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    static String getApiUrl(Context context) {
        return prefs(context).getString(KEY_API_URL, "");
    }

    static boolean isDemoMode(Context context) {
        return prefs(context).getBoolean(KEY_DEMO_MODE, true);
    }

    static void setConfig(Context context, String apiUrl, boolean demoMode) {
        prefs(context)
            .edit()
            .putString(KEY_API_URL, apiUrl == null ? "" : apiUrl.trim())
            .putBoolean(KEY_DEMO_MODE, demoMode)
            .apply();
    }
}
