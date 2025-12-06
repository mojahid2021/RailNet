package com.mojahid2021.railnet.network;

import java.util.Map;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Body;
import retrofit2.http.Path;

public interface ApiService {

    @GET("trains")
    Call<String> getTrains(); // Replace String with your model class

    @GET("train/{id}")
    Call<String> getTrainById(@Path("id") int id);

    @POST("login")
    Call<ResponseBody> login(@Body Map<String, String> credentials);

    @POST("register")
    Call<ResponseBody> register(@Body Map<String, String> userDetails);

    @GET("profile")
    Call<ResponseBody> getProfile();
}
