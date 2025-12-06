package com.mojahid2021.railnet.network;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;
import java.io.IOException;
import android.content.Context;
import android.content.SharedPreferences;

public class AuthInterceptor implements Interceptor {
    private Context context;

    public AuthInterceptor(Context context) {
        this.context = context;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        SharedPreferences sharedPreferences = context.getSharedPreferences("MyPrefs", Context.MODE_PRIVATE);
        String authToken = sharedPreferences.getString("auth_token", null);
        Request original = chain.request();
        Request.Builder builder = original.newBuilder();
        if (authToken != null) {
            builder.header("Authorization", "Bearer " + authToken);
        }
        Request request = builder.build();
        return chain.proceed(request);
    }
}
