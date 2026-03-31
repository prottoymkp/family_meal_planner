package com.prottoymkp.mealplanner;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.webkit.JavascriptInterface;

final class MealPlannerNativeBridge {

    private final Context appContext;

    MealPlannerNativeBridge(Context context) {
        this.appContext = context.getApplicationContext();
    }

    @JavascriptInterface
    public void syncConfig(String apiUrl, String demoModeValue) {
        boolean demoMode = "true".equalsIgnoreCase(String.valueOf(demoModeValue));
        MealPlannerConfig.setConfig(appContext, apiUrl, demoMode);
        requestWidgetRefresh();
    }

    @JavascriptInterface
    public void requestWidgetRefresh() {
        AppWidgetManager manager = AppWidgetManager.getInstance(appContext);
        ComponentName provider = new ComponentName(appContext, MealWidget.class);
        int[] widgetIds = manager.getAppWidgetIds(provider);

        if (widgetIds == null || widgetIds.length == 0) return;

        Intent intent = new Intent(appContext, MealWidget.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
        appContext.sendBroadcast(intent);
    }
}
