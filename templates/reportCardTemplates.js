const reportCardTemplate = (report) => {
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: "#16a34a",
      B: "#2563eb",
      C: "#ca8a04",
      D: "#ea580c",
      E: "#dc2626",
      F: "#991b1b",
    };
    return colors[grade] || "#4b5563";
  };

  const getGradeBg = (grade) => {
    const colors = {
      A: "#dcfce7",
      B: "#dbeafe",
      C: "#fef9c3",
      D: "#ffedd5",
      E: "#fee2e2",
      F: "#fecaca",
    };
    return colors[grade] || "#f3f4f6";
  };

  const affectiveRows = report.assessment?.affective
    ? Object.entries(report.assessment.affective)
        .map(
          ([key, value]) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-transform: capitalize;">${escape(key)}</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #2563eb;">${value}/5</td>
        </tr>
      `
        )
        .join("")
    : "";

  const psychomotorRows = report.assessment?.psychomotor
    ? Object.entries(report.assessment.psychomotor)
        .map(
          ([key, value]) => `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-transform: capitalize;">${escape(key.replace(/([A-Z])/g, " $1").trim())}</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #2563eb;">${value}/5</td>
        </tr>
      `
        )
        .join("")
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report Card - ${escape(report.student.admissionNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      color: #1f2937; 
      line-height: 1.5; 
      padding: 30px; 
    }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 28px; color: #2563eb; font-weight: 700; }
    .header p { color: #6b7280; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .info-item { }
    .info-label { font-size: 12px; color: #6b7280; }
    .info-value { font-size: 14px; font-weight: 600; color: #1f2937; }
    .section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 12px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #eff6ff; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; border: 1px solid #e5e7eb; }
    td { padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 13px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .summary-item .label { font-size: 12px; color: #4b5563; }
    .summary-item .value { font-size: 22px; font-weight: 700; color: #2563eb; }
    .grade-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .comment-box { padding: 12px; border-radius: 6px; margin-bottom: 8px; }
    .comment-box.teacher { background: #fef9c3; }
    .comment-box.principal { background: #f3e8ff; }
    .comment-label { font-size: 12px; color: #4b5563; margin-bottom: 4px; }
    .comment-text { color: #1f2937; font-style: italic; }
    .remarks { border-top: 2px solid #d1d5db; padding-top: 16px; margin-top: 16px; }
    .remark-item { margin-bottom: 12px; }
    .remark-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .remark-text { color: #1f2937; font-style: italic; }
    .assessment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .attendance-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .attendance-item { padding: 12px; border-radius: 6px; text-align: center; }
    .attendance-item.opened { background: #f3f4f6; }
    .attendance-item.present { background: #dcfce7; }
    .attendance-item.absent { background: #fee2e2; }
    .attendance-label { font-size: 12px; color: #4b5563; }
    .attendance-value { font-size: 20px; font-weight: 700; }
    .attendance-item.present .attendance-value { color: #16a34a; }
    .attendance-item.absent .attendance-value { color: #dc2626; }
    .attendance-item.opened .attendance-value { color: #1f2937; }
  </style>
</head>
<body>
  <div class="header">
    <h1>STUDENT REPORT CARD</h1>
    <p>Edulog Academy</p>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Student Name</div>
      <div class="info-value">${escape(report.student.fullname)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Admission Number</div>
      <div class="info-value">${escape(report.student.admissionNumber)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Class</div>
      <div class="info-value">${escape(report.student.class)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Session</div>
      <div class="info-value">${escape(report.session.sessionName)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Term</div>
      <div class="info-value">${escape(report.term.termName)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Class Teacher</div>
      <div class="info-value">${escape(report.summary.classTeacher)}</div>
    </div>
  </div>

  <h2 class="section-title">Academic Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th style="text-align: center;">Test 1 (20)</th>
        <th style="text-align: center;">Test 2 (20)</th>
        <th style="text-align: center;">Exam (60)</th>
        <th style="text-align: center;">Total</th>
        <th style="text-align: center;">Grade</th>
        <th style="text-align: center;">Remark</th>
      </tr>
    </thead>
    <tbody>
      ${report.results
        .map(
          (result) => `
        <tr>
          <td>${escape(result.subject.subjectName)}</td>
          <td style="text-align: center;">${result.test1}</td>
          <td style="text-align: center;">${result.test2}</td>
          <td style="text-align: center;">${result.exam}</td>
          <td style="text-align: center; font-weight: 700;">${result.total}</td>
          <td style="text-align: center;">
            <span class="grade-badge" style="background: ${getGradeBg(result.grade)}; color: ${getGradeColor(result.grade)};">
              ${result.grade}
            </span>
          </td>
          <td style="text-align: center;">${escape(result.remark)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="summary-grid">
    <div class="summary-item">
      <div class="label">Total Subjects</div>
      <div class="value">${report.summary.totalSubjects}</div>
    </div>
    <div class="summary-item">
      <div class="label">Grand Total</div>
      <div class="value">${report.summary.grandTotal}</div>
    </div>
    <div class="summary-item">
      <div class="label">Average</div>
      <div class="value">${report.summary.average}</div>
    </div>
    <div class="summary-item">
      <div class="label">Position</div>
      <div class="value" style="font-size: 18px;">${escape(report.summary.positionDisplay)}</div>
    </div>
    <div class="summary-item">
      <div class="label">Overall Grade</div>
      <div class="value">${report.summary.overallGrade}</div>
    </div>
    <div class="summary-item">
      <div class="label">Overall Remark</div>
      <div class="value" style="font-size: 16px;">${escape(report.summary.overallRemark)}</div>
    </div>
  </div>

  ${
    report.assessment
      ? `
    <h2 class="section-title">Assessment</h2>

    <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">Attendance</h3>
    <div class="attendance-grid">
      <div class="attendance-item opened">
        <div class="attendance-label">School Opened</div>
        <div class="attendance-value">${report.assessment.attendance?.schoolOpened || 0}</div>
      </div>
      <div class="attendance-item present">
        <div class="attendance-label">Present</div>
        <div class="attendance-value">${report.assessment.attendance?.present || 0}</div>
      </div>
      <div class="attendance-item absent">
        <div class="attendance-label">Absent</div>
        <div class="attendance-value">${report.assessment.attendance?.absent || 0}</div>
      </div>
    </div>

    <div class="assessment-grid">
      <div>
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">Affective Traits</h3>
        <table>
          <thead>
            <tr>
              <th>Trait</th>
              <th style="text-align: center;">Rating</th>
            </tr>
          </thead>
          <tbody>${affectiveRows}</tbody>
        </table>
      </div>
      <div>
        <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">Psychomotor Skills</h3>
        <table>
          <thead>
            <tr>
              <th>Skill</th>
              <th style="text-align: center;">Rating</th>
            </tr>
          </thead>
          <tbody>${psychomotorRows}</tbody>
        </table>
      </div>
    </div>

    ${
      report.assessment.classTeacherComment
        ? `
      <div class="comment-box teacher">
        <div class="comment-label">Class Teacher's Comment</div>
        <div class="comment-text">${escape(report.assessment.classTeacherComment)}</div>
      </div>
    `
        : ""
    }
    ${
      report.assessment.principalComment
        ? `
      <div class="comment-box principal">
        <div class="comment-label">Principal's Comment</div>
        <div class="comment-text">${escape(report.assessment.principalComment)}</div>
      </div>
    `
        : ""
    }
  `
      : ""
  }

  <div class="remarks">
    <div class="remark-item">
      <div class="remark-label">Teacher's Remark</div>
      <div class="remark-text">${escape(report.summary.teacherRemark)}</div>
    </div>
    <div class="remark-item">
      <div class="remark-label">Principal's Remark</div>
      <div class="remark-text">${escape(report.summary.principalRemark)}</div>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = reportCardTemplate;