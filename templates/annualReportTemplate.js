const annualReportTemplate = (report) => {
  return `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<style>

body{
    font-family: Arial, sans-serif;
    padding:40px;
}

h1{
    text-align:center;
}

table{
    width:100%;
    border-collapse:collapse;
    margin-top:20px;
}

th,td{
    border:1px solid black;
    padding:8px;
    text-align:left;
}

.term{
    margin-top:30px;
}

.summary{
    margin-top:30px;
}

</style>

</head>

<body>

<h1>ANNUAL REPORT CARD</h1>

<p><strong>Name:</strong> ${report.student.fullname}</p>

<p><strong>Admission No:</strong> ${report.student.admissionNumber}</p>

<p><strong>Class:</strong> ${report.student.class}</p>

<p><strong>Session:</strong> ${report.session.sessionName}</p>

${report.termReports
  .map(
    (term) => `

<div class="term">

<h2>${term.term}</h2>

<p><strong>Average:</strong> ${term.average}</p>

<p><strong>Grade:</strong> ${term.grade}</p>

<table>

<thead>

<tr>

<th>Subject</th>
<th>Test 1</th>
<th>Test 2</th>
<th>Exam</th>
<th>Total</th>
<th>Grade</th>

</tr>

</thead>

<tbody>

${term.results
  .map(
    (result) => `

<tr>

<td>${result.subject.subjectName}</td>

<td>${result.test1}</td>

<td>${result.test2}</td>

<td>${result.exam}</td>

<td>${result.total}</td>

<td>${result.grade}</td>

</tr>

`,
  )
  .join("")}

</tbody>

</table>

</div>

`,
  )
  .join("")}

<hr>

<div class="summary">

<h2>Annual Summary</h2>

<p><strong>Annual Average:</strong> ${report.annualSummary.annualAverage}</p>

<p><strong>Grade:</strong> ${report.annualSummary.annualGrade}</p>

<p><strong>Position:</strong> ${report.annualSummary.positionDisplay}</p>

<p><strong>Promotion:</strong> ${report.annualSummary.promotionStatus}</p>

<p><strong>Teacher's Remark:</strong>
${report.annualSummary.teacherRemark}</p>

<p><strong>Principal's Remark:</strong>
${report.annualSummary.principalRemark}</p>

</div>

</body>

</html>
`;
};

module.exports = annualReportTemplate;
