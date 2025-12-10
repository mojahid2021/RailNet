# RailNet Android - Code Interactions and Component Handling Guide

## Table of Contents
1. [How to Handle Activities](#how-to-handle-activities)
2. [How to Handle Fragments](#how-to-handle-fragments)
3. [How to Handle Network Calls](#how-to-handle-network-calls)
4. [How to Handle RecyclerView Adapters](#how-to-handle-recyclerview-adapters)
5. [How to View and Debug](#how-to-view-and-debug)
6. [Common Interaction Patterns](#common-interaction-patterns)
7. [Code Examples](#code-examples)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. How to Handle Activities

### 1.1 Activity Lifecycle

All activities in RailNet follow the standard Android lifecycle:

```java
onCreate() → onStart() → onResume() → [Running] → onPause() → onStop() → onDestroy()
```

### 1.2 Creating a New Activity

**Template Structure**:
```java
public class YourActivity extends AppCompatActivity {
    
    // Constants
    private static final String TAG = "YourActivity";
    
    // UI Components
    private TextView tvTitle;
    private Button btnAction;
    
    // Data
    private String data;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_your);
        
        // Initialize views
        initializeViews();
        
        // Extract intent data
        extractIntentData();
        
        // Setup listeners
        setupListeners();
        
        // Load data
        loadData();
    }
    
    private void initializeViews() {
        tvTitle = findViewById(R.id.tvTitle);
        btnAction = findViewById(R.id.btnAction);
    }
    
    private void extractIntentData() {
        data = getIntent().getStringExtra("key");
    }
    
    private void setupListeners() {
        btnAction.setOnClickListener(v -> handleAction());
    }
    
    private void loadData() {
        // Fetch data from API or database
    }
    
    private void handleAction() {
        // Handle button click
    }
}
```

### 1.3 Navigating Between Activities

**From Activity to Activity**:
```java
// Simple navigation
Intent intent = new Intent(CurrentActivity.this, TargetActivity.class);
startActivity(intent);

// With data
Intent intent = new Intent(CurrentActivity.this, TargetActivity.class);
intent.putExtra("key1", "value1");
intent.putExtra("key2", 123);
startActivity(intent);

// Finish current activity after navigation
Intent intent = new Intent(CurrentActivity.this, TargetActivity.class);
startActivity(intent);
finish(); // Current activity removed from back stack
```

**From Fragment to Activity**:
```java
Intent intent = new Intent(requireContext(), TargetActivity.class);
intent.putExtra("key", "value");
startActivity(intent);
```

### 1.4 Handling Intent Data

**In Target Activity**:
```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_target);
    
    // Get extras
    Intent intent = getIntent();
    String value1 = intent.getStringExtra("key1");
    int value2 = intent.getIntExtra("key2", 0); // 0 is default
    boolean value3 = intent.getBooleanExtra("key3", false);
    
    // For complex objects, use JSON serialization
    String json = intent.getStringExtra("objectJson");
    Gson gson = new Gson();
    YourObject obj = gson.fromJson(json, YourObject.class);
}
```

### 1.5 Activity State Management

**Example from TrainsActivity**:
```java
// State variables
private View progressContainer;
private View emptyContainer;
private RecyclerView rvSchedules;

private void showLoading(boolean loading) {
    progressContainer.setVisibility(loading ? View.VISIBLE : View.GONE);
    rvSchedules.setVisibility(loading ? View.GONE : View.VISIBLE);
    emptyContainer.setVisibility(View.GONE);
}

private void showSchedules(List<TrainSchedule> schedules) {
    rvSchedules.setVisibility(View.VISIBLE);
    emptyContainer.setVisibility(View.GONE);
    progressContainer.setVisibility(View.GONE);
    adapter.setItems(schedules);
}

private void showEmptyState() {
    rvSchedules.setVisibility(View.GONE);
    emptyContainer.setVisibility(View.VISIBLE);
    progressContainer.setVisibility(View.GONE);
}
```

---

## 2. How to Handle Fragments

### 2.1 Fragment Lifecycle

```java
onAttach() → onCreate() → onCreateView() → onViewCreated() → onStart() → 
onResume() → [Running] → onPause() → onStop() → onDestroyView() → 
onDestroy() → onDetach()
```

### 2.2 Creating a Fragment

**Template Structure**:
```java
public class YourFragment extends Fragment {
    
    private static final String TAG = "YourFragment";
    
    // UI Components
    private TextView tvTitle;
    private Button btnAction;
    
    // Data
    private String data;
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_your, container, false);
    }
    
    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        initializeViews(view);
        setupListeners();
        loadData();
    }
    
    private void initializeViews(View view) {
        tvTitle = view.findViewById(R.id.tvTitle);
        btnAction = view.findViewById(R.id.btnAction);
    }
    
    private void setupListeners() {
        btnAction.setOnClickListener(v -> handleAction());
    }
    
    private void loadData() {
        // Fetch data
    }
    
    private void handleAction() {
        // Handle button click
    }
}
```

### 2.3 Fragment Communication

**Fragment to Activity Navigation**:
```java
// Navigate to activity from fragment
Intent intent = new Intent(requireContext(), TargetActivity.class);
startActivity(intent);

// Get activity reference
MainActivity activity = (MainActivity) requireActivity();
activity.someMethod();
```

**Fragment to Fragment (via MainActivity)**:
```java
// In MainActivity
public void navigateToFragment(Fragment fragment) {
    getSupportFragmentManager()
        .beginTransaction()
        .replace(R.id.fragmentContainer, fragment)
        .commit();
}

// From Fragment
MainActivity activity = (MainActivity) requireActivity();
activity.navigateToFragment(new TargetFragment());
```

### 2.4 Handling Context in Fragments

```java
// Get context (may be null if not attached)
Context context = getContext();
if (context != null) {
    // Use context
}

// Require context (throws exception if null)
Context context = requireContext();

// Get activity (may be null)
Activity activity = getActivity();
if (activity != null) {
    // Use activity
}

// Require activity (throws exception if null)
Activity activity = requireActivity();
```

### 2.5 Fragment Data Loading Pattern

**Example from HomeFragment**:
```java
@Override
public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
    super.onViewCreated(view, savedInstanceState);
    
    // 1. Initialize UI
    initializeViews(view);
    
    // 2. Setup listeners
    setupEventListeners();
    
    // 3. Initialize with default data
    initializeDate();
    
    // 4. Fetch data from API
    fetchStations();
    
    // 5. Restore saved state
    restoreSelectionsFromPreferences();
}
```

---

## 3. How to Handle Network Calls

### 3.1 Making API Calls

**Step-by-Step Process**:

**Step 1: Get Retrofit Instance**
```java
ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
```

**Step 2: Create Call Object**
```java
// GET request
Call<List<Station>> call = apiService.getStations();

// GET with query parameters
Call<ResponseBody> call = apiService.searchTrainSchedules(
    fromStationId,
    toStationId,
    date
);

// POST with body
Map<String, String> body = new HashMap<>();
body.put("email", email);
body.put("password", password);
Call<ResponseBody> call = apiService.login(body);

// POST with JSON body
JSONObject json = new JSONObject();
json.put("key", "value");
RequestBody requestBody = RequestBody.create(
    json.toString(),
    MediaType.parse("application/json")
);
Call<ResponseBody> call = apiService.bookTicket(requestBody);
```

**Step 3: Execute Call Asynchronously**
```java
call.enqueue(new Callback<ResponseBody>() {
    @Override
    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
        if (response.isSuccessful() && response.body() != null) {
            // Handle success
            try {
                String body = response.body().string();
                handleSuccessResponse(body);
            } catch (IOException e) {
                Log.e(TAG, "Error reading response", e);
            }
        } else {
            // Handle error response (400, 401, 404, etc.)
            handleErrorResponse(response.code());
        }
    }
    
    @Override
    public void onFailure(Call<ResponseBody> call, Throwable t) {
        // Handle network failure (no internet, timeout, etc.)
        Log.e(TAG, "Network error", t);
        showError("Network error: " + t.getMessage());
    }
});
```

### 3.2 Parsing JSON Responses

**Using Gson for Model Objects**:
```java
// Direct model parsing
Call<List<Station>> call = apiService.getStations();
call.enqueue(new Callback<List<Station>>() {
    @Override
    public void onResponse(Call<List<Station>> call, Response<List<Station>> response) {
        if (response.isSuccessful() && response.body() != null) {
            List<Station> stations = response.body();
            // Use stations
        }
    }
    
    @Override
    public void onFailure(Call<List<Station>> call, Throwable t) {
        // Handle error
    }
});
```

**Manual JSON Parsing**:
```java
String body = response.body().string();

// Parse as JSONObject
JSONObject json = new JSONObject(body);
String token = json.getString("token");
String userId = json.getString("userId");

// Parse as JSONArray
JSONArray array = new JSONArray(body);
for (int i = 0; i < array.length(); i++) {
    JSONObject item = array.getJSONObject(i);
    String name = item.getString("name");
}

// Parse with Gson
Gson gson = new Gson();
TrainSchedule schedule = gson.fromJson(body, TrainSchedule.class);

// Parse list with TypeToken
Type listType = new TypeToken<List<TrainSchedule>>(){}.getType();
List<TrainSchedule> schedules = gson.fromJson(body, listType);
```

### 3.3 Error Handling

**Complete Error Handling Template**:
```java
private void makeApiCall() {
    // Show loading
    showLoading(true);
    
    ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
    Call<ResponseBody> call = apiService.yourEndpoint();
    
    call.enqueue(new Callback<ResponseBody>() {
        @Override
        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
            // Hide loading
            showLoading(false);
            
            if (response.isSuccessful() && response.body() != null) {
                // Success case
                try {
                    String body = response.body().string();
                    processSuccessResponse(body);
                } catch (Exception e) {
                    Log.e(TAG, "Error processing response", e);
                    showError("Error processing data");
                }
            } else {
                // HTTP error codes
                switch (response.code()) {
                    case 400:
                        showError("Invalid request");
                        break;
                    case 401:
                        showError("Unauthorized. Please login again.");
                        navigateToLogin();
                        break;
                    case 404:
                        showError("Resource not found");
                        break;
                    case 500:
                        showError("Server error. Please try again later.");
                        break;
                    default:
                        showError("Error: " + response.code());
                }
            }
        }
        
        @Override
        public void onFailure(Call<ResponseBody> call, Throwable t) {
            // Hide loading
            showLoading(false);
            
            // Network failures
            if (t instanceof IOException) {
                showError("Network error. Check your internet connection.");
            } else {
                showError("Error: " + t.getMessage());
            }
            
            Log.e(TAG, "API call failed", t);
        }
    });
}
```

### 3.4 Authentication Token Handling

**How Token is Automatically Added**:
```java
// In ApiClient.java
OkHttpClient client = new OkHttpClient.Builder()
    .addInterceptor(chain -> {
        // Get token from SharedPreferences
        SharedPreferences sp = context.getSharedPreferences("UserPreferences", MODE_PRIVATE);
        String token = sp.getString("token", null);
        
        // Build request with token
        Request.Builder builder = chain.request().newBuilder();
        if (token != null && !token.isEmpty()) {
            builder.header("Authorization", "Bearer " + token);
        }
        
        return chain.proceed(builder.build());
    })
    .build();
```

**No need to manually add token**:
```java
// ❌ Don't do this
Request request = chain.request().newBuilder()
    .header("Authorization", "Bearer " + token)
    .build();

// ✅ Token is automatically added by interceptor
ApiService apiService = ApiClient.getRetrofit(context).create(ApiService.class);
Call<ResponseBody> call = apiService.getProfile(); // Token added automatically
```

---

## 4. How to Handle RecyclerView Adapters

### 4.1 Creating an Adapter

**Complete Adapter Template**:
```java
public class YourAdapter extends RecyclerView.Adapter<YourAdapter.ViewHolder> {
    
    private List<YourModel> items = new ArrayList<>();
    private OnItemClickListener listener;
    
    // Listener interface
    public interface OnItemClickListener {
        void onItemClick(YourModel item);
    }
    
    // Constructor
    public YourAdapter(List<YourModel> items, OnItemClickListener listener) {
        this.items = items != null ? items : new ArrayList<>();
        this.listener = listener;
    }
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_your, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        YourModel item = items.get(position);
        holder.bind(item);
    }
    
    @Override
    public int getItemCount() {
        return items.size();
    }
    
    // Update items
    public void setItems(List<YourModel> newItems) {
        this.items = newItems != null ? newItems : new ArrayList<>();
        notifyDataSetChanged();
    }
    
    // ViewHolder class
    class ViewHolder extends RecyclerView.ViewHolder {
        private TextView tvTitle;
        private TextView tvDescription;
        
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvDescription = itemView.findViewById(R.id.tvDescription);
            
            // Set click listener
            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onItemClick(items.get(position));
                }
            });
        }
        
        public void bind(YourModel item) {
            tvTitle.setText(item.getTitle());
            tvDescription.setText(item.getDescription());
        }
    }
}
```

### 4.2 Using Adapter in Activity/Fragment

```java
// In Activity/Fragment
private RecyclerView recyclerView;
private YourAdapter adapter;

private void setupRecyclerView() {
    recyclerView = findViewById(R.id.recyclerView);
    
    // Set layout manager
    recyclerView.setLayoutManager(new LinearLayoutManager(this));
    // For grid: new GridLayoutManager(this, spanCount)
    
    // Create adapter with click listener
    adapter = new YourAdapter(new ArrayList<>(), item -> {
        // Handle item click
        handleItemClick(item);
    });
    
    recyclerView.setAdapter(adapter);
    
    // Optional: Add item decoration
    int spacing = getResources().getDimensionPixelSize(R.dimen.spacing);
    recyclerView.addItemDecoration(new SpacingItemDecoration(spacing));
}

private void handleItemClick(YourModel item) {
    // Navigate to detail screen
    Intent intent = new Intent(this, DetailActivity.class);
    intent.putExtra("itemId", item.getId());
    startActivity(intent);
}

private void loadData() {
    // Fetch data and update adapter
    apiService.getData().enqueue(new Callback<List<YourModel>>() {
        @Override
        public void onResponse(Call<List<YourModel>> call, 
                             Response<List<YourModel>> response) {
            if (response.isSuccessful() && response.body() != null) {
                adapter.setItems(response.body());
            }
        }
        
        @Override
        public void onFailure(Call<List<YourModel>> call, Throwable t) {
            // Handle error
        }
    });
}
```

### 4.3 Efficient Updates

**Update entire list**:
```java
adapter.setItems(newList);
notifyDataSetChanged(); // Refreshes all items
```

**Update single item**:
```java
items.set(position, newItem);
notifyItemChanged(position); // Only refreshes one item
```

**Add item**:
```java
items.add(newItem);
notifyItemInserted(items.size() - 1);
```

**Remove item**:
```java
items.remove(position);
notifyItemRemoved(position);
```

### 4.4 Selection Handling Example

**From SeatAdapter**:
```java
public class SeatAdapter extends RecyclerView.Adapter<SeatAdapter.ViewHolder> {
    
    private List<String> items = new ArrayList<>();
    private String selectedSeat = null; // Track selected seat
    private OnSeatClickListener listener;
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        String seat = items.get(position);
        boolean isSelected = seat.equals(selectedSeat);
        holder.bind(seat, isSelected);
    }
    
    class ViewHolder extends RecyclerView.ViewHolder {
        private TextView tvSeat;
        
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvSeat = itemView.findViewById(R.id.tvSeat);
            
            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION) {
                    String seat = items.get(position);
                    
                    // Find previous selection
                    int prevPosition = items.indexOf(selectedSeat);
                    
                    // Update selection
                    selectedSeat = seat;
                    
                    // Notify changes (only affected items)
                    if (prevPosition != -1) {
                        notifyItemChanged(prevPosition);
                    }
                    notifyItemChanged(position);
                    
                    // Notify listener
                    if (listener != null) {
                        listener.onSeatClick(seat);
                    }
                }
            });
        }
        
        public void bind(String seat, boolean isSelected) {
            tvSeat.setText(seat);
            
            // Visual feedback for selection
            if (isSelected) {
                tvSeat.setBackgroundResource(R.drawable.seat_selected);
                tvSeat.setTextColor(Color.WHITE);
            } else {
                tvSeat.setBackgroundResource(R.drawable.seat_available);
                tvSeat.setTextColor(Color.BLACK);
            }
        }
    }
}
```

---

## 5. How to View and Debug

### 5.1 Logging

**Use Log class for debugging**:
```java
import android.util.Log;

private static final String TAG = "YourClass";

// Different log levels
Log.v(TAG, "Verbose message"); // Verbose
Log.d(TAG, "Debug message");   // Debug
Log.i(TAG, "Info message");    // Info
Log.w(TAG, "Warning message"); // Warning
Log.e(TAG, "Error message");   // Error

// Log with exception
try {
    // Code
} catch (Exception e) {
    Log.e(TAG, "Error occurred", e);
}

// Log objects
Log.d(TAG, "Station: " + station.toString());
Log.d(TAG, "Count: " + items.size());
```

**View logs in Android Studio**:
1. Open Logcat panel (bottom of screen)
2. Filter by tag: `tag:YourClass`
3. Filter by level: Select from dropdown (Verbose, Debug, Info, Warn, Error)
4. Search: Use search box for keywords

### 5.2 Toast Messages

**Show quick messages to user**:
```java
// Short duration
Toast.makeText(this, "Message", Toast.LENGTH_SHORT).show();

// Long duration
Toast.makeText(this, "Message", Toast.LENGTH_LONG).show();

// In Fragment
Toast.makeText(requireContext(), "Message", Toast.LENGTH_SHORT).show();
```

### 5.3 Debugging Network Calls

**Check network traffic**:
```java
// In ApiClient, add logging interceptor
OkHttpClient client = new OkHttpClient.Builder()
    .addInterceptor(new HttpLoggingInterceptor()
        .setLevel(HttpLoggingInterceptor.Level.BODY))
    .build();
```

**Log API responses**:
```java
@Override
public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
    Log.d(TAG, "Response code: " + response.code());
    Log.d(TAG, "Response message: " + response.message());
    
    if (response.isSuccessful() && response.body() != null) {
        try {
            String body = response.body().string();
            Log.d(TAG, "Response body: " + body);
            // Process response
        } catch (IOException e) {
            Log.e(TAG, "Error reading response", e);
        }
    }
}
```

### 5.4 Debugging UI

**Check view properties**:
```java
Log.d(TAG, "View visibility: " + view.getVisibility());
Log.d(TAG, "View width: " + view.getWidth());
Log.d(TAG, "View height: " + view.getHeight());
Log.d(TAG, "TextView text: " + textView.getText().toString());
```

**Check RecyclerView**:
```java
Log.d(TAG, "Item count: " + adapter.getItemCount());
Log.d(TAG, "Layout manager: " + recyclerView.getLayoutManager());
```

### 5.5 Debugging SharedPreferences

**Check stored values**:
```java
SharedPreferences prefs = getSharedPreferences("UserPreferences", MODE_PRIVATE);
String token = prefs.getString("token", null);
Log.d(TAG, "Stored token: " + (token != null ? "EXISTS" : "NULL"));

// Get all values
Map<String, ?> all = prefs.getAll();
for (Map.Entry<String, ?> entry : all.entrySet()) {
    Log.d(TAG, entry.getKey() + ": " + entry.getValue());
}
```

---

## 6. Common Interaction Patterns

### 6.1 Activity → API → Update UI

```java
public class YourActivity extends AppCompatActivity {
    
    private TextView tvData;
    private View progressBar;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_your);
        
        tvData = findViewById(R.id.tvData);
        progressBar = findViewById(R.id.progressBar);
        
        fetchData();
    }
    
    private void fetchData() {
        showLoading(true);
        
        ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = apiService.getData();
        
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                showLoading(false);
                
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        String data = response.body().string();
                        updateUI(data);
                    } catch (IOException e) {
                        showError("Error reading response");
                    }
                }
            }
            
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                showLoading(false);
                showError("Network error");
            }
        });
    }
    
    private void showLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        tvData.setVisibility(loading ? View.GONE : View.VISIBLE);
    }
    
    private void updateUI(String data) {
        tvData.setText(data);
    }
    
    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}
```

### 6.2 Fragment → Activity → Fragment

```java
// In HomeFragment: Navigate to TrainsActivity
Intent intent = new Intent(requireContext(), TrainsActivity.class);
intent.putExtra("data", data);
startActivity(intent);

// In TrainsActivity: Process and return
Intent resultIntent = new Intent();
resultIntent.putExtra("result", result);
setResult(RESULT_OK, resultIntent);
finish();

// In HomeFragment: Handle result (if using startActivityForResult)
@Override
public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (resultCode == RESULT_OK) {
        String result = data.getStringExtra("result");
        // Use result
    }
}
```

### 6.3 Adapter → Activity Interaction

```java
// In Activity
adapter = new TrainScheduleAdapter(schedule -> {
    // Lambda expression handles click
    navigateToDetails(schedule);
});

// Traditional way with interface
adapter = new TrainScheduleAdapter(new TrainScheduleAdapter.OnItemClickListener() {
    @Override
    public void onItemClick(TrainSchedule schedule) {
        navigateToDetails(schedule);
    }
});

private void navigateToDetails(TrainSchedule schedule) {
    Gson gson = new Gson();
    String json = gson.toJson(schedule);
    
    Intent intent = new Intent(this, DetailsActivity.class);
    intent.putExtra("scheduleJson", json);
    startActivity(intent);
}
```

### 6.4 Save and Restore State

**Save to SharedPreferences**:
```java
SharedPreferences prefs = getSharedPreferences("UserPreferences", MODE_PRIVATE);
SharedPreferences.Editor editor = prefs.edit();
editor.putString("key", "value");
editor.putInt("count", 123);
editor.putBoolean("flag", true);
editor.apply(); // or editor.commit() for synchronous
```

**Restore from SharedPreferences**:
```java
SharedPreferences prefs = getSharedPreferences("UserPreferences", MODE_PRIVATE);
String value = prefs.getString("key", "default");
int count = prefs.getInt("count", 0);
boolean flag = prefs.getBoolean("flag", false);
```

**Clear preferences**:
```java
SharedPreferences prefs = getSharedPreferences("UserPreferences", MODE_PRIVATE);
prefs.edit().clear().apply(); // Clear all
prefs.edit().remove("key").apply(); // Remove specific key
```

---

## 7. Code Examples

### 7.1 Complete Login Flow Example

```java
// LoginActivity.java
public class LoginActivity extends AppCompatActivity {
    
    private TextInputEditText etEmail, etPassword;
    private LinearLayout btnLogin;
    private View progressBar;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        
        etEmail = findViewById(R.id.emailEditText);
        etPassword = findViewById(R.id.passwordEditText);
        btnLogin = findViewById(R.id.loginButton);
        progressBar = findViewById(R.id.progressBar);
        
        btnLogin.setOnClickListener(v -> attemptLogin());
    }
    
    private void attemptLogin() {
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();
        
        // Validate
        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }
        
        // Call API
        login(email, password);
    }
    
    private void login(String email, String password) {
        showLoading(true);
        
        Map<String, String> credentials = new HashMap<>();
        credentials.put("email", email);
        credentials.put("password", password);
        
        ApiService apiService = ApiClient.getRetrofit(this).create(ApiService.class);
        Call<ResponseBody> call = apiService.login(credentials);
        
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                showLoading(false);
                
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        String body = response.body().string();
                        JSONObject json = new JSONObject(body);
                        String token = json.getString("token");
                        
                        // Save token
                        saveToken(token);
                        
                        // Navigate to main
                        navigateToMain();
                        
                    } catch (Exception e) {
                        Log.e("LoginActivity", "Parse error", e);
                        showError("Failed to parse response");
                    }
                } else {
                    showError("Login failed");
                }
            }
            
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                showLoading(false);
                showError("Network error");
                Log.e("LoginActivity", "Network error", t);
            }
        });
    }
    
    private void saveToken(String token) {
        SharedPreferences prefs = getSharedPreferences("UserPreferences", MODE_PRIVATE);
        prefs.edit().putString("token", token).apply();
    }
    
    private void navigateToMain() {
        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
        finish();
    }
    
    private void showLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!loading);
    }
    
    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}
```

### 7.2 Complete RecyclerView Example

```java
// TrainScheduleAdapter.java
public class TrainScheduleAdapter extends RecyclerView.Adapter<TrainScheduleAdapter.ViewHolder> {
    
    private List<TrainSchedule> schedules = new ArrayList<>();
    private OnItemClickListener listener;
    
    public interface OnItemClickListener {
        void onItemClick(TrainSchedule schedule);
    }
    
    public TrainScheduleAdapter(OnItemClickListener listener) {
        this.listener = listener;
    }
    
    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_train_schedule, parent, false);
        return new ViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(schedules.get(position));
    }
    
    @Override
    public int getItemCount() {
        return schedules.size();
    }
    
    public void setItems(List<TrainSchedule> newSchedules) {
        this.schedules = newSchedules != null ? newSchedules : new ArrayList<>();
        notifyDataSetChanged();
    }
    
    class ViewHolder extends RecyclerView.ViewHolder {
        private TextView tvTrainName;
        private TextView tvDepartureTime;
        private TextView tvArrivalTime;
        private TextView tvPrice;
        
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTrainName = itemView.findViewById(R.id.tvTrainName);
            tvDepartureTime = itemView.findViewById(R.id.tvDepartureTime);
            tvArrivalTime = itemView.findViewById(R.id.tvArrivalTime);
            tvPrice = itemView.findViewById(R.id.tvPrice);
            
            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onItemClick(schedules.get(position));
                }
            });
        }
        
        public void bind(TrainSchedule schedule) {
            tvTrainName.setText(schedule.getTrainName());
            tvDepartureTime.setText(DateTimeUtils.formatTimeForDisplay(schedule.getDepartureTime()));
            tvArrivalTime.setText(DateTimeUtils.formatTimeForDisplay(schedule.getArrivalTime()));
            tvPrice.setText("৳ " + schedule.getPrice());
        }
    }
}

// In Activity
private void setupRecyclerView() {
    recyclerView.setLayoutManager(new LinearLayoutManager(this));
    adapter = new TrainScheduleAdapter(schedule -> {
        navigateToCompartment(schedule);
    });
    recyclerView.setAdapter(adapter);
}

private void navigateToCompartment(TrainSchedule schedule) {
    Gson gson = new Gson();
    String json = gson.toJson(schedule);
    
    Intent intent = new Intent(this, CompartmentActivity.class);
    intent.putExtra("scheduleJson", json);
    startActivity(intent);
}
```

---

## 8. Troubleshooting Guide

### 8.1 Common Issues and Solutions

**Issue: App crashes on network call**
```java
// ❌ Problem: Network on main thread
Call<ResponseBody> call = apiService.getData();
Response<ResponseBody> response = call.execute(); // CRASH!

// ✅ Solution: Use asynchronous call
call.enqueue(new Callback<ResponseBody>() { ... });
```

**Issue: NullPointerException in Fragment**
```java
// ❌ Problem: Fragment not attached
String text = getActivity().getString(R.string.app_name); // Might be null

// ✅ Solution: Check if attached
if (getActivity() != null) {
    String text = getActivity().getString(R.string.app_name);
}

// Or use requireActivity() (throws exception if null)
String text = requireActivity().getString(R.string.app_name);
```

**Issue: RecyclerView not showing items**
```java
// Check these:
1. Is adapter set? recyclerView.setAdapter(adapter)
2. Is layout manager set? recyclerView.setLayoutManager(...)
3. Does adapter have items? adapter.getItemCount() > 0
4. Is RecyclerView visible? recyclerView.getVisibility() == View.VISIBLE
5. Did you call notifyDataSetChanged()?
```

**Issue: API returns 401 Unauthorized**
```java
// Check:
1. Is token saved? Check SharedPreferences
2. Is interceptor adding token? Log in AuthInterceptor
3. Is token expired? May need to refresh or re-login
4. Is header format correct? "Authorization: Bearer <token>"
```

**Issue: JSON parsing fails**
```java
// ❌ Problem: Model fields don't match JSON
public class Station {
    public int stationId; // JSON has "id"
}

// ✅ Solution: Use @SerializedName
public class Station {
    @SerializedName("id")
    public int stationId;
}

// Or match field names exactly
public class Station {
    public int id; // Matches JSON "id"
}
```

**Issue: Fragment UI not updating**
```java
// ❌ Problem: Updating UI from background thread
new Thread(() -> {
    textView.setText("Text"); // CRASH!
}).start();

// ✅ Solution: Update on main thread
new Thread(() -> {
    String result = doBackgroundWork();
    requireActivity().runOnUiThread(() -> {
        textView.setText(result);
    });
}).start();

// Or use Handler
Handler mainHandler = new Handler(Looper.getMainLooper());
mainHandler.post(() -> {
    textView.setText("Text");
});
```

### 8.2 Debugging Checklist

**Before making network call**:
- [ ] Is internet permission in AndroidManifest?
- [ ] Is device connected to internet?
- [ ] Is base URL correct?
- [ ] Are parameters correct?
- [ ] Is token saved (for authenticated endpoints)?

**When adapter not working**:
- [ ] Is adapter created?
- [ ] Is adapter set to RecyclerView?
- [ ] Is LayoutManager set?
- [ ] Does adapter have data? (getItemCount() > 0)
- [ ] Did you call notifyDataSetChanged()?
- [ ] Is item layout correct?

**When navigation not working**:
- [ ] Is target activity declared in AndroidManifest?
- [ ] Are intent extras correct?
- [ ] Is context correct (use `this` in Activity, `requireContext()` in Fragment)?
- [ ] Is startActivity() called?

---

## Summary

This guide provides practical instructions for:

1. **Handling Activities**: Lifecycle, navigation, state management
2. **Handling Fragments**: Creation, communication, context handling
3. **Handling Network Calls**: Making requests, parsing responses, error handling
4. **Handling Adapters**: Creating adapters, binding data, handling clicks
5. **Viewing and Debugging**: Logging, debugging tools, common issues
6. **Common Patterns**: Complete code examples and best practices

Use this guide as a reference when working with any component in the RailNet Android application.
