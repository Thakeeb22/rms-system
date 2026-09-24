document.addEventListener('DOMContentLoaded', async () => {
    const dateInput = document.getElementById('attendanceDate');
    const listContainer = document.getElementById('attendanceList');
    const classNameDisplay = document.getElementById('classNameDisplay');
    
    if (typeof setupMobileMenu === "function") setupMobileMenu();
    if (typeof setupLogout === "function") setupLogout();

    if (!dateInput || !listContainer) return;

    dateInput.valueAsDate = new Date();
    let currentClassId = null;

    async function loadAttendance(classId) {
        if (!classId) {
            listContainer.innerHTML = '<p class="p-4 text-center text-yellow-600">You are not assigned as a Class Teacher.</p>';
            return;
        }

        listContainer.innerHTML = '<p class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</p>';
        const date = dateInput.value;

        try {
            const res = await apiRequest(`/attendance/my-class?date=${date}&classId=${classId}`); 
            if (!res.ok) throw new Error(res.data?.message || 'Failed to load attendance');

            const attendanceRecords = res.data?.data || [];
            const attendedStudentIds = new Set(attendanceRecords.map(r => r.student._id));

            const studentsRes = await apiRequest(`/teacher/students?classId=${classId}`);
            if (!studentsRes.ok) throw new Error(studentsRes.data?.message || 'Failed to load students');
            const students = studentsRes.data?.students || [];
            
            if (students.length > 0 && students[0].class) {
                classNameDisplay.textContent = students[0].class.className;
            }

            let presentCount = 0;
            let absentCount = 0;

            listContainer.innerHTML = students.map(student => {
                const isPresent = attendedStudentIds.has(student._id);
                if (isPresent) presentCount++; else absentCount++;

                // Button logic for absent students
                const actionButton = isPresent 
                    ? `<span class="text-xs text-gray-400 font-medium">Checked in</span>` 
                    : `<button onclick="manualMarkStudent('${student._id}', this)" class="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full hover:bg-blue-600 transition shadow-sm">
                         <i class="fa-solid fa-check mr-1"></i> Mark Present
                       </button>`;

                return `
                <div class="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                            ${student.fullname ? student.fullname.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800">${student.fullname || 'Unknown'}</p>
                            <p class="text-xs text-gray-500">${student.admissionNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${isPresent ? 'Present' : 'Absent'}
                        </span>
                        ${actionButton}
                    </div>
                </div>`;
            }).join('');

            document.getElementById('presentCount').textContent = presentCount;
            document.getElementById('absentCount').textContent = absentCount;

        } catch (error) {
            console.error(error);
            listContainer.innerHTML = `<p class="p-4 text-center text-red-500">Error: ${error.message}</p>`;
        }
    }

    async function setup() {
        try {
            const dashboardRes = await apiRequest('/teacher/dashboard');
            if (dashboardRes.ok && dashboardRes.data?.dashboard) {
                const assignedClass = dashboardRes.data.dashboard.teacher.assignedClass;
                if (assignedClass) {
                    currentClassId = assignedClass._id;
                    classNameDisplay.textContent = assignedClass.className;
                    loadAttendance(currentClassId);
                } else {
                    loadAttendance(null);
                }
            }
        } catch (error) { console.error(error); }
    }

    dateInput.addEventListener('change', () => { if (currentClassId) loadAttendance(currentClassId); });
    setup();
});

// Global function for the "Mark Present" button
window.manualMarkStudent = async function(studentId, btnElement) {
    if (!confirm("Mark this student as present manually?")) return;

    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const res = await apiRequest('/attendance/scan', {
            method: 'POST',
            body: JSON.stringify({ studentId: studentId, method: 'MANUAL' })
        });

        if (res.ok) {
            btnElement.className = "px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full transition shadow-sm";
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Marked!';
            setTimeout(() => {
                // Reload the list to update counts and button states
                const dateInput = document.getElementById('attendanceDate');
                const currentClassId = window.currentClassId || null; // You might need to expose this or re-fetch
                // For simplicity, just reload the page or call loadAttendance if exposed
                window.location.reload(); 
            }, 1000);
        } else {
            alert(res.data?.message || "Failed to mark student.");
            btnElement.disabled = false;
            btnElement.innerHTML = originalHTML;
        }
    } catch (error) {
        alert("Network error.");
        btnElement.disabled = false;
        btnElement.innerHTML = originalHTML;
    }
};