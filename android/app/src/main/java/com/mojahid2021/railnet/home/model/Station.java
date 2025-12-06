package com.mojahid2021.railnet.home.model;

import com.google.gson.annotations.SerializedName;

public class Station {
    public int id;
    public String name;
    public String city;
    public double latitude;
    public double longitude;
    @SerializedName("createdAt")
    public String createdAt;
    @SerializedName("updatedAt")
    public String updatedAt;
}