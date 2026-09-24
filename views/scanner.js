document.addEventListener('DOMContentLoaded', () => {
    let html5QrcodeScanner = null;
    let lastScannedToken = null;
    let scanCooldown = false;

    const toggleBtn = document.getElementById('toggleCameraBtn');

    toggleBtn.addEventListener('click', () => {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                html5QrcodeScanner.clear();
                html5QrcodeScanner = null;
                toggleBtn.innerHTML = '<i class="fa-solid fa-video mr-1"></i> Start Camera';
            }).catch(err => console.error("Stop error:", err));
        } else {
            html5QrcodeScanner = new Html5Qrcode("reader");
            
            // ✅ UPDATED CONFIG: Smaller qrbox helps mobile cameras focus better
            const config = { 
                fps: 10, 
                qrbox: { width: 200, height: 200 }, 
                aspectRatio: 1.0 
            };

            html5QrcodeScanner.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanFailure
            ).then(() => {
                toggleBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i> Stop Camera';
                console.log("✅ Camera started successfully.");
            }).catch(err => {
                console.error("Camera start error:", err);
                alert("Camera access denied or not available. Please check permissions.");
            });
        }
    });

    function onScanSuccess(decodedText) {
        console.log("🎯 QR Code Scanned:", decodedText); // ✅ Debug log
        
        if (scanCooldown || decodedText === lastScannedToken) {
            console.log("⏳ Ignoring duplicate or cooldown scan.");
            return;
        }
        
        scanCooldown = true;
        lastScannedToken = decodedText;
        
        setTimeout(() => { 
            scanCooldown = false; 
            lastScannedToken = null; 
        }, 3000);
        
        processAttendance({ qrToken: decodedText });
    }

    function onScanFailure(error) {
        // ✅ Debug log: Uncomment the line below to see if it's constantly failing to decode
        // console.warn(`Scan failure: ${error}`); 
    }

    async function processAttendance(payload) {
        showLoadingState();
        if (navigator.onLine) {
            try {
                const response = await apiRequest('/attendance/scan', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const resultData = response.data?.data || response.data || {};
                    showSuccessState(resultData);
                } else {
                    showErrorState(response.data?.message || 'Failed to record.');
                }
            } catch (error) { 
                console.error("Network error:", error);
                showErrorState('Network error.'); 
            }
        } else {
            payload.offlineId = crypto.randomUUID();
            await window.OfflineQueue.enqueue({ method: 'POST', url: '/attendance/scan', payload });
            showOfflineState(payload.qrToken || 'Student');
        }
    }

    function hideAllStates() {
        ['emptyScanState', 'successScanState', 'offlineScanState', 'errorScanState'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }

    function showLoadingState() {
        hideAllStates();
        const el = document.getElementById('emptyScanState');
        el.classList.remove('hidden');
        el.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-4xl text-blue-500 mb-3"></i><p class="text-sm">Processing...</p>';
    }

    function showSuccessState(data) {
        hideAllStates();
        document.getElementById('successScanState').classList.remove('hidden');
        document.getElementById('scanName').textContent = data.studentName || 'Unknown';
        document.getElementById('scanClass').textContent = data.className || 'Unknown Class';
        document.getElementById('scanStatus').textContent = data.status || 'Present';
        document.getElementById('scanTime').textContent = data.checkInTime ? new Date(data.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
    }

    function showOfflineState(identifier) {
        hideAllStates();
        document.getElementById('offlineScanState').classList.remove('hidden');
        document.getElementById('offlineName').textContent = identifier;
    }

    function showErrorState(msg) {
        hideAllStates();
        document.getElementById('errorScanState').classList.remove('hidden');
        document.getElementById('scanError').textContent = msg;
    }
});