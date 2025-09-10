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
 * UPDATED FUNCTION: Fetches and sorts student details from Firestore.
 * - Assumes the Roll Number is the Document ID.
 * - Checks for 'department' or 'dept' as the field name.
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
            // ==== CODE UPDATED HERE ====
            // 1. Create a new array, mapping the document ID to a property (e.g., 'roll_number')
            const studentList = querySnapshot.docs.map(doc => ({
                roll_number: doc.id, // Use the document ID as the roll number
                ...doc.data()        // Include the rest of the data from the document
            }));
            
            // 2. Sort the array by the new 'roll_number' property
            studentList.sort((a, b) => {
                return (a.roll_number || "").localeCompare(b.roll_number || "");
            });
            
            // 3. Build the HTML from the sorted list
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