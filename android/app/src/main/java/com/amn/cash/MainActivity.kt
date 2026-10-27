package com.amn.cash

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
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
import com.amn.cash.network.SmsMessageItem
import com.amn.cash.network.WindowsApiClient
import com.amn.cash.service.CollectorForegroundService
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
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
            Toast.makeText(this, "يرجى منح إذن الرسائل ليعمل التطبيق في المحل", Toast.LENGTH_LONG).show()
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
            Manifest.permission.READ_SMS,
            Manifest.permission.CAMERA
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
    var isFlushing by remember { mutableStateOf(false) }
    var messagesList by remember { mutableStateOf(WindowsApiClient.getAllMessages(context)) }
    val pendingCount = messagesList.count { it.status != "SYNCED" }

    val refreshData = {
        messagesList = WindowsApiClient.getAllMessages(context)
        totalSentCount = WindowsApiClient.getTotalSent(context)
        serverUrl = WindowsApiClient.getServerUrl(context)
    }

    // Auto refresh periodically when on screen
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(4000)
            refreshData()
        }
    }

    // QR Code Scanner Launcher using ZXing ScanContract
    val qrScannerLauncher = rememberLauncherForActivityResult(contract = ScanContract()) { result ->
        val contents = result.contents
        if (!contents.isNullOrBlank()) {
            Toast.makeText(context, "جاري قراءة كود الربط...", Toast.LENGTH_SHORT).show()
            WindowsApiClient.parseQrAndPair(context, contents) { ok, msg ->
                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                if (ok) {
                    refreshData()
                    CollectorForegroundService.startService(context)
                    isServiceRunning = true
                    currentStep = 4
                }
            }
        }
    }

    val launchQrScanner = {
        val options = ScanOptions().apply {
            setPrompt("وجّه الكاميرا نحو كود الربط في شاشة برنامج الويندوز")
            setBeepEnabled(true)
            setOrientationLocked(false)
            setBarcodeImageEnabled(false)
        }
        qrScannerLauncher.launch(options)
    }

    val vodaRed = Color(0xFFCA1535)
    val vodaGreen = Color(0xFF10895C)
    val warningOrange = Color(0xFFD97706)

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
                            text = "طابور المزامنة التلقائي للرسائل المالية",
                            fontSize = 10.sp,
                            color = Color.Gray
                        )
                    }
                }

                if (currentStep == 4) {
                    Row {
                        IconButton(onClick = { launchQrScanner() }) {
                            Text("📷", fontSize = 18.sp)
                        }
                        TextButton(onClick = { currentStep = 3 }) {
                            Text("⚙️ ضبط IP", fontSize = 11.sp, color = vodaRed, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

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
                                    text = "تطبيق التقاط ومزامنة رسائل فودافون كاش مع كمبيوتر الويندوز بطابور فوري آمن يمنع ضياع أي معاملة.",
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
                                    text = "تفعيل الأذونات الضرورية",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF192336)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "يتطلب التطبيق إذن الرسائل لقراءة تحويلات فودافون كاش، وإذن الكاميرا لمسح كود الربط. يتم إسقاط أي رموز سرية OTP فورياً.",
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
                                    Text("منح الأذونات والانتقال للربط", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    3 -> {
                        // Step 3: Server Address / Pair via Camera Scan OR Manual IP
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
                                Text("📷", fontSize = 36.sp)
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "ربط الهاتف بحاسوب الويندوز",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF192336)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "امسح كود الـ QR المعروض في شاشة (الأجهزة والاتصال) بالكمبيوتر بالكاميرا مباشرة:",
                                    fontSize = 12.sp,
                                    color = Color(0xFF68748A),
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(16.dp))

                                // Big Camera QR Scan Button
                                Button(
                                    onClick = { launchQrScanner() },
                                    colors = ButtonDefaults.buttonColors(containerColor = vodaRed),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth().height(48.dp)
                                ) {
                                    Text("📷 فتح الكاميرا لمسح الكود (QR Scan)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }

                                Spacer(modifier = Modifier.height(14.dp))
                                Text("أو أدخل عنوان IP الكمبيوتر يدوياً:", fontSize = 11.sp, color = Color.Gray)
                                Spacer(modifier = Modifier.height(8.dp))

                                OutlinedTextField(
                                    value = manualIpInput,
                                    onValueChange = { manualIpInput = it },
                                    label = { Text("IP الكمبيوتر (مثال: 192.168.1.100)") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedButton(
                                    onClick = {
                                        val ipClean = manualIpInput.trim()
                                        val target = if (ipClean.contains(":")) ipClean else "$ipClean:5500"
                                        val fullUrl = "http://$target/api/sms/inbox"

                                        WindowsApiClient.pairWithServer(context, "http://$target") { ok, msg ->
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                        }

                                        WindowsApiClient.savePairing(context, fullUrl, WindowsApiClient.getDeviceId(context), WindowsApiClient.getDeviceSecret(context))
                                        serverUrl = fullUrl
                                        CollectorForegroundService.startService(context)
                                        isServiceRunning = true
                                        currentStep = 4
                                    },
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("اتصال يدوي بالـ IP", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    4 -> {
                        // Step 4: Active Running Dashboard with Live Outbox Queue & Auto-Retry
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // 1. Connection Card
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
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
                                                text = if (isServiceRunning) "الخدمة نشطة وطابور المزامنة يعمل" else "الخدمة متوقفة مؤقتاً",
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
                                            modifier = Modifier.height(30.dp)
                                        ) {
                                            Text(if (isServiceRunning) "إيقاف" else "تشغيل", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "الكمبيوتر: ${serverUrl.substringBefore("/api/").ifEmpty { "غير محدد" }}",
                                        fontSize = 11.sp,
                                        color = Color.Gray,
                                        fontWeight = FontWeight.SemiBold
                                    )

                                    if (pingStatus != null) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = pingStatus ?: "",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (pingStatus?.contains("بنجاح") == true) vodaGreen else warningOrange
                                        )
                                    }
                                }
                            }

                            // 2. Alert Banner if there are pending unsynced messages!
                            if (pendingCount > 0) {
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFF59E0B))),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text("⚠️ تنبيه: رسائل معلقة في الطابور", fontWeight = FontWeight.Black, fontSize = 12.sp, color = Color(0xFF92400E))
                                            Text("يوجد $pendingCount رسالة لم تصل للكمبيوتر بعد. جاري إعادة المحاولة تلقائياً.", fontSize = 10.sp, color = Color(0xFFB45309))
                                        }
                                        Button(
                                            onClick = {
                                                isFlushing = true
                                                WindowsApiClient.flushOutbox(context) { s, f ->
                                                    isFlushing = false
                                                    refreshData()
                                                    Toast.makeText(context, "تم إرسال $s معلقة | فشل $f", Toast.LENGTH_SHORT).show()
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                            modifier = Modifier.height(32.dp)
                                        ) {
                                            Text(if (isFlushing) "جاري..." else "إرسال الآن 🔄", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }

                            // 3. Status Counters
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("إجمالي الملتقط", fontSize = 10.sp, color = Color.Gray)
                                        Text(text = "${messagesList.size}", fontSize = 18.sp, fontWeight = FontWeight.Black)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("مؤكد بالكمبيوتر ✓", fontSize = 10.sp, color = Color.Gray)
                                        Text(text = "${messagesList.count { it.status == "SYNCED" }}", fontSize = 18.sp, fontWeight = FontWeight.Black, color = vodaGreen)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("معلق بالطابور ⏳", fontSize = 10.sp, color = Color.Gray)
                                        Text(text = "$pendingCount", fontSize = 18.sp, fontWeight = FontWeight.Black, color = if (pendingCount > 0) warningOrange else Color.Gray)
                                    }
                                }
                            }

                            // 4. Action Buttons
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Flush Queue button
                                Button(
                                    onClick = {
                                        isFlushing = true
                                        WindowsApiClient.flushOutbox(context) { s, f ->
                                            isFlushing = false
                                            refreshData()
                                            Toast.makeText(context, "تم إرسال $s معلقة | فشل $f", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = if (pendingCount > 0) warningOrange else Color(0xFF1E293B)),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f).height(42.dp)
                                ) {
                                    Text(if (isFlushing) "جاري الإرسال..." else "🔄 إرسال المعلقات ($pendingCount)", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }

                                // Test SMS button (Completely Safe, Added to Outbox Queue)
                                OutlinedButton(
                                    onClick = {
                                        val testSms = "تم استلام مبلغ 1,000.00 جنيه من 01012345678 رصيدك الحالي هو 15,000.00 جنيه رقم العملية ${System.currentTimeMillis().toString().takeLast(6)}"
                                        Toast.makeText(context, "تم تسجيل الرسالة في الطابور وجاري إرسالها للكمبيوتر...", Toast.LENGTH_SHORT).show()
                                        WindowsApiClient.enqueueAndSyncMessage(context, "VF-Cash", testSms) { ok ->
                                            refreshData()
                                            if (ok) {
                                                Toast.makeText(context, "✓ تم تأكيد استلام الرسالة بالكمبيوتر فوراً!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(context, "حُفظت الرسالة في الطابور المحلي وسترسل تلقائياً فور توفر الاتصال.", Toast.LENGTH_LONG).show()
                                            }
                                        }
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f).height(42.dp)
                                ) {
                                    Text("📩 تجربة تحويل فودافون", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }

                                // Ping Server
                                IconButton(
                                    onClick = {
                                        isPinging = true
                                        pingStatus = "جاري الفحص..."
                                        WindowsApiClient.pingServer(context) { _, msg ->
                                            isPinging = false
                                            pingStatus = msg
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    modifier = Modifier.size(42.dp)
                                ) {
                                    Text("📶", fontSize = 18.sp)
                                }
                            }

                            // 5. Intercepted SMS Outbox Log (سجل الطابور والرسائل)
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 2.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "طابور وسجل الرسائل الملتقطة:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF1E293B)
                                )
                                TextButton(onClick = { refreshData() }) {
                                    Text("تحديث ↻", fontSize = 10.sp, color = vodaRed)
                                }
                            }

                            if (messagesList.isEmpty()) {
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
                                                text = "بمجرد وصول أي رسالة من فودافون كاش على الشريحة سيتم حفظها محلياً فوراً ومزامنتها مع الكمبيوتر.",
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
                                    items(messagesList) { item ->
                                        val isSynced = item.status == "SYNCED"
                                        val timeStr = SimpleDateFormat("HH:mm:ss dd/MM", Locale.getDefault()).format(Date(item.timestamp))

                                        Card(
                                            shape = RoundedCornerShape(14.dp),
                                            colors = CardDefaults.cardColors(containerColor = Color.White),
                                            border = if (!isSynced) CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(warningOrange)) else null,
                                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Box(
                                                            modifier = Modifier
                                                                .size(8.dp)
                                                                .background(if (isSynced) vodaGreen else warningOrange, CircleShape)
                                                        )
                                                        Spacer(modifier = Modifier.width(6.dp))
                                                        Text(
                                                            text = item.sender,
                                                            fontWeight = FontWeight.Bold,
                                                            fontSize = 11.sp,
                                                            color = Color(0xFF1E293B)
                                                        )
                                                    }

                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Text(
                                                            text = timeStr,
                                                            fontSize = 9.sp,
                                                            color = Color.Gray
                                                        )
                                                        Spacer(modifier = Modifier.width(6.dp))
                                                        if (isSynced) {
                                                            Text(
                                                                text = "✓ تم التأكيد بالكمبيوتر",
                                                                fontSize = 9.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = vodaGreen
                                                            )
                                                        } else {
                                                            Button(
                                                                onClick = {
                                                                    WindowsApiClient.triggerBackgroundQueueFlush(context)
                                                                    Toast.makeText(context, "جاري إعادة إرسال المعلقة...", Toast.LENGTH_SHORT).show()
                                                                },
                                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF3C7), contentColor = Color(0xFF92400E)),
                                                                shape = RoundedCornerShape(8.dp),
                                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                                                                modifier = Modifier.height(26.dp)
                                                            ) {
                                                                Text("⏳ معلق (إعادة الإرسال)", fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                                            }
                                                        }
                                                    }
                                                }

                                                Spacer(modifier = Modifier.height(6.dp))
                                                Text(
                                                    text = item.text,
                                                    fontSize = 10.sp,
                                                    lineHeight = 14.sp,
                                                    color = Color(0xFF334155)
                                                )

                                                if (!isSynced && !item.errorMessage.isNullOrBlank()) {
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(
                                                        text = "سبب التعليق: ${item.errorMessage}",
                                                        fontSize = 8.sp,
                                                        color = Color(0xFFDC2626),
                                                        fontWeight = FontWeight.Medium
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
        }
    }
}
