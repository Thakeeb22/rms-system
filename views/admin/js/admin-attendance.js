requireAdmin(); // Ensure only admins can access this page
if (typeof setupLogout === "function") setupLogout();
if (typeof setupMobileMenu === "function") setupMobileMenu();

const filterDate = document.getElementById("filterDate");
const filterClass = document.getElementById("filterClass");
const tableBody = document.getElementById("attendanceTableBody");

// Set default date to today
filterDate.valueAsDate = new Date();

let allClasses = [];
let currentEditId = null;

// 1. Load Classes for Filter
async function loadClasses() {
    try {
        const res = await apiRequest("/admin/classes");
        if (res.ok) {
            allClasses = res.data?.classes || [];
            filterClass.innerHTML = '<option value="">All Classes</option>' + 
                allClasses.map(c => `<option value="${c._id}">${c.className}</option>`).join('');
        }
    } catch (error) {
        console.error("Failed to load classes:", error);
    }
}

// 2. Load Attendance Data
async function loadAttendance() {
    tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    const date = filterDate.value;
    const classId = filterClass.value;
    
    let url = `/attendance/all?date=${date}`;
    if (classId) url += `&classId=${classId}`;

    try {
        const res = await apiRequest(url);
        if (!res.ok) throw new Error(res.data?.message || "Failed to load attendance");

        const records = res.data?.data || [];
        renderTable(records);
        updateStats(records);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
    }
}

// 3. Render Table
function renderTable(records) {
    if (records.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">No attendance records found for this selection.</td></tr>';
        return;
    }

    tableBody.innerHTML = records.map(record => {
        const statusColor = getStatusColor(record.status);
        const methodIcon = record.method === 'QR' ? '<i class="fa-solid fa-qrcode"></i>' : '<i class="fa-solid fa-hand-pointer"></i>';
        
        return `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4">
                <p class="font-semibold text-gray-800">${record.student?.fullname || 'Unknown'}</p>
                <p class="text-xs text-gray-500">${record.student?.admissionNumber || ''}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">${record.class?.className || 'N/A'}</td>
            <td class="px-6 py-4 text-center text-sm text-gray-600">${new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">${record.status}</span>
            </td>
            <td class="px-6 py-4 text-center text-gray-500" title="${record.method}">
                ${methodIcon}
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="openEditModal('${record._id}', '${record.student?.fullname}', '${record.status}')" class="text-blue-500 hover:text-blue-700 text-sm font-semibold">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
            </td>
        </tr>`;
    }).join('');
}

// 4. Update Stats
function updateStats(records) {
    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    // Note: "Absent" is derived. If you have a total student count for the selected class, 
    // you could calculate: Total Students - (Present + Late + Excused). 
    // For now, we just show 0 or you can add logic to fetch total students.
    const absent = 0; 

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statPresent").textContent = present;
    document.getElementById("statLate").textContent = late;
    document.getElementById("statAbsent").textContent = absent;
}

// 5. Modal Logic
const editModal = document.getElementById("editModal");
const editStudentName = document.getElementById("editStudentName");
const editStatusSelect = document.getElementById("editStatusSelect");

window.openEditModal = function(id, name, currentStatus) {
    currentEditId = id;
    editStudentName.textContent = name;
    editStatusSelect.value = currentStatus;
    editModal.classList.remove("hidden");
    editModal.classList.add("flex");
};

document.getElementById("cancelEditBtn").addEventListener("click", () => {
    editModal.classList.add("hidden");
    editModal.classList.remove("flex");
});

document.getElementById("editModalOverlay").addEventListener("click", () => {
    editModal.classList.add("hidden");
    editModal.classList.remove("flex");
});

document.getElementById("saveEditBtn").addEventListener("click", async () => {
    const newStatus = editStatusSelect.value;
    const btn = document.getElementById("saveEditBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const res = await apiRequest(`/attendance/${currentEditId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            editModal.classList.add("hidden");
            editModal.classList.remove("flex");
            loadAttendance(); // Refresh table
        } else {
            alert(res.data?.message || "Failed to update status.");
        }
    } catch (error) {
        alert("Network error.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
    }
});

// Helpers
function getStatusColor(status) {
    const colors = {
        'Present': 'bg-green-100 text-green-700',
        'Late': 'bg-yellow-100 text-yellow-700',
        'Excused': 'bg-blue-100 text-blue-700',
        'Absent': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
}

// Event Listeners
filterDate.addEventListener("change", loadAttendance);
filterClass.addEventListener("change", loadAttendance);

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    await loadClasses();
    await loadAttendance();
});