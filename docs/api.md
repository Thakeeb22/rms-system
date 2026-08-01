Result Management System (RMS) API Endpoints
Base URL
http://localhost:5000/api
Authentication
Method Endpoint Description
POST /auth/login Login
PATCH /admin/change-password Change logged-in user's password
Dashboard
Method Endpoint Description
GET /dashboard/summary Dashboard summary statistics
GET /dashboard/recent-activities Latest students, teachers and results
Teachers
Method Endpoint Description
POST /admin/teachers Create teacher
GET /admin/teachers Get all teachers
GET /admin/teachers/:id Get teacher by ID
PUT /admin/teachers/:id Update teacher
PATCH /admin/teachers/:id/deactivate Deactivate teacher
PATCH /admin/teachers/:id/activate Activate teacher
PATCH /admin/teachers/:id/reset-password Reset teacher password
Classes
Method Endpoint Description
POST /admin/classes Create class
GET /admin/classes Get all classes
GET /admin/classes/:id Get class by ID
PUT /admin/classes/:id Update class
Subjects
Method Endpoint Description
POST /admin/subjects Create subject
GET /admin/subjects Get all subjects
GET /admin/subjects/:id Get subject by ID
PUT /admin/subjects/:id Update subject
Sessions
Method Endpoint Description
POST /admin/sessions Create session
GET /admin/sessions Get all sessions
GET /admin/sessions/:id Get session by ID
PUT /admin/sessions/:id Update session
PATCH /admin/sessions/:id/set-current Set current session
Terms
Method Endpoint Description
POST /admin/terms Create term
GET /admin/terms Get all terms
GET /admin/terms/:id Get term by ID
PUT /admin/terms/:id Update term
PATCH /admin/terms/:id/set-current Set current term
Class Subjects
Method Endpoint Description
POST /admin/class-subjects Assign subject to class
GET /admin/class-subjects Get all class-subject assignments
GET /admin/class-subjects/:id Get assignment by ID
DELETE /admin/class-subjects/:id Delete assignment
Students
Method Endpoint Description
POST /admin/students Create student
GET /admin/students Get all students
GET /admin/students/:id Get student by ID
PUT /admin/students/:id Update student
PATCH /admin/students/:id/graduate Graduate student
PATCH /admin/students/:id/transfer Transfer student
PATCH /admin/students/:id/deactivate Deactivate student
PATCH /admin/students/:id/activate Activate student
Results
Method Endpoint Description
POST /admin/results Create result
GET /admin/results Get all results
GET /admin/results/:id Get result by ID
PUT /admin/results/:id Update result
DELETE /admin/results/:id Delete result
PATCH /admin/results/publish Publish results
PATCH /admin/results/unpublish Unpublish results
Student Assessments
Method Endpoint Description
POST /admin/student-assessments Create assessment
GET /admin/assessments Get all assessments
GET /admin/assessments/:id Get assessment by ID
PUT /admin/assessments/:id Update assessment
DELETE /admin/assessments/:id Delete assessment
Student Report
JSON Report
Method Endpoint Description
GET /admin/report-card Generate student report (JSON)

Query Parameters

studentId
sessionId
termId

Example

GET /api/admin/report-card?studentId=...&sessionId=...&termId=...
Student Report PDF
Method Endpoint Description
GET /pdf/student-report Generate report card PDF

Query Parameters

studentId
sessionId
termId

Example

GET /api/pdf/student-report?studentId=...&sessionId=...&termId=...
Annual Report
JSON Annual Report
Method Endpoint Description
GET /annual-report Generate annual report (JSON)

Query Parameters

studentId
sessionId

Example

GET /api/annual-report?studentId=...&sessionId=...
Annual Report PDF
Method Endpoint Description
GET /annual-report/pdf Generate annual report PDF

Query Parameters

studentId
sessionId

Example

GET /api/annual-report/pdf?studentId=...&sessionId=...
Root Endpoint
Method Endpoint Description
GET / API health check

Returns

{
"success": true,
"message": "Result Management System api is running"
}
Project Statistics
Total Route Files: 5
Authentication Endpoints: 2
Dashboard Endpoints: 2
Teacher Endpoints: 7
Class Endpoints: 4
Subject Endpoints: 4
Session Endpoints: 5
Term Endpoints: 5
Class Subject Endpoints: 4
Student Endpoints: 8
Result Endpoints: 7
Student Assessment Endpoints: 5
Student Report Endpoints: 2
Annual Report Endpoints: 2

Total API Endpoints: 57
