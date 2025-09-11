// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA4LJgQ7oxHk-LHNvJrnReWOP9c-WIAlDQ",
    authDomain: "sih-eca-2025.firebaseapp.com",
    projectId: "sih-eca-2025",
    storageBucket: "sih-eca-2025.appspot.com",
    messagingSenderId: "1083963361758",
    appId: "1:1083963361758:web:65841e1b6e66097e62f54f",
    measurementId: "G-GLKPFGLGC9"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables to hold chart instances
let attendanceBarChart = null;
let attendancePieChart = null;

// Flags to prevent re-fetching data from Firestore unnecessarily
let facultyDataLoaded = false;
let studentsDataLoaded = false;
let timetableDataLoaded = false; // <-- NEW FLAG ADDED


/**
 * Fetches subject-wise attendance for a given date and renders a bar chart.
 * @param {string} dateString - The date in 'YYYY-MM-DD' format.
 */
async function loadAttendance(dateString) {
    try {
        const snapshot = await getDocs(collection(db, `attendance/${dateString}/students`));
        const students = snapshot.docs.map(doc => doc.data());

        const subjects = ["MCC", "MCC_1", "MPMC", "CLOUD", "CLOUD_1", "ADHOC", "ME"];
        const counts = {};
        subjects.forEach(subj => counts[subj] = { present: 0, total: 0 });

        students.forEach(stu => {
            subjects.forEach(subj => {
                if (stu[subj]) {
                    counts[subj].total++;
                    if (stu[subj].startsWith("Present")) {
                        counts[subj].present++;
                    }
                }
            });
        });

        const labels = subjects;
        const data = subjects.map(s =>
            counts[s].total > 0 ? (counts[s].present / counts[s].total) * 100 : 0
        );

        if (attendanceBarChart) {
            attendanceBarChart.destroy();
        }

        const isDarkMode = document.body.classList.contains('dark-theme');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#e0e0e0' : '#333';

        attendanceBarChart = new Chart(document.getElementById("attendanceChart"), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance %',
                    data: data,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: textColor, callback: value => value + "%" },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error loading bar chart data:", error);
        document.getElementById("attendanceChart").parentElement.innerHTML = "<p style='color: red; text-align: center;'>Could not load chart data.</p>";
    }
}

/**
 * Fetches overall day attendance, renders a pie chart, and updates stat cards.
 * @param {string} dateString - The date in 'YYYY-MM-DD' format.
 */
async function loadDailyAttendancePieChart(dateString) {
    try {
        const snapshot = await getDocs(collection(db, `attendance/${dateString}/students`));
        const totalStudents = snapshot.size;
        let presentStudentsCount = 0;

        snapshot.docs.forEach(doc => {
            const studentData = doc.data();
            if (Object.values(studentData).some(status => typeof status === 'string' && status.startsWith("Present"))) {
                presentStudentsCount++;
            }
        });

        const absentStudentsCount = totalStudents - presentStudentsCount;
        const attendancePercentage = totalStudents > 0 ? Math.round((presentStudentsCount / totalStudents) * 100) : 0;
        document.getElementById('overallAttendanceValue').textContent = `${attendancePercentage}%`;
        document.getElementById('defaultersValue').textContent = absentStudentsCount;

        if (attendancePieChart) {
            attendancePieChart.destroy();
        }

        const isDarkMode = document.body.classList.contains('dark-theme');
        const textColor = isDarkMode ? '#e0e0e0' : '#333';

        attendancePieChart = new Chart(document.getElementById("dailyAttendancePieChart"), {
            type: 'pie',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    label: 'Day Attendance',
                    data: [presentStudentsCount, absentStudentsCount],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Total Students: ${totalStudents}`, color: textColor },
                    legend: { labels: { color: textColor } }
                }
            }
        });
    } catch (error) {
        console.error("Error loading pie chart data:", error);
        document.getElementById('overallAttendanceValue').textContent = 'Error';
        document.getElementById('defaultersValue').textContent = 'Error';
        document.getElementById("dailyAttendancePieChart").parentElement.innerHTML = "<p style='color: red; text-align: center;'>Could not load pie chart data.</p>";
    }
}

/**
 * Fetches faculty and subject details from Firestore and populates the table.
 */
async function loadAndDisplayFaculty() {
    const tableBody = document.getElementById('faculty-table-body');
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading faculty data...</td></tr>';
    try {
        const querySnapshot = await getDocs(collection(db, "faculty_sub_details"));
        let tableHTML = '';
        if (querySnapshot.empty) {
            tableHTML = '<tr><td colspan="3" style="text-align:center;">No faculty data found.</td></tr>';
        } else {
            querySnapshot.forEach(doc => {
                const data = doc.data();
                tableHTML += `<tr><td>${data.subject_code || 'N/A'}</td><td>${data.subject_name || 'N/A'}</td><td>${data.faculty_name || 'N/A'}</td></tr>`;
            });
        }
        tableBody.innerHTML = tableHTML;
        facultyDataLoaded = true;
    } catch (error) {
        console.error("Error fetching faculty data:", error);
        tableBody.innerHTML = '<tr><td colspan="3" style="color:red; text-align:center;">Failed to load data.</td></tr>';
    }
}

/**
 * Fetches and sorts student details from Firestore.
 */
async function loadAndDisplayStudents() {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading student data...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        let tableHTML = '';

        if (querySnapshot.empty) {
            tableHTML = '<tr><td colspan="5" style="text-align:center;">No student data found.</td></tr>';
        } else {
            const studentList = querySnapshot.docs.map(doc => ({
                roll_number: doc.id,
                ...doc.data()
            }));
            
            studentList.sort((a, b) => {
                return (a.roll_number || "").localeCompare(b.roll_number || "");
            });
            
            studentList.forEach(data => {
                tableHTML += `
                    <tr>
                        <td>${data.roll_number || 'N/A'}</td>
                        <td>${data.name || 'N/A'}</td>
                        <td>${data.department || data.dept || 'N/A'}</td>
                        <td>${data.section || 'N/A'}</td>
                        <td>${data.year || 'N/A'}</td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = tableHTML;
        studentsDataLoaded = true;
    } catch (error) {
        console.error("Error fetching student data:", error);
        tableBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Failed to load data.</td></tr>';
    }
}

// ====================================================
// ============ NEW TIMETABLE FUNCTION ADDED ==========
// ====================================================
/**
 * Fetches timetable data from Firestore and renders it as an HTML table.
 *//**
 * Fetches timetable data from Firestore and renders it as a grid-style HTML table.
 *//**
 * Fetches timetable data from Firestore and renders it as a grid-style HTML table.
 * VERSION 3: Correctly sorts 12-hour format time in ascending order.
 */
async function loadAndDisplayTimetable() {
    const container = document.getElementById('timetable-container');
    
    try {
        const querySnapshot = await getDocs(collection(db, "ECA_3_A_timetable"));

        if (querySnapshot.empty) {
            container.innerHTML = "<p style='text-align:center; color:orange;'>No timetable data found.</p>";
            return;
        }

        const gridData = {}; 
        const timeSlots = new Set();
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        querySnapshot.forEach(doc => {
            const day = doc.id;
            const periods = doc.data();
            Object.values(periods).forEach(period => {
                const slotKey = `${period.start}-${period.end}`;
                timeSlots.add(slotKey);
                if (!gridData[slotKey]) {
                    gridData[slotKey] = {};
                }
                gridData[slotKey][day] = period.subject_code;
            });
        });
        
        // --- UPDATED SORTING LOGIC ---
        // This new logic correctly sorts times by converting them to a 24-hour format for comparison.
        const sortedTimeSlots = Array.from(timeSlots).sort((a, b) => {
            // Helper function to get a comparable 24-hour value from a time string like "01:25" or "09:20"
            const getComparableTime = (timeString) => {
                let [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
                
                // Heuristic for school timetables: if the hour is before 8 (e.g., 1, 2), it's likely PM.
                if (hours < 8) {
                    hours += 12;
                }
                
                // Convert to a single number for easy comparison (e.g., 09:20 -> 920, 13:25 -> 1325)
                return hours * 100 + minutes;
            };

            const startTimeA = a.split('-')[0];
            const startTimeB = b.split('-')[0];

            return getComparableTime(startTimeA) - getComparableTime(startTimeB);
        });

        let tableHTML = `<table class="timetable-grid-table"><thead><tr><th>Time</th>`;

        dayOrder.forEach(day => {
            tableHTML += `<th>${day}</th>`;
        });
        tableHTML += `</tr></thead><tbody>`;

        sortedTimeSlots.forEach(slot => {
            tableHTML += `<tr><td><b>${slot.replace('-', ' - ')}</b></td>`;
            dayOrder.forEach(day => {
                const subjectCode = gridData[slot]?.[day] || '';
                tableHTML += `<td>${subjectCode}</td>`;
            });
            tableHTML += `</tr>`;
        });

        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;
        timetableDataLoaded = true;

    } catch (error) {
        console.error("Error fetching timetable data:", error);
        container.innerHTML = "<p style='text-align:center; color:red;'>Failed to load timetable.</p>";
    }
}


// ====================================================
// ================ END OF NEW FUNCTION ===============
// ====================================================


// --- Main Event Listener ---
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const datePicker = document.getElementById('attendanceDate');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // --- Theme Toggling Logic ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.textContent = '☀️';
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        let theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
        if (datePicker.value) {
            loadAttendance(datePicker.value);
            loadDailyAttendancePieChart(datePicker.value);
        }
    });

    // --- Initial Data Load ---
    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const todayStr = getTodayDateString();
    datePicker.value = todayStr;
    loadAttendance(todayStr);
    loadDailyAttendancePieChart(todayStr);

    datePicker.addEventListener('change', () => {
        if (datePicker.value) {
            loadAttendance(datePicker.value);
            loadDailyAttendancePieChart(datePicker.value);
        }
    });

    // --- Sidebar Mobile Logic ---
    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
});

/**
 * Shows the selected content section and hides others.
 * Fetches data when a section is selected for the first time.
 */
window.showSection = function(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionName + '-section');
    if (activeSection) {
        activeSection.style.display = 'block';
    } else {
        document.getElementById('dashboard-section').style.display = 'block';
    }

    // Load data if the section is clicked for the first time
    if (sectionName === 'faculty' && !facultyDataLoaded) {
        loadAndDisplayFaculty();
    }
    if (sectionName === 'students' && !studentsDataLoaded) {
        loadAndDisplayStudents();
    }
    // --- UPDATED THIS BLOCK ---
    if (sectionName === 'timetables' && !timetableDataLoaded) {
        loadAndDisplayTimetable();
    }
    // --- END OF UPDATED BLOCK ---
    
    // Close the sidebar on mobile after selection
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

window.logout = function() {
    console.log('User logged out.');
    // Example: window.location.href = '/login/login.html';
}