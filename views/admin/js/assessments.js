requireAdmin();
setupLogout();
setupMobileMenu();

let allAssessments = [];
let filteredAssessments = [];
let allSessions = [];
let allTerms = [];

/* =========================================================
LOAD INITIAL DATA
========================================================= */
async function loadInitialData() {
  try {
    const [studentsRes, sessionsRes, termsRes] = await Promise.all([
      apiRequest("/admin/students"),
      apiRequest("/admin/sessions"),
      apiRequest("/admin/terms"),
    ]);

    if (studentsRes.ok) allStudents = studentsRes.data?.students || [];
    if (sessionsRes.ok) allSessions = sessionsRes.data?.sessions || [];
    if (termsRes.ok) allTerms = termsRes.data?.terms || [];

    populateFilterDropdowns();
    populateFormDropdowns();
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateFilterDropdowns() {
  const studentSelect = document.getElementById("filterStudent");
  const sessionSelect = document.getElementById("filterSession");
  const termSelect = document.getElementById("filterTerm");

  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">All Students</option>';
    allStudents.forEach((student) => {
      const opt = document.createElement("option");
      opt.value = student._id;
      opt.textContent = `${student.fullname} (${student.admissionNumber})`;
      studentSelect.appendChild(opt);
    });
  }

  if (sessionSelect) {
    sessionSelect.innerHTML = '<option value="">All Sessions</option>';
    allSessions.forEach((session) => {
      const opt = document.createElement("option");
      opt.value = session._id;
      opt.textContent = session.sessionName;
      sessionSelect.appendChild(opt);
    });
  }

  if (termSelect) {
    termSelect.innerHTML = '<option value="">All Terms</option>';
    allTerms.forEach((term) => {
      const opt = document.createElement("option");
      opt.value = term._id;
      opt.textContent = term.termName;
      termSelect.appendChild(opt);
    });
  }
}

function populateFormDropdowns() {
  const studentSelect = document.getElementById("assessmentStudent");
  const sessionSelect = document.getElementById("assessmentSession");
  const termSelect = document.getElementById("assessmentTerm");

  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">Select student</option>';
    allStudents
      .filter((s) => s.isActive)
      .forEach((student) => {
        const opt = document.createElement("option");
        opt.value = student._id;
        opt.textContent = `${student.fullname} (${student.admissionNumber})`;
        studentSelect.appendChild(opt);
      });
  }

  if (sessionSelect) {
    sessionSelect.innerHTML = '<option value="">Select session</option>';
    allSessions.forEach((session) => {
      const opt = document.createElement("option");
      opt.value = session._id;
      opt.textContent = session.sessionName;
      if (session.isCurrent) opt.selected = true;
      sessionSelect.appendChild(opt);
    });
  }

  if (termSelect) {
    termSelect.innerHTML = '<option value="">Select term</option>';
    allTerms.forEach((term) => {
      const opt = document.createElement("option");
      opt.value = term._id;
      opt.textContent = term.termName;
      if (term.isCurrent) opt.selected = true;
      termSelect.appendChild(opt);
    });
  }
}

/* =========================================================
LOAD ASSESSMENTS
========================================================= */
async function loadAssessments() {
  const assessmentsContainer = document.getElementById("assessmentsContainer");
  const loadingElement = document.getElementById("assessmentsLoading");

  if (!assessmentsContainer) return;

  if (loadingElement) loadingElement.classList.remove("hidden");

  try {
    const studentId = document.getElementById("filterStudent")?.value;
    const sessionId = document.getElementById("filterSession")?.value;
    const termId = document.getElementById("filterTerm")?.value;

    let url = "/admin/assessments";
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (sessionId) params.append("sessionId", sessionId);
    if (termId) params.append("termId", termId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load assessments.");
    }

    allAssessments = response.data?.assessments || [];
    filteredAssessments = [...allAssessments];

    renderAssessments();
    updateAssessmentCount();
  } catch (error) {
    console.error("Failed to load assessments:", error);
    assessmentsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h3 class="font-bold text-lg text-gray-700">Unable to load assessments</h3>
        <p class="text-gray-500 mt-1">${escapeHTML(error.message || "Something went wrong.")}</p>
      </div>
    `;
  } finally {
    if (loadingElement) loadingElement.classList.add("hidden");
  }
}

/* =========================================================
RENDER ASSESSMENTS
========================================================= */
function renderAssessments() {
  const assessmentsContainer = document.getElementById("assessmentsContainer");
  if (!assessmentsContainer) return;

  if (filteredAssessments.length === 0) {
    assessmentsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-clipboard-check text-4xl mb-3 text-gray-300"></i>
        <h3 class="font-bold text-lg text-gray-700">No assessments found</h3>
        <p class="mt-1">There are no assessments to display.</p>
      </div>
    `;
    return;
  }

  assessmentsContainer.innerHTML = filteredAssessments.map((assessment) => createAssessmentCard(assessment)).join("");
}

/* =========================================================
CREATE ASSESSMENT CARD
========================================================= */
function createAssessmentCard(assessment) {
  const assessmentId = assessment._id;
  const studentName = assessment.student?.fullname || "N/A";
  const admissionNumber = assessment.student?.admissionNumber || "";
  const sessionName = assessment.session?.sessionName || "N/A";
  const termName = assessment.term?.termName || "N/A";

  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-sm text-gray-500 font-medium">Student</p>
          <h2 class="text-xl font-bold text-blue-500 mt-1">${escapeHTML(studentName)}</h2>
          <p class="text-xs text-gray-500">${escapeHTML(admissionNumber)}</p>
        </div>
        <div class="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-clipboard-check text-yellow-600"></i>
        </div>
      </div>

      <div class="mb-3">
        <p class="text-sm text-gray-500 font-medium">Period</p>
        <p class="text-sm text-gray-800 mt-1">${escapeHTML(sessionName)} - ${escapeHTML(termName)}</p>
      </div>

      ${assessment.attendance ? `
        <div class="mb-3 pt-3 border-t">
          <p class="text-xs font-semibold text-gray-600 mb-2">Attendance</p>
          <div class="flex gap-2 text-xs">
            <span class="px-2 py-1 bg-gray-100 rounded">Opened: ${assessment.attendance.schoolOpened || 0}</span>
            <span class="px-2 py-1 bg-green-100 text-green-700 rounded">Present: ${assessment.attendance.present || 0}</span>
            <span class="px-2 py-1 bg-red-100 text-red-700 rounded">Absent: ${assessment.attendance.absent || 0}</span>
          </div>
        </div>
      ` : ""}

      <div class="mt-4 pt-4 border-t flex justify-end gap-2">
        <button
          type="button"
          class="delete-assessment-btn px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition text-xs"
          data-id="${assessmentId}"
          data-student="${escapeHTML(studentName)}"
        >
          <i class="fa-solid fa-trash mr-1"></i>
          Delete
        </button>
        <button
          type="button"
          class="edit-assessment-btn px-3 py-1.5 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition text-xs"
          data-id="${assessmentId}"
        >
          <i class="fa-solid fa-pen mr-1"></i>
          Edit
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
CREATE ASSESSMENT
========================================================= */
async function createAssessment() {
  const form = document.getElementById("addAssessmentForm");
  const createButton = document.getElementById("createAssessmentBtn");

  if (!form) return;

  const student = document.getElementById("assessmentStudent")?.value;
  const session = document.getElementById("assessmentSession")?.value;
  const term = document.getElementById("assessmentTerm")?.value;

  hideMessage("addAssessmentFormMessage");

  if (!student || !session || !term) {
    showMessage("addAssessmentFormMessage", "Please select student, session, and term.", "error");
    return;
  }

  const attendance = {
    schoolOpened: parseInt(document.getElementById("schoolOpened")?.value) || 0,
    present: parseInt(document.getElementById("present")?.value) || 0,
    absent: parseInt(document.getElementById("absent")?.value) || 0,
  };

  const affective = {
    punctuality: parseInt(document.getElementById("punctuality")?.value) || null,
    neatness: parseInt(document.getElementById("neatness")?.value) || null,
    honesty: parseInt(document.getElementById("honesty")?.value) || null,
    politeness: parseInt(document.getElementById("politeness")?.value) || null,
    attentiveness: parseInt(document.getElementById("attentiveness")?.value) || null,
    leadership: parseInt(document.getElementById("leadership")?.value) || null,
  };

  const psychomotor = {
    handwriting: parseInt(document.getElementById("handwriting")?.value) || null,
    sports: parseInt(document.getElementById("sports")?.value) || null,
    handlingTools: parseInt(document.getElementById("handlingTools")?.value) || null,
    drawing: parseInt(document.getElementById("drawing")?.value) || null,
  };

  const nextTermBegins = document.getElementById("nextTermBegins")?.value || null;
  const classTeacherComment = document.getElementById("classTeacherComment")?.value || "";
  const principalComment = document.getElementById("principalComment")?.value || "";

  try {
    setButtonLoading(createButton, true, "Creating assessment...");

    const response = await apiRequest("/admin/student-assessments", {
      method: "POST",
      body: JSON.stringify({
        student,
        session,
        term,
        attendance,
        affective,
        psychomotor,
        nextTermBegins,
        classTeacherComment,
        principalComment,
      }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to create assessment.");
    }

    showMessage("addAssessmentFormMessage", response.data?.message || "Assessment created successfully.", "success");
    form.reset();
    await loadAssessments();

    setTimeout(() => closeAddAssessmentModal(), 1000);
  } catch (error) {
    console.error("Failed to create assessment:", error);
    showMessage("addAssessmentFormMessage", error.message || "Failed to create assessment.", "error");
  } finally {
    setButtonLoading(createButton, false);
  }
}

/* =========================================================
EDIT ASSESSMENT
========================================================= */
async function openEditAssessmentModal(assessmentId) {
  const modal = document.getElementById("editAssessmentModal");
  const loading = document.getElementById("editAssessmentLoading");
  const form = document.getElementById("editAssessmentForm");
  const fieldsContainer = document.getElementById("editAssessmentFields");

  if (!modal || !loading || !form || !fieldsContainer) return;

  form.classList.add("hidden");
  loading.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const response = await apiRequest(`/admin/assessments/${assessmentId}`);

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load assessment.");
    }

    const assessment = response.data?.assessment;
    if (!assessment) {
      throw new Error("Assessment not found.");
    }

    fieldsContainer.innerHTML = buildEditFields(assessment);
    form.dataset.assessmentId = assessmentId;

    loading.classList.add("hidden");
    form.classList.remove("hidden");
  } catch (error) {
    console.error("Failed to load assessment:", error);
    loading.classList.add("hidden");
    alert(error.message || "Failed to load assessment.");
    closeEditAssessmentModal();
  }
}

function buildEditFields(assessment) {
  return `
    <div class="space-y-6">
      <div class="p-4 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600">Student</p>
        <p class="font-semibold text-gray-800">${escapeHTML(assessment.student?.fullname || "N/A")}</p>
        <p class="text-sm text-gray-600 mt-2">Period</p>
        <p class="font-semibold text-gray-800">${escapeHTML(assessment.session?.sessionName || "N/A")} - ${escapeHTML(assessment.term?.termName || "N/A")}</p>
      </div>

      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-3">Attendance</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="editSchoolOpened" class="block text-sm font-medium text-gray-700 mb-2">School Opened</label>
            <input type="number" id="editSchoolOpened" value="${assessment.attendance?.schoolOpened || 0}" min="0" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editPresent" class="block text-sm font-medium text-gray-700 mb-2">Present</label>
            <input type="number" id="editPresent" value="${assessment.attendance?.present || 0}" min="0" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editAbsent" class="block text-sm font-medium text-gray-700 mb-2">Absent</label>
            <input type="number" id="editAbsent" value="${assessment.attendance?.absent || 0}" min="0" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-3">Affective Traits (1-5)</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label for="editPunctuality" class="block text-sm font-medium text-gray-700 mb-2">Punctuality</label>
            <input type="number" id="editPunctuality" value="${assessment.affective?.punctuality || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editNeatness" class="block text-sm font-medium text-gray-700 mb-2">Neatness</label>
            <input type="number" id="editNeatness" value="${assessment.affective?.neatness || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editHonesty" class="block text-sm font-medium text-gray-700 mb-2">Honesty</label>
            <input type="number" id="editHonesty" value="${assessment.affective?.honesty || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editPoliteness" class="block text-sm font-medium text-gray-700 mb-2">Politeness</label>
            <input type="number" id="editPoliteness" value="${assessment.affective?.politeness || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editAttentiveness" class="block text-sm font-medium text-gray-700 mb-2">Attentiveness</label>
            <input type="number" id="editAttentiveness" value="${assessment.affective?.attentiveness || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editLeadership" class="block text-sm font-medium text-gray-700 mb-2">Leadership</label>
            <input type="number" id="editLeadership" value="${assessment.affective?.leadership || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-3">Psychomotor Skills (1-5)</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label for="editHandwriting" class="block text-sm font-medium text-gray-700 mb-2">Handwriting</label>
            <input type="number" id="editHandwriting" value="${assessment.psychomotor?.handwriting || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editSports" class="block text-sm font-medium text-gray-700 mb-2">Sports</label>
            <input type="number" id="editSports" value="${assessment.psychomotor?.sports || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editHandlingTools" class="block text-sm font-medium text-gray-700 mb-2">Handling Tools</label>
            <input type="number" id="editHandlingTools" value="${assessment.psychomotor?.handlingTools || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label for="editDrawing" class="block text-sm font-medium text-gray-700 mb-2">Drawing</label>
            <input type="number" id="editDrawing" value="${assessment.psychomotor?.drawing || ""}" min="1" max="5" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-3">Comments</h3>
        <div class="space-y-4">
          <div>
            <label for="editClassTeacherComment" class="block text-sm font-medium text-gray-700 mb-2">Class Teacher Comment</label>
            <textarea id="editClassTeacherComment" rows="3" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">${escapeHTML(assessment.classTeacherComment || "")}</textarea>
          </div>
          <div>
            <label for="editPrincipalComment" class="block text-sm font-medium text-gray-700 mb-2">Principal Comment</label>
            <textarea id="editPrincipalComment" rows="3" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">${escapeHTML(assessment.principalComment || "")}</textarea>
          </div>
          <div>
            <label for="editNextTermBegins" class="block text-sm font-medium text-gray-700 mb-2">Next Term Begins</label>
            <input type="date" id="editNextTermBegins" value="${assessment.nextTermBegins ? new Date(assessment.nextTermBegins).toISOString().split('T')[0] : ""}" class="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>
      </div>
    </div>
  `;
}

async function updateAssessment(event) {
  event.preventDefault();
  const form = document.getElementById("editAssessmentForm");
  const updateButton = document.getElementById("updateAssessmentBtn");

  if (!form) return;

  const assessmentId = form.dataset.assessmentId;

  const attendance = {
    schoolOpened: parseInt(document.getElementById("editSchoolOpened")?.value) || 0,
    present: parseInt(document.getElementById("editPresent")?.value) || 0,
    absent: parseInt(document.getElementById("editAbsent")?.value) || 0,
  };

  const affective = {
    punctuality: parseInt(document.getElementById("editPunctuality")?.value) || null,
    neatness: parseInt(document.getElementById("editNeatness")?.value) || null,
    honesty: parseInt(document.getElementById("editHonesty")?.value) || null,
    politeness: parseInt(document.getElementById("editPoliteness")?.value) || null,
    attentiveness: parseInt(document.getElementById("editAttentiveness")?.value) || null,
    leadership: parseInt(document.getElementById("editLeadership")?.value) || null,
  };

  const psychomotor = {
    handwriting: parseInt(document.getElementById("editHandwriting")?.value) || null,
    sports: parseInt(document.getElementById("editSports")?.value) || null,
    handlingTools: parseInt(document.getElementById("editHandlingTools")?.value) || null,
    drawing: parseInt(document.getElementById("editDrawing")?.value) || null,
  };

  const nextTermBegins = document.getElementById("editNextTermBegins")?.value || null;
  const classTeacherComment = document.getElementById("editClassTeacherComment")?.value || "";
  const principalComment = document.getElementById("editPrincipalComment")?.value || "";

  hideMessage("editAssessmentFormMessage");

  try {
    setButtonLoading(updateButton, true, "Updating assessment...");

    const response = await apiRequest(`/admin/assessments/${assessmentId}`, {
      method: "PUT",
      body: JSON.stringify({
        attendance,
        affective,
        psychomotor,
        nextTermBegins,
        classTeacherComment,
        principalComment,
      }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to update assessment.");
    }

    showMessage("editAssessmentFormMessage", response.data?.message || "Assessment updated successfully.", "success");
    await loadAssessments();

    setTimeout(() => closeEditAssessmentModal(), 1000);
  } catch (error) {
    console.error("Failed to update assessment:", error);
    showMessage("editAssessmentFormMessage", error.message || "Failed to update assessment.", "error");
  } finally {
    setButtonLoading(updateButton, false);
  }
}

/* =========================================================
DELETE ASSESSMENT
========================================================= */
async function deleteAssessment(assessmentId, studentName) {
  if (!confirm(`Are you sure you want to delete the assessment for "${studentName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/assessments/${assessmentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to delete assessment.");
    }

    alert(response.data?.message || "Assessment deleted successfully.");
    await loadAssessments();
  } catch (error) {
    console.error("Failed to delete assessment:", error);
    alert(error.message || "Failed to delete assessment.");
  }
}

/* =========================================================
MODAL CONTROLS
========================================================= */
function openAddAssessmentModal() {
  const modal = document.getElementById("addAssessmentModal");
  const form = document.getElementById("addAssessmentForm");

  if (!modal || !form) return;

  hideMessage("addAssessmentFormMessage");
  form.reset();

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAddAssessmentModal() {
  const modal = document.getElementById("addAssessmentModal");
  const form = document.getElementById("addAssessmentForm");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (form) form.reset();
  hideMessage("addAssessmentFormMessage");
}

function closeEditAssessmentModal() {
  const modal = document.getElementById("editAssessmentModal");
  const form = document.getElementById("editAssessmentForm");
  const loading = document.getElementById("editAssessmentLoading");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (form) {
    form.classList.add("hidden");
    delete form.dataset.assessmentId;
  }
  if (loading) loading.classList.add("hidden");
  hideMessage("editAssessmentFormMessage");
}

/* =========================================================
UPDATE COUNT
========================================================= */
function updateAssessmentCount() {
  const totalAssessments = document.getElementById("totalAssessments");
  if (!totalAssessments) return;
  totalAssessments.textContent = allAssessments.length;
}

/* =========================================================
EVENT LISTENERS
========================================================= */
function setupEvents() {
  document.getElementById("applyFiltersBtn")?.addEventListener("click", loadAssessments);
  document.getElementById("clearFiltersBtn")?.addEventListener("click", () => {
    document.getElementById("filterStudent").value = "";
    document.getElementById("filterSession").value = "";
    document.getElementById("filterTerm").value = "";
    loadAssessments();
  });

  document.getElementById("addNewAssessmentBtn")?.addEventListener("click", openAddAssessmentModal);
  document.getElementById("closeAddAssessmentModal")?.addEventListener("click", closeAddAssessmentModal);
  document.getElementById("cancelAddAssessmentBtn")?.addEventListener("click", closeAddAssessmentModal);
  document.getElementById("addAssessmentModalOverlay")?.addEventListener("click", closeAddAssessmentModal);

  document.getElementById("addAssessmentForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createAssessment();
  });

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-assessment-btn");
    if (!editButton) return;
    const assessmentId = editButton.dataset.id;
    if (!assessmentId) return;
    openEditAssessmentModal(assessmentId);
  });

  document.getElementById("editAssessmentForm")?.addEventListener("submit", updateAssessment);

  document.getElementById("closeEditAssessmentModal")?.addEventListener("click", closeEditAssessmentModal);
  document.getElementById("cancelEditAssessmentBtn")?.addEventListener("click", closeEditAssessmentModal);
  document.getElementById("editAssessmentModalOverlay")?.addEventListener("click", closeEditAssessmentModal);

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-assessment-btn");
    if (!deleteButton) return;
    const assessmentId = deleteButton.dataset.id;
    const studentName = deleteButton.dataset.student;
    if (!assessmentId) return;
    deleteAssessment(assessmentId, studentName);
  });
}

/* =========================================================
HTML ESCAPE
========================================================= */
function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
INITIALIZE
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  setupEvents();
  await loadCurrentSessionDisplay();
  await loadCurrentTermDisplay();
  await loadInitialData();
  await loadAssessments();
});