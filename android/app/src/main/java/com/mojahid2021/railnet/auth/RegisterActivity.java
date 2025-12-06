package com.mojahid2021.railnet.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.material.textfield.TextInputEditText;
import com.mojahid2021.railnet.R;
import com.mojahid2021.railnet.network.ApiService;
import com.mojahid2021.railnet.network.ApiClient;

import java.util.HashMap;
import java.util.Map;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {
    private TextInputEditText firstName, lastName, emailEditText, phone, address, passwordEditText;
    private LinearLayout registerButton;
    private TextView loginLink;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_register);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        firstName = findViewById(R.id.firstName);
        lastName = findViewById(R.id.lastName);
        emailEditText = findViewById(R.id.email);
        phone = findViewById(R.id.phone);
        address = findViewById(R.id.address);
        passwordEditText = findViewById(R.id.password);
        registerButton = findViewById(R.id.registerButton);
        loginLink = findViewById(R.id.loginButton);

        registerButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String firstNameStr = firstName.getText().toString().trim();
                String lastNameStr = lastName.getText().toString().trim();
                String email = emailEditText.getText().toString().trim();
                String phoneStr = phone.getText().toString().trim();
                String addressStr = address.getText().toString().trim();
                String password = passwordEditText.getText().toString().trim();
                // Implement registration logic here
                if (firstNameStr.isEmpty() || lastNameStr.isEmpty() || email.isEmpty() || password.isEmpty() || phoneStr.isEmpty() || addressStr.isEmpty()) {
                    Toast.makeText(RegisterActivity.this, "Please fill all fields", Toast.LENGTH_SHORT).show();
                    return;
                }
                register(firstNameStr, lastNameStr, email, phoneStr, addressStr, password);
            }
        });

        loginLink.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
                startActivity(intent);
                finish();
            }
        });

    }

    private void register(String firstNameStr, String lastNameStr, String email, String phone, String address, String password) {

        // Implement registration logic here
        Map<String, String> userDetails = new HashMap<>();
        userDetails.put("firstName", firstNameStr);
        userDetails.put("lastName", lastNameStr);
        userDetails.put("email", email);
        userDetails.put("phone", phone);
        userDetails.put("address", address);
        userDetails.put("password", password);

        ApiService apiService = ApiClient.getRetrofit(RegisterActivity.this).create(ApiService.class);
        Call<ResponseBody> call = apiService.register(userDetails);

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(RegisterActivity.this, "Registration successful", Toast.LENGTH_SHORT).show();
                    finish(); // Close the activity after successful registration
                } else {
                    Toast.makeText(RegisterActivity.this, "Registration failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(RegisterActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });



    }
}