// java
package com.mojahid2021.railnet.network;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static Retrofit secureRetrofit = null;
    private static final String TAG = "ApiClient";
    private static final String PREFS_NAME = "UserPreferences";
    private static final String TOKEN_KEY = "token";

    public static Retrofit getRetrofit(Context context) {
        if (secureRetrofit == null) {
            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(chain -> {
                        SharedPreferences sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                        String accessToken = sp.getString(TOKEN_KEY, null);

                        // Debug log to confirm what is being read
                        Log.d(TAG, "Interceptor: retrieved token = " + (accessToken == null ? "null" : "[REDACTED]"));

                        Request original = chain.request();
                        Request.Builder builder = original.newBuilder();

                        if (accessToken != null && !accessToken.isEmpty()) {
                            // Use Authorization header if your server expects "Bearer <token>"
                            builder.header("Authorization", "Bearer " + accessToken);
                        } else {
                            // Do not call builder.header with a null value - that causes the NPE
                        }

                        Request request = builder.method(original.method(), original.body()).build();
                        return chain.proceed(request);
                    })
                    .build();

            secureRetrofit = new Retrofit.Builder()
                    .baseUrl("https://rail-net.vercel.app/")
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return secureRetrofit;
    }
}
