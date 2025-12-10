package com.mojahid2021.railnet.network;

import com.mojahid2021.railnet.model.Station;

import java.util.List;
import java.util.Map;

import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Body;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    @GET("trains")
    Call<String> getTrains();

    @GET("train/{id}")
    Call<String> getTrainById(@Path("id") int id);

    @POST("login")
    Call<ResponseBody> login(@Body Map<String, String> credentials);

    @POST("register")
    Call<ResponseBody> register(@Body Map<String, String> userDetails);
    @GET("profile")
    Call<ResponseBody> getProfile();
    @GET("stations")
    Call<List<Station>> getStations();

    // Search train schedules between two stations for a specific date
    @GET("train-schedules/search")
    Call<ResponseBody> searchTrainSchedules(
            @Query("fromStationId") String fromStationId,
            @Query("toStationId") String toStationId,
            @Query("date") String date
    );

    @POST("tickets")
    Call<ResponseBody> bookTicket(@Body RequestBody body);
    @GET("tickets")
    Call<ResponseBody> getTickets();

    @POST("payments/initiate")
    Call<PaymentInitiateResponse> initiatePayment(@Body Map<String, String> body);

    @GET("tickets/{id}")
    Call<ResponseBody> getTicketById(@Path("id") String id);
}
