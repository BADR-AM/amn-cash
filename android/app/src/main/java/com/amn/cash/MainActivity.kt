package com.amn.cash

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.amn.cash.network.SmsLogItem
import com.amn.cash.network.WindowsApiClient
import com.amn.cash.service.CollectorForegroundService
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private var deepLinkUrl: String? = null

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.RECEIVE_SMS] == true
        if (smsGranted) {
            Toast.makeText(this, "تم تفعيل أذونات الرسائل بنجاح", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "يرجى منح إذن الرسائل ليعمل التطبيق", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)

        setContent {
            AMNCollectorApp(
                initialDeepLink = deepLinkUrl,
                onRequestPermissions = { requestSmsPermissions() },
                onRequestBattery = { requestBatteryOptimizationExemption() }
            )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data
        if (data != null && data.scheme == "amncash" && data.host == "pair") {
            val server = data.getQueryParameter("server")
            if (!server.isNullOrBlank()) {
                deepLinkUrl = server
                WindowsApiClient.pairWithServer(this, server) { ok, msg ->
                    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
                    if (ok) {
                        CollectorForegroundService.startService(this)
                    }
                }
            }
        }
    }

    private fun requestSmsPermissions() {
        val perms = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        permissionLauncher.launch(perms.toTypedArray())
    }

    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } else {
                Toast.makeText(this, "تم استثناء التطبيق من توفير الطاقة مسبقاً", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

@Composable
fun AMNCollectorApp(
    initialDeepLink: String?,
    onRequestPermissions: () -> Unit,
    onRequestBattery: () -> Unit
) {
    val context = LocalContext.current
    var serverUrl by remember { mutableStateOf(WindowsApiClient.getServerUrl(context)) }
    var currentStep by remember { mutableStateOf(if (serverUrl.isNotBlank() || initialDeepLink != null) 4 else 1) }
    var isServiceRunning by remember { mutableStateOf(serverUrl.isNotBlank()) }
    var manualIpInput by remember { mutableStateOf("192.168.1.") }
    var totalSentCount by remember { mutableStateOf(WindowsApiClient.getTotalSent(context)) }
    var pingStatus by remember { mutableStateOf<String?>(null) }
    var isPinging by remember { mutableStateOf(false) }
    var logs by remember { mutableStateOf(WindowsApiClient.getLogs(context)) }

    val refreshLogs = {
        logs = WindowsApiClient.getLogs(context)
        totalSentCount = WindowsApiClient.getTotalSent(context)
    }

    val vodaRed = Color(0xFFCA1535)
    val vodaGreen = Color(0xFF10895C)

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFFF3F5F8)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(vodaRed, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("AMN", color = Color.White, fontWeight = FontWeight.Black, fontSize = 11.sp)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "AMN Cash Collector",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF1E293B)
                        )
                        Text(
                            text = "نظام المزامنة المباشرة مع الكمبيوتر",
                            fontSize = 10.sp,
                            color = Color.Gray
                        )
                    }
                }

                if (currentStep == 4) {
                    TextButton(onClick = { currentStep = 3 }) {
                        Text("⚙️ ضبط الـ IP", fontSize = 11.sp, color = vodaRed, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Main Content Area by Step
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (currentStep) {
                    1 -> {
                        // Step 1: Welcome
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth().align(Alignment.Center)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .background(Color(0xFFFDE6E8), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("📱", fontSize = 28.sp)
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "مرحباً بك في AMN Cash",
                                    fontSize = 19.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF192336),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "تطبيق مساعد لالتقاط رسائل فودافون كاش ومزامنتها لحظياً مع حاسوب الويندوز على نفس شبكة الـ Wi-Fi.",
                                    fontSize = 12.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center,
                                    lineHeight = 18.sp
                                )
                                Spacer(modifier = Modifier.height(24.dp))
                                Button(
                                    onClick = { currentStep = 2 },
                                    colors = ButtonDefaults.buttonColors(containerColor = vodaRed),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("بدء التهيئة (التالي)", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    2 -> {
                        // Step 2: Permissions
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth().align(Alignment.Center)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("🔒", fontSize = 32.sp)
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "تفعيل أذونات الرسائل",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF192336)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "يتطلب التطبيق إذن قراءة واستقبال الرسائل للتعرف على معاملات فودافون كاش فور وصولها. يتم تجاهل أي رسائل خاصة أو رموز سرية OTP فورياً.",
                                    fontSize = 12.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center,
                                    lineHeight = 18.sp
                                )
                                Spacer(modifier = Modifier.height(20.dp))
                                Button(
                                    onClick = {
                                        onRequestPermissions()
                                        currentStep = 3
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = vodaRed),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("منح أذونات الرسائل (SMS)", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    3 -> {
                        // Step 3: Server Address / Pair
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth().align(Alignment.Center)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("💻", fontSize = 32.sp)
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "الربط بحاسوب الويندوز",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF192336)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "أدخل عنوان IP الكمبيوتر المعروض في شاشة (الأجهزة والاتصال) ببرنامج الكمبيوتر:",
                                    fontSize = 12.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                OutlinedTextField(
                                    value = manualIpInput,
                                    onValueChange = { manualIpInput = it },
                                    label = { Text("IP الكمبيوتر (مثال: 192.168.1.100)") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(20.dp))
                                Button(
                                    onClick = {
                                        val ipClean = manualIpInput.trim()
                                        val target = if (ipClean.contains(":")) ipClean else "$ipClean:5500"
                                        val fullUrl = "http://$target/api/sms/inbox"

                                        WindowsApiClient.pairWithServer(context, "http://$target") { ok, msg ->
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                        }

                                        WindowsApiClient.savePairing(context, fullUrl, "dev_mobile_companion", "sec_amn_companion_secret")
                                        serverUrl = fullUrl
                                        CollectorForegroundService.startService(context)
                                        isServiceRunning = true
                                        currentStep = 4
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = vodaRed),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("حفظ والاتصال الآن", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    4 -> {
                        // Step 4: Active Running Dashboard with Live Log & Ping & Safe Test
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // 1. Connection Card
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(
                                                modifier = Modifier
                                                    .size(10.dp)
                                                    .background(if (isServiceRunning) vodaGreen else Color.Red, CircleShape)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = if (isServiceRunning) "الخدمة نشطة وجاهزة للاستقبال" else "الخدمة متوقفة مؤقتاً",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = if (isServiceRunning) vodaGreen else Color.Red
                                            )
                                        }

                                        Button(
                                            onClick = {
                                                if (isServiceRunning) {
                                                    CollectorForegroundService.stopService(context)
                                                    isServiceRunning = false
                                                } else {
                                                    CollectorForegroundService.startService(context)
                                                    isServiceRunning = true
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (isServiceRunning) Color(0xFFFDE6E8) else vodaGreen,
                                                contentColor = if (isServiceRunning) vodaRed else Color.White
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                            modifier = Modifier.height(32.dp)
                                        ) {
                                            Text(if (isServiceRunning) "إيقاف" else "تشغيل", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "الكمبيوتر: ${serverUrl.substringBefore("/api/").ifEmpty { "غير محدد" }}",
                                        fontSize = 11.sp,
                                        color = Color.Gray,
                                        fontWeight = FontWeight.SemiBold
                                    )

                                    if (pingStatus != null) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = pingStatus ?: "",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (pingStatus?.contains("بنجاح") == true) vodaGreen else Color(0xFFD97706)
                                        )
                                    }
                                }
                            }

                            // 2. Counters Row
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("إجمالي الرسائل", fontSize = 10.sp, color = Color.Gray)
                                        Text(text = "$totalSentCount", fontSize = 20.sp, fontWeight = FontWeight.Black)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("المزامنة للكمبيوتر", fontSize = 10.sp, color = Color.Gray)
                                        Text(text = "$totalSentCount", fontSize = 20.sp, fontWeight = FontWeight.Black, color = vodaGreen)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("سجل الهاتف", fontSize = 10.sp, color = Color.Gray)
                                        Text(text = "${logs.size}", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.DarkGray)
                                    }
                                }
                            }

                            // 3. Quick Action Buttons
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Test SMS button (Completely Safe, No Crash!)
                                Button(
                                    onClick = {
                                        val testSms = "تم استلام مبلغ 1,000.00 جنيه من 01012345678 رصيدك الحالي هو 15,000.00 جنيه رقم العملية ${System.currentTimeMillis().toString().takeLast(6)}"
                                        Toast.makeText(context, "جاري إرسال الرسالة للكمبيوتر...", Toast.LENGTH_SHORT).show()
                                        WindowsApiClient.sendSmsEvent(context, testSms, "VF-Cash") { ok ->
                                            refreshLogs()
                                            if (ok) {
                                                Toast.makeText(context, "✓ تم وصول الرسالة للكمبيوتر وتسجيلها!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(context, "فشل الاتصال! تأكد أن الكمبيوتر والموبايل على نفس الـ Wi-Fi", Toast.LENGTH_LONG).show()
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = vodaRed),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f).height(44.dp)
                                ) {
                                    Text("🧪 إرسال رسالة تجريبية", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                // Ping server button
                                OutlinedButton(
                                    onClick = {
                                        isPinging = true
                                        pingStatus = "جاري الفحص..."
                                        WindowsApiClient.pingServer(context) { ok, msg ->
                                            isPinging = false
                                            pingStatus = msg
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f).height(44.dp)
                                ) {
                                    Text(if (isPinging) "جاري الفحص..." else "🔄 اختبار الاتصال", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            // 4. Intercepted SMS Activity Log (سجل الرسائل الملتقطة)
                            Text(
                                text = "سجل الرسائل الملتقطة مؤخراً:",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E293B),
                                modifier = Modifier.padding(top = 4.dp)
                            )

                            if (logs.isEmpty()) {
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    modifier = Modifier.fillMaxWidth().weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier.fillMaxSize().padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text("📩", fontSize = 28.sp)
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                text = "لا توجد رسائل ملتقطة حتى الآن.",
                                                fontSize = 12.sp,
                                                color = Color.Gray,
                                                fontWeight = FontWeight.Medium
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "بمجرد وصول أي رسالة من فودافون كاش على الشريحة سيتم تسجيلها وإرسالها للكمبيوتر فوراً.",
                                                fontSize = 10.sp,
                                                color = Color.LightGray,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }
                                }
                            } else {
                                LazyColumn(
                                    modifier = Modifier.fillMaxWidth().weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    items(logs) { item ->
                                        Card(
                                            shape = RoundedCornerShape(14.dp),
                                            colors = CardDefaults.cardColors(containerColor = Color.White),
                                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text(
                                                        text = item.sender,
                                                        fontWeight = FontWeight.Black,
                                                        fontSize = 11.sp,
                                                        color = vodaRed
                                                    )

                                                    val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date(item.timestamp))
                                                    Text(
                                                        text = timeStr,
                                                        fontSize = 10.sp,
                                                        color = Color.Gray
                                                    )
                                                }

                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = item.text,
                                                    fontSize = 11.sp,
                                                    color = Color(0xFF334155),
                                                    lineHeight = 16.sp
                                                )

                                                Spacer(modifier = Modifier.height(6.dp))
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.End
                                                ) {
                                                    val statusText = if (item.success) "✓ تم الإرسال للكمبيوتر" else "❌ فشل الإرسال"
                                                    val statusColor = if (item.success) vodaGreen else Color.Red
                                                    Text(
                                                        text = statusText,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = statusColor
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Footer note
            Text(
                text = "AMN Cash • تشفير محلي 100% بدون أي خوادم سحابية",
                fontSize = 10.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}
