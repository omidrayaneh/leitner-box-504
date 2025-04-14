// آمار کاربر
const stats = {
    totalReviewed: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    dailyStats: {},
    lastReviewDate: null
};

// بارگیری آمار
function loadStats() {
    const savedStats = localStorage.getItem('leitnerStats');
    if (savedStats) {
        const loadedStats = JSON.parse(savedStats);
        stats.totalReviewed = loadedStats.totalReviewed || 0;
        stats.correctAnswers = loadedStats.correctAnswers || 0;
        stats.wrongAnswers = loadedStats.wrongAnswers || 0;
        stats.dailyStats = loadedStats.dailyStats || {};
        stats.lastReviewDate = loadedStats.lastReviewDate;
    }
    
    // پاکسازی آمار قدیمی
    cleanOldStats();
    updateStatsDisplay();
}

// پاکسازی آمار قدیمی‌تر از 30 روز
function cleanOldStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    if (stats.dailyStats) {
        Object.keys(stats.dailyStats).forEach(date => {
            if (date < cutoffDate) {
                delete stats.dailyStats[date];
            }
        });
        saveStats();
    }
}

// ذخیره آمار
function saveStats() {
    localStorage.setItem('leitnerStats', JSON.stringify(stats));
}

// به‌روزرسانی نمایش آمار
function updateStatsDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.dailyStats[today] || { reviewed: 0, correct: 0, wrong: 0 };
    const accuracy = stats.totalReviewed > 0 ? Math.round((stats.correctAnswers / stats.totalReviewed) * 100) : 0;

    // به‌روزرسانی آمار کلی
    document.getElementById('totalReviewed').textContent = stats.totalReviewed;
    document.getElementById('totalCorrect').textContent = stats.correctAnswers;
    document.getElementById('totalWrong').textContent = stats.wrongAnswers;
    document.getElementById('totalAccuracy').textContent = `${accuracy}%`;

    // به‌روزرسانی آمار امروز
    document.getElementById('todayReviewed').textContent = todayStats.reviewed;
    document.getElementById('todayCorrect').textContent = todayStats.correct;
    document.getElementById('todayWrong').textContent = todayStats.wrong;

    // به‌روزرسانی نمودار
    updateChart();
}

// به‌روزرسانی نمودار
function updateChart() {
    // بررسی وجود Chart.js
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }

    const chartData = Object.entries(stats.dailyStats)
        .slice(-7) // 7 روز آخر
        .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('fa-IR'),
            correct: data.correct || 0,
            wrong: data.wrong || 0
        }));

    const ctx = document.getElementById('statsChart').getContext('2d');
    
    try {
        // اگر نمودار قبلی وجود دارد، آن را نابود کن
        if (window.statsChart && typeof window.statsChart.destroy === 'function') {
            window.statsChart.destroy();
        }

        window.statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [
                    {
                        label: 'پاسخ‌های درست',
                        data: chartData.map(d => d.correct),
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: 'rgb(40, 167, 69)',
                        borderWidth: 1
                    },
                    {
                        label: 'پاسخ‌های نادرست',
                        data: chartData.map(d => d.wrong),
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        borderColor: 'rgb(220, 53, 69)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'آمار 7 روز اخیر',
                        font: {
                            family: 'Vazirmatn',
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

// نمایش جزئیات روز
function showDayDetails(date) {
    const stats = window.stats.dailyStats[date] || { reviewed: 0, correct: 0, wrong: 0 };
    const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;

    Swal.fire({
        title: `آمار ${new Date(date).toLocaleDateString('fa-IR')}`,
        html: `
            <div dir="rtl">
                <p>تعداد کل مرور: ${stats.reviewed}</p>
                <p>پاسخ‌های درست: ${stats.correct}</p>
                <p>پاسخ‌های نادرست: ${stats.wrong}</p>
                <p>درصد موفقیت: ${accuracy}%</p>
            </div>
        `,
        confirmButtonText: 'بستن'
    });
}

// ایجاد تقویم حرارتی
function createHeatmap() {
    const heatmapContainer = document.getElementById('heatmap');
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const date = d.toISOString().split('T')[0];
        const dayStats = stats.dailyStats[date] || { reviewed: 0 };
        
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.title = `${new Date(date).toLocaleDateString('fa-IR')}: ${dayStats.reviewed} مرور`;
        
        // تعیین رنگ بر اساس تعداد مرور
        let intensity = dayStats.reviewed / 20; // فرض می‌کنیم حداکثر 20 مرور در روز
        intensity = Math.min(intensity, 1);
        cell.style.backgroundColor = `rgba(33, 150, 243, ${intensity})`;
        
        cell.addEventListener('click', () => showDayDetails(date));
        heatmapContainer.appendChild(cell);
    }
}

// اجرای اولیه
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    createHeatmap();
}); 