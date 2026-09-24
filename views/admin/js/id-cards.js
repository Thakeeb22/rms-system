requireAdmin();
if (typeof setupLogout === "function") setupLogout();
if (typeof setupMobileMenu === "function") setupMobileMenu();

const classFilter = document.getElementById("classFilter");
const generateBtn = document.getElementById("generateBtn");
const printBtn = document.getElementById("printBtn");
const cardsGrid = document.getElementById("cardsGrid");
const printArea = document.getElementById("printArea");
const cardCount = document.getElementById("cardCount");

// 1. Load Classes for Dropdown
async function loadClasses() {
  try {
    const res = await apiRequest("/admin/classes");
    if (res.ok) {
      const classes = res.data?.classes || [];
      classes.forEach((c) => {
        const option = document.createElement("option");
        option.value = c._id;
        option.textContent = c.className;
        classFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Failed to load classes:", error);
  }
}

// ... (keep the loadClasses function exactly as you have it) ...

// 2. Generate ID Cards
generateBtn.addEventListener("click", async () => {
  generateBtn.disabled = true;
  generateBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading...';
  cardsGrid.innerHTML = "";
  printArea.classList.add("hidden");
  printBtn.classList.add("hidden");
  cardCount.classList.add("hidden");

  try {
    const classId = classFilter.value;
    let url = "/admin/id-cards/students";
    if (classId) url += `?classId=${classId}`;

    const res = await apiRequest(url);
    if (!res.ok)
      throw new Error(res.data?.message || "Failed to fetch students");

    const students = res.data?.students || [];

    if (students.length === 0) {
      alert("No active students found for this selection.");
      return;
    }

    cardCount.textContent = `Generated ${students.length} ID card sets. Ready to print.`;
    cardCount.classList.remove("hidden");
    printArea.classList.remove("hidden");
    printBtn.classList.remove("hidden");

    // Render each student's Front and Back
    students.forEach((student) => {
      const setName = document.createElement("div");
      setName.className = "card-set";

      // --- FRONT CARD DESIGN ---
      const photoInitial = student.fullname
        ? student.fullname.charAt(0).toUpperCase()
        : "?";
      const photoHtml = student.photo
        ? `<img src="${student.photo}" class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" alt="Photo">`
        : `<div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-md text-blue-600 font-bold text-xl">${photoInitial}</div>`;

      const frontCard = document.createElement("div");
      frontCard.className = "id-card flex flex-col";

      frontCard.innerHTML = `
                <!-- Header Strip -->
                <div class="bg-blue-900 h-10 w-full flex items-center justify-center px-2">
                    <h3 class="text-white font-bold text-sm tracking-wider text-center">EDULOG ACADEMY</h3>
                </div>
                
                <!-- Body -->
                
<div class="w-16 h-16 mx-auto my-2 rounded-full flex items-center justify-center text-xl font-bold text-gray-600 overflow-hidden bg-gray-100">
  ${
    student.photo
      ? `<img src="${student.photo}" class="id-card-photo" alt="${student.fullname}">`
      : student.fullname
        ? student.fullname.charAt(0).toUpperCase()
        : "?"
  }
</div>
                    <div class="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-2">
    <h2 class="text-sm font-bold text-gray-800 leading-tight w-full truncate">${student.fullname}</h2>
    <p class="text-[10px] text-gray-600 mt-1 w-full truncate">
        <span class="font-semibold">Parent: </span> ${student.guardianName || "N/A"}
    </p>
</div>
                </div>

                <!-- Footer Strip -->
                <div class="bg-gray-50 h-6 w-full flex items-center justify-center border-t border-gray-200">
                    <span class="text-[9px] font-bold text-gray-700 tracking-wide">ADM: ${student.admissionNumber}</span>
                </div>
            `;

      // --- BACK CARD DESIGN ---
      const backCard = document.createElement("div");
      backCard.className = "id-card flex flex-col";
      backCard.innerHTML = `
                <!-- Header Strip -->
                <div class="bg-blue-900 h-8 w-full flex items-center justify-center px-2">
                    <h3 class="text-white font-bold text-xs tracking-wider">STUDENT IDENTITY CARD</h3>
                </div>

                <!-- Body (QR Code Area) -->
                <div class="flex-1 flex flex-col items-center justify-center px-2 py-1">
                    <div class="qr-container-back mb-1"></div>
                    <p class="text-[8px] text-gray-500 text-center font-semibold">SCAN FOR VERIFICATION</p>
                </div>

                <!-- Footer Strip (Return Info) -->
                <div class="bg-blue-50 h-10 w-full flex flex-col items-center justify-center px-2 border-t border-blue-100">
                    <p class="text-[7px] text-gray-600 text-center leading-tight">
                        This card remains valid upon promotion.<br>
                        If found, please return to:<br>
                        <span class="font-bold text-blue-800">Edulog Academy Admin Office</span>
                    </p>
                </div>
            `;

      // Append to set, then set to grid
      setName.appendChild(frontCard);
      setName.appendChild(backCard);
      cardsGrid.appendChild(setName);

      // Generate QR Code on the BACK card
      if (student.qrToken && typeof QRCode !== "undefined") {
        const qrContainer = backCard.querySelector(".qr-container-back");
        try {
          new QRCode(qrContainer, {
            text: student.qrToken,
            width: 45,
            height: 45,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M,
          });
        } catch (qrError) {
          console.error("QR Code generation error:", qrError);
        }
      }
    });
  } catch (error) {
    console.error("Error generating cards:", error);
    alert("Error generating cards: " + error.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML =
      '<i class="fa-solid fa-eye mr-2"></i> Preview Cards';
  }
});

// 3. Print Action
printBtn.addEventListener("click", () => {
  window.print();
});

// Initialize
document.addEventListener("DOMContentLoaded", loadClasses);
