const annualReportTemplate = (report) => {
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Annual Report - ${escape(report.student.admissionNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      color: #1f2937; 
      line-height: 1.5; 
      padding: 30px; 
    }
    .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 28px; color: #7c3aed; font-weight: 700; }
    .header p { color: #6b7280; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .info-label { font-size: 12px; color: #6b7280; }
    .info-value { font-size: 14px; font-weight: 600; color: #1f2937; }
    .section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 12px; margin-top: 24px; }
    .term-section { margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .term-header { background: #f5f3ff; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
    .term-header h3 { font-size: 16px; font-weight: 700; color: #7c3aed; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; border: 1px solid #e5e7eb; }
    td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px; }
    .term-footer { background: #f9fafb; padding: 10px 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 20px; font-size: 13px; }
    .term-footer span { color: #4b5563; }
    .term-footer strong { color: #1f2937; }
    .summary-box { background: #f5f3ff; padding: 20px; border-radius: 8px; border: 1px solid #ddd6fe; margin-bottom: 24px; }
    .summary-box h2 { font-size: 18px; font-weight: 700; color: #7c3aed; margin-bottom: 16px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .summary-item .label { font-size: 12px; color: #4b5563; }
    .summary-item .value { font-size: 22px; font-weight: 700; color: #7c3aed; }
    .promotion-box { padding: 14px; border-radius: 6px; margin-bottom: 16px; }
    .promotion-box.promoted { background: #dcfce7; border: 1px solid #86efac; }
    .promotion-box.not-promoted { background: #fee2e2; border: 1px solid #fca5a5; }
    .promotion-label { font-size: 12px; margin-bottom: 4px; }
    .promotion-box.promoted .promotion-label { color: #16a34a; }
    .promotion-box.not-promoted .promotion-label { color: #dc2626; }
    .promotion-text { color: #1f2937; font-weight: 500; }
    .remarks { border-top: 2px solid #d1d5db; padding-top: 16px; margin-top: 16px; }
    .remark-item { margin-bottom: 12px; }
    .remark-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .remark-text { color: #1f2937; font-style: italic; }
    .grade-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ANNUAL REPORT CARD</h1>
    <p>Edulog Academy</p>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">Student Name</div>
      <div class="info-value">${escape(report.student.fullname)}</div>
    </div>
    <div>
      <div class="info-label">Admission Number</div>
      <div class="info-value">${escape(report.student.admissionNumber)}</div>
    </div>
    <div>
      <div class="info-label">Class</div>
      <div class="info-value">${escape(report.student.class)}</div>
    </div>
    <div>
      <div class="info-label">Session</div>
      <div class="info-value">${escape(report.session.sessionName)}</div>
    </div>
  </div>

  <h2 class="section-title">Term-by-Term Performance</h2>

  ${report.termReports
    .map(
      (term) => `
    <div class="term-section">
      <div class="term-header">
        <h3>${escape(term.term)}</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th style="text-align: center;">Test 1</th>
            <th style="text-align: center;">Test 2</th>
            <th style="text-align: center;">Exam</th>
            <th style="text-align: center;">Total</th>
            <th style="text-align: center;">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${term.results
            .map(
              (result) => `
            <tr>
              <td>${escape(result.subject.subjectName)}</td>
              <td style="text-align: center;">${result.test1}</td>
              <td style="text-align: center;">${result.test2}</td>
              <td style="text-align: center;">${result.exam}</td>
              <td style="text-align: center; font-weight: 600;">${result.total}</td>
              <td style="text-align: center;">
                <span class="grade-badge" style="background: ${getGradeBg(result.grade)}; color: ${getGradeColor(result.grade)};">
                  ${result.grade}
                </span>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div class="term-footer">
        <span>Total: <strong>${term.grandTotal}</strong></span>
        <span>Average: <strong>${term.average}</strong></span>
        <span>Grade: <strong>${term.grade}</strong></span>
        <span>Remark: <strong>${escape(term.remark)}</strong></span>
      </div>
    </div>
  `
    )
    .join("")}

  <div class="summary-box">
    <h2>Annual Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">Annual Average</div>
        <div class="value">${report.annualSummary.annualAverage}</div>
      </div>
      <div class="summary-item">
        <div class="label">Annual Position</div>
        <div class="value" style="font-size: 18px;">${escape(report.annualSummary.positionDisplay)}</div>
      </div>
      <div class="summary-item">
        <div class="label">Overall Grade</div>
        <div class="value">${report.annualSummary.annualGrade}</div>
      </div>
      <div class="summary-item">
        <div class="label">Total Subjects</div>
        <div class="value">${report.annualSummary.annualSubjects}</div>
      </div>
      <div class="summary-item">
        <div class="label">Terms Completed</div>
        <div class="value">${report.termReports.length}</div>
      </div>
      <div class="summary-item">
        <div class="label">Promotion Status</div>
        <div class="value" style="font-size: 14px;">${escape(report.annualSummary.promotionStatus)}</div>
      </div>
    </div>
  </div>

  <div class="promotion-box ${report.annualSummary.promotionStatus.toLowerCase().includes("promoted") && !report.annualSummary.promotionStatus.toLowerCase().includes("not") ? "promoted" : "not-promoted"}">
    <div class="promotion-label">Promotion Remark</div>
    <div class="promotion-text">${escape(report.annualSummary.promotionStatus)}</div>
  </div>

  <div class="remarks">
    <div class="remark-item">
      <div class="remark-label">Teacher's Remark</div>
      <div class="remark-text">${escape(report.annualSummary.teacherRemark)}</div>
    </div>
    <div class="remark-item">
      <div class="remark-label">Principal's Remark</div>
      <div class="remark-text">${escape(report.annualSummary.principalRemark)}</div>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = annualReportTemplate;