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

// Variables to hold chart instances so they can be destroyed before redrawing
let attendanceBarChart = null;
let attendancePieChart = null;
// Flag to prevent re-fetching data from Firestore unnecessarily
let facultyDataLoaded = false;

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

        // Define chart colors based on the current theme
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
                        ticks: {
                            color: textColor,
                            callback: value => value + "%"
                        },
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
        const chartArea = document.getElementById("attendanceChart").parentElement;
        chartArea.innerHTML = "<p style='color: red; text-align: center;'>Could not load chart data.</p>";
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
            let isPresentInAnySubject = false;
            for (const subject in studentData) {
                if (typeof studentData[subject] === 'string' && studentData[subject].startsWith("Present")) {
                    isPresentInAnySubject = true;
                    break;
                }
            }
            if (isPresentInAnySubject) {
                presentStudentsCount++;
            }
        });

        const absentStudentsCount = totalStudents - presentStudentsCount;
        
        // --- Update Stat Cards ---
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
                    title: {
                        display: true,
                        text: `Total Students: ${totalStudents}`,
                        color: textColor
                    },
                    legend: {
                        labels: { color: textColor }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error loading pie chart data:", error);
        document.getElementById('overallAttendanceValue').textContent = 'Error';
        document.getElementById('defaultersValue').textContent = 'Error';
        const pieChartArea = document.getElementById("dailyAttendancePieChart").parentElement;
        pieChartArea.innerHTML = "<p style='color: red; text-align: center;'>Could not load pie chart data.</p>";
    }
}

/**
 * NEW FUNCTION: Fetches faculty and subject details from Firestore and populates the table.
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
                tableHTML += `
                    <tr>
                        <td>${data.subject_code || 'N/A'}</td>
                        <td>${data.subject_name || 'N/A'}</td>
                        <td>${data.faculty_name || 'N/A'}</td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = tableHTML;
        facultyDataLoaded = true; // Mark data as loaded
    } catch (error) {
        console.error("Error fetching faculty data:", error);
        tableBody.innerHTML = '<tr><td colspan="3" style="color:red; text-align:center;">Failed to load data.</td></tr>';
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
        themeToggleBtn.textContent = '☀️'; // Sun icon
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        let theme = 'light';
        if (document.body.classList.contains('dark-theme')) {
            theme = 'dark';
            themeToggleBtn.textContent = '☀️';
        } else {
            themeToggleBtn.textContent = '🌙';
        }
        localStorage.setItem('theme', theme);
        // Re-render charts with updated theme colors
        const selectedDate = datePicker.value;
        if (selectedDate) {
            loadAttendance(selectedDate);
            loadDailyAttendancePieChart(selectedDate);
        }
    });

    // --- Initial Data Load ---
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getTodayDateString();
    datePicker.value = todayStr;

    // Load dashboard data by default
    loadAttendance(todayStr);
    loadDailyAttendancePieChart(todayStr);

    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        if (selectedDate) {
            loadAttendance(selectedDate);
            loadDailyAttendancePieChart(selectedDate);
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
 * UPDATED FUNCTION: Shows the selected content section and hides others.
 * Fetches faculty data when the faculty section is selected for the first time.
 */
window.showSection = function(sectionName) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the requested section
    const activeSection = document.getElementById(sectionName + '-section');
    if (activeSection) {
        activeSection.style.display = 'block';
    } else {
        // Fallback to dashboard if section not found
        document.getElementById('dashboard-section').style.display = 'block';
    }

    // If the faculty tab is clicked and data hasn't been loaded yet, fetch it
    if (sectionName === 'faculty' && !facultyDataLoaded) {
        loadAndDisplayFaculty();
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
    // Example: Redirect to a login page
    // window.location.href = '/login/login.html';
}