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
import com.amn.cash.network.WindowsApiClient
import com.amn.cash.service.CollectorForegroundService

class MainActivity : ComponentActivity() {

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

        setContent {
            AMNCollectorApp(
                onRequestPermissions = { requestSmsPermissions() },
                onRequestBattery = { requestBatteryOptimizationExemption() }
            )
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
    onRequestPermissions: () -> Unit,
    onRequestBattery: () -> Unit
) {
    val context = LocalContext.current
    var serverUrl by remember { mutableStateOf(WindowsApiClient.getServerUrl(context)) }
    var currentStep by remember { mutableStateOf(if (serverUrl.isNotBlank()) 4 else 1) }
    var isServiceRunning by remember { mutableStateOf(serverUrl.isNotBlank()) }
    var manualIpInput by remember { mutableStateOf("192.168.1.") }
    var totalSentCount by remember { mutableStateOf(WindowsApiClient.getTotalSent(context)) }

    val vodaRed = Color(0xFFCA1535)
    val vodaGreen = Color(0xFF10895C)

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFFF3F5F8)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "AMN Cash Collector",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = vodaRed
                )
                Text(
                    text = "v1.0",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray
                )
            }

            // Main Content Area by Wizard Step
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                when (currentStep) {
                    1 -> {
                        // Step 1: Welcome
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth()
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
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF192336),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "معالج تهيئة الهاتف لالتقاط رسائل فودافون كاش وتحويلها تلقائياً إلى برنامج سطح المكتب.",
                                    fontSize = 13.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center
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
                            modifier = Modifier.fillMaxWidth()
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
                                    text = "نحتاج إذن استقبال الرسائل للتعرف على التحويلات الواردة والسحب النقدي. يتم حظر وتجاهل أي رسالة تحتوي على OTP أو رمز سري فورياً.",
                                    fontSize = 12.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center
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
                                    Text("منح أذونات SMS", fontWeight = FontWeight.Bold)
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
                            modifier = Modifier.fillMaxWidth()
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
                                    text = "أدخل عنوان الـ IP المعروض في شاشة (الأجهزة والاتصال) على الكمبيوتر:",
                                    fontSize = 12.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                OutlinedTextField(
                                    value = manualIpInput,
                                    onValueChange = { manualIpInput = it },
                                    label = { Text("IP الكمبيوتر (مثال: 192.168.1.20)") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(20.dp))
                                Button(
                                    onClick = {
                                        val fullUrl = "http://${manualIpInput.trim()}:5500/api/sms/inbox"
                                        WindowsApiClient.savePairing(context, fullUrl, "token_mobile")
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
                        // Step 4: Active Running Dashboard (Matching Mockup 1)
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                // Status banner
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFFE9F8F0), RoundedCornerShape(12.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = if (isServiceRunning) "متصل بالنظام (جاهز للاستقبال)" else "الخدمة متوقفة مؤقتاً",
                                        color = if (isServiceRunning) vodaGreen else Color.Red,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Counters Row
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("الرسائل اليوم", fontSize = 11.sp, color = Color.Gray)
                                        Text(text = "$totalSentCount", fontSize = 22.sp, fontWeight = FontWeight.Black)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("تم الإرسال", fontSize = 11.sp, color = Color.Gray)
                                        Text(text = "$totalSentCount", fontSize = 22.sp, fontWeight = FontWeight.Black, color = vodaGreen)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("قيد الإرسال", fontSize = 11.sp, color = Color.Gray)
                                        Text(text = "0", fontSize = 22.sp, fontWeight = FontWeight.Black)
                                    }
                                }

                                Spacer(modifier = Modifier.height(20.dp))

                                // Test SMS button
                                OutlinedButton(
                                    onClick = {
                                        val testSms = "تم استلام مبلغ 1,000.00 جنيه من رقم 01012345678 رصيدك الحالي هو 20,000.00 جنيه رقم العملية 998877"
                                        WindowsApiClient.sendSmsEvent(context, testSms) { ok ->
                                            if (ok) {
                                                totalSentCount++
                                                Toast.makeText(context, "تم إرسال رسالة الاختبار بنجاح!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(context, "فشل الاتصال! تحقق من اتصال Wi-Fi", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("إرسال رسالة تجريبية للكمبيوتر", fontSize = 12.sp)
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Toggle Service
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
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = if (isServiceRunning) "إيقاف الخدمة مؤقتاً" else "تشغيل خدمة الاستقبال",
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Footer note
            Text(
                text = "AMN Cash • تشفير محلي 100% بدون أي خوادم سحابية",
                fontSize = 11.sp,
                color = Color(0xFF94A3B8)
            )
        }
    }
}
