const reportCardTemplate = (report) => {
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

th,
td{
    border:1px solid #000;
    padding:8px;
    text-align:left;
}

.summary{
    margin-top:20px;
}
</style>

</head>

<body>

<h1>STUDENT REPORT CARD</h1>

<p><strong>Name:</strong> ${report.student.fullname}</p>

<p><strong>Admission No:</strong> ${report.student.admissionNumber}</p>

<p><strong>Class:</strong> ${report.student.class}</p>

<p><strong>Session:</strong> ${report.session.sessionName}</p>

<p><strong>Term:</strong> ${report.term.termName}</p>

<div class="summary">
<p><strong>Average:</strong> ${report.summary.average}</p>

<p><strong>Grade:</strong> ${report.summary.overallGrade}</p>

<p><strong>Position:</strong> ${report.summary.positionDisplay}</p>
</div>

<table>

<thead>

<tr>
<th>Subject</th>
<th>Test 1</th>
<th>Test 2</th>
<th>Exam</th>
<th>Total</th>
<th>Grade</th>
<th>Remark</th>
</tr>

</thead>

<tbody>

${report.results
  .map(
    (result) => `
<tr>
<td>${result.subject.subjectName}</td>
<td>${result.test1}</td>
<td>${result.test2}</td>
<td>${result.exam}</td>
<td>${result.total}</td>
<td>${result.grade}</td>
<td>${result.remark}</td>
</tr>
`,
  )
  .join("")}

</tbody>

</table>

</body>

</html>
`;
};

module.exports = reportCardTemplate;