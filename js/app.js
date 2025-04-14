// DOM Elements
const flashcard = document.querySelector('.flashcard');
const wordTitle = document.getElementById('wordTitle');
const pronunciation = document.getElementById('pronunciation');
const meaning = document.getElementById('meaning');
const example = document.getElementById('example');
const playPronunciationBtn = document.getElementById('playPronunciation');
const wrongBtn = document.getElementById('wrongBtn');
const correctBtn = document.getElementById('correctBtn');
const flipBtn = document.getElementById('flipBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statsBtn = document.getElementById('statsBtn');
const helpBtn = document.getElementById('helpBtn');
const settingsModal = document.getElementById('settingsModal');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const darkModeToggle = document.getElementById('darkModeToggle');
const resetBtn = document.getElementById('resetBtn');

let currentWord = null;

// تنظیمات
const settings = {
    fontSize: 16,
    darkMode: false,
    dailyLimit: 20  // تعداد سوال روزانه
};

// شاخص‌های نمایش کلمات در هر جعبه
const boxIndices = {
    box1: 0,
    box2: 0,
    box3: 0,
    box4: 0,
    box5: 0
};

// شمارنده تعداد سوالات روزانه
let dailyQuestionCount = 0;
let lastReviewDate = new Date().toDateString();

// آمار کاربر
const stats = {
    totalReviewed: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    dailyStats: {},
    lastReviewDate: null
};

// بازیابی تنظیمات
function loadSettings() {
    const savedSettings = localStorage.getItem('leitnerSettings');
    if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings));
        applySettings();
    }
    
    // بازیابی شاخص‌های جعبه‌ها
    const savedIndices = localStorage.getItem('boxIndices');
    if (savedIndices) {
        Object.assign(boxIndices, JSON.parse(savedIndices));
    } else {
        // ریست کردن شاخص‌ها
        Object.keys(boxIndices).forEach(box => boxIndices[box] = 0);
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
    }
    
    // بازیابی شمارنده روزانه
    const savedCount = localStorage.getItem('dailyQuestionCount');
    const savedDate = localStorage.getItem('lastReviewDate');
    
    if (savedDate === new Date().toDateString()) {
        dailyQuestionCount = parseInt(savedCount) || 0;
    } else {
        // ریست کردن شاخص‌ها و شمارنده در روز جدید
        dailyQuestionCount = 0;
        Object.keys(boxIndices).forEach(box => boxIndices[box] = 0);
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
        localStorage.setItem('lastReviewDate', new Date().toDateString());
        localStorage.setItem('dailyQuestionCount', '0');
    }
}

// اعمال تنظیمات
function applySettings() {
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
    document.body.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    fontSizeSlider.value = settings.fontSize;
    darkModeToggle.checked = settings.darkMode;
}

// ذخیره تنظیمات
function saveSettings() {
    localStorage.setItem('leitnerSettings', JSON.stringify(settings));
}

// ذخیره وضعیت
function saveState() {
    localStorage.setItem('boxes', JSON.stringify(window.boxes));
    localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
}

// نمایش وضعیت جعبه‌ها
function showBoxStatus() {
    Swal.fire({
        title: 'وضعیت جعبه‌ها',
        html: `
            <div dir="rtl">
                <p>جعبه ۱ (روزانه): ${window.boxes.box1.length} لغت</p>
                <p>جعبه ۲ (هر ۲ روز): ${window.boxes.box2.length} لغت</p>
                <p>جعبه ۳ (هر ۴ روز): ${window.boxes.box3.length} لغت</p>
                <p>جعبه ۴ (هر ۷ روز): ${window.boxes.box4.length} لغت</p>
                <p>جعبه ۵ (هر ۱۵ روز): ${window.boxes.box5.length} لغت</p>
                <hr>
                <p>تعداد سوالات امروز: ${dailyQuestionCount} از ${settings.dailyLimit}</p>
            </div>
        `,
        confirmButtonText: 'بستن'
    });
}

// نمایش کارت جدید
function showNewCard() {
    // بررسی محدودیت روزانه
    if (dailyQuestionCount >= settings.dailyLimit) {
        Swal.fire({
            title: 'پایان مرور روزانه',
            text: `شما به سقف تعداد سوالات روزانه (${settings.dailyLimit} سوال) رسیده‌اید. فردا دوباره تلاش کنید.`,
            icon: 'info',
            confirmButtonText: 'باشه'
        });
        return;
    }

    const today = new Date();
    
    // انتخاب کارت مناسب برای مرور به صورت ترتیبی
    let selectedWord = null;
    let selectedBox = null;

    // بررسی جعبه‌ها به ترتیب
    if (window.boxes.box1.length > 0 && boxIndices.box1 < window.boxes.box1.length) {
        selectedWord = window.boxes.box1[boxIndices.box1];
        selectedBox = 'box1';
        boxIndices.box1++;
    } else if (window.boxes.box2.length > 0 && today.getDate() % 2 === 0 && boxIndices.box2 < window.boxes.box2.length) {
        selectedWord = window.boxes.box2[boxIndices.box2];
        selectedBox = 'box2';
        boxIndices.box2++;
    } else if (window.boxes.box3.length > 0 && today.getDate() % 4 === 0 && boxIndices.box3 < window.boxes.box3.length) {
        selectedWord = window.boxes.box3[boxIndices.box3];
        selectedBox = 'box3';
        boxIndices.box3++;
    } else if (window.boxes.box4.length > 0 && today.getDate() % 7 === 0 && boxIndices.box4 < window.boxes.box4.length) {
        selectedWord = window.boxes.box4[boxIndices.box4];
        selectedBox = 'box4';
        boxIndices.box4++;
    } else if (window.boxes.box5.length > 0 && today.getDate() % 15 === 0 && boxIndices.box5 < window.boxes.box5.length) {
        selectedWord = window.boxes.box5[boxIndices.box5];
        selectedBox = 'box5';
        boxIndices.box5++;
    }

    // ریست کردن شاخص‌ها اگر به انتهای همه جعبه‌ها رسیدیم
    if (!selectedWord) {
        Object.keys(boxIndices).forEach(box => boxIndices[box] = 0);
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
        
        // تلاش مجدد برای نمایش کارت از ابتدا
        if (window.boxes.box1.length > 0) {
            selectedWord = window.boxes.box1[0];
            selectedBox = 'box1';
            boxIndices.box1 = 1;
        }
    }

    if (selectedWord) {
        currentWord = { ...selectedWord, currentBox: selectedBox };
        displayWord(currentWord);
        dailyQuestionCount++;
        localStorage.setItem('dailyQuestionCount', dailyQuestionCount.toString());
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
    } else {
        Swal.fire({
            title: 'تبریک!',
            text: 'شما همه کلمات امروز را مرور کرده‌اید.',
            icon: 'success',
            confirmButtonText: 'باشه'
        });
    }
}

// پخش تلفظ کلمه
function playPronunciation(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // سرعت آهسته‌تر برای وضوح بیشتر
    utterance.lang = 'en-US'; // تنظیم زبان به انگلیسی آمریکایی
    
    // پیدا کردن صدای آمریکایی مناسب
    const voices = speechSynthesis.getVoices();
    const americanVoice = voices.find(voice => 
        voice.lang.includes('en-US') && 
        voice.name.includes('Female') // ترجیحا صدای زن
    );
    
    if (americanVoice) {
        utterance.voice = americanVoice;
    }

    // تغییر آیکون به حالت در حال پخش
    const soundButton = document.getElementById('playPronunciation');
    let icon = soundButton.querySelector('i');
    
    // اگر المان آیکون وجود نداشت، آن را ایجاد کن
    if (!icon) {
        icon = document.createElement('i');
        icon.className = 'fas fa-volume-up';
        soundButton.innerHTML = '';
        soundButton.appendChild(icon);
    }

    // تغییر آیکون به حالت در حال پخش
    icon.className = 'fas fa-spinner fa-spin';
    soundButton.disabled = true;

    // بعد از اتمام پخش
    utterance.onend = () => {
        icon.className = 'fas fa-volume-up';
        soundButton.disabled = false;
    };

    // در صورت خطا
    utterance.onerror = () => {
        icon.className = 'fas fa-volume-up';
        soundButton.disabled = false;
        console.error('Error playing pronunciation');
    };

    speechSynthesis.speak(utterance);
}

// اطمینان از بارگذاری صداها
speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices();
    console.log('Available voices:', voices.filter(v => v.lang.includes('en')));
};

// نمایش کلمه روی کارت
function displayWord(word) {
    if (!word) return;
    
    wordTitle.textContent = word.word;
    pronunciation.textContent = word.pronunciation;
    meaning.textContent = word.meaning;
    example.textContent = word.example;
    document.getElementById('synonyms').textContent = word.synonyms.join('، ');
    
    // تنظیم عملکرد دکمه صدا
    playPronunciationBtn.onclick = () => playPronunciation(word.word);
    
    flashcard.classList.remove('flipped');
}

// جابجایی کارت بین جعبه‌ها
function moveCard(correct) {
    if (!currentWord) return;

    const currentBox = parseInt(currentWord.currentBox.replace('box', ''));
    let newBox;

    if (correct) {
        newBox = Math.min(currentBox + 1, 5);
    } else {
        newBox = 1;
    }

    // به‌روزرسانی آمار
    updateDailyStats(correct);

    // حذف از جعبه فعلی
    window.boxes[currentWord.currentBox] = window.boxes[currentWord.currentBox].filter(
        word => word.word !== currentWord.word
    );

    // اضافه به جعبه جدید
    window.boxes[`box${newBox}`].push({
        id: currentWord.id,
        word: currentWord.word,
        pronunciation: currentWord.pronunciation,
        meaning: currentWord.meaning,
        example: currentWord.example,
        synonyms: currentWord.synonyms,
        difficulty: currentWord.difficulty,
        audioUrl: currentWord.audioUrl
    });

    saveState();
    showNewCard();
}

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
    } else {
        // مقداردهی اولیه آمار
        stats.totalReviewed = 0;
        stats.correctAnswers = 0;
        stats.wrongAnswers = 0;
        stats.dailyStats = {};
        stats.lastReviewDate = null;
        saveStats();
    }
    
    // پاکسازی آمار قدیمی
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

// به‌روزرسانی آمار روزانه
function updateDailyStats(isCorrect) {
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = {
            reviewed: 0,
            correct: 0,
            wrong: 0
        };
    }
    
    stats.totalReviewed++;
    stats.dailyStats[today].reviewed++;
    
    if (isCorrect) {
        stats.correctAnswers++;
        stats.dailyStats[today].correct++;
    } else {
        stats.wrongAnswers++;
        stats.dailyStats[today].wrong++;
    }
    
    // حذف آمار قدیمی‌تر از 30 روز
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    Object.keys(stats.dailyStats).forEach(date => {
        if (date < cutoffDate) {
            delete stats.dailyStats[date];
        }
    });
    
    saveStats();
}

// نمایش آمار
function showStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.dailyStats[today] || { reviewed: 0, correct: 0, wrong: 0 };
    const accuracy = stats.totalReviewed > 0 ? Math.round((stats.correctAnswers / stats.totalReviewed) * 100) : 0;
    
    // ایجاد نمودار پیشرفت
    const chartData = Object.entries(stats.dailyStats)
        .slice(-7) // 7 روز آخر
        .map(([date, data]) => ({
            date: new Date(date).toLocaleDateString('fa-IR'),
            correct: data.correct,
            wrong: data.wrong
        }));
    
    Swal.fire({
        title: 'آمار عملکرد شما',
        html: `
            <div dir="rtl" class="stats-container">
                <div class="stats-row">
                    <h3>آمار کلی:</h3>
                    <p>کل لغات مرور شده: ${stats.totalReviewed}</p>
                    <p>پاسخ‌های درست: ${stats.correctAnswers}</p>
                    <p>پاسخ‌های نادرست: ${stats.wrongAnswers}</p>
                    <p>درصد موفقیت: ${accuracy}%</p>
                </div>
                <div class="stats-row">
                    <h3>آمار امروز:</h3>
                    <p>لغات مرور شده: ${todayStats.reviewed}</p>
                    <p>پاسخ‌های درست: ${todayStats.correct}</p>
                    <p>پاسخ‌های نادرست: ${todayStats.wrong}</p>
                </div>
                <div class="stats-row">
                    <h3>نمودار 7 روز اخیر:</h3>
                    <div id="statsChart"></div>
                </div>
            </div>
        `,
        didRender: () => {
            // رسم نمودار با Chart.js
            const ctx = document.createElement('canvas');
            document.getElementById('statsChart').appendChild(ctx);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.map(d => d.date),
                    datasets: [
                        {
                            label: 'پاسخ‌های درست',
                            data: chartData.map(d => d.correct),
                            backgroundColor: '#4CAF50'
                        },
                        {
                            label: 'پاسخ‌های نادرست',
                            data: chartData.map(d => d.wrong),
                            backgroundColor: '#f44336'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        width: '600px'
    });
}

// نمایش راهنما
function showHelp() {
    Swal.fire({
        title: 'راهنمای استفاده',
        html: `
            <div dir="rtl">
                <h3>سیستم لایتنر چیست؟</h3>
                <p>سیستم لایتنر یک روش مؤثر برای یادگیری لغات است که بر اساس تکرار در فواصل زمانی مشخص کار می‌کند.</p>
                
                <h3>نحوه استفاده:</h3>
                <ul>
                    <li>کارت را مطالعه کنید</li>
                    <li>روی کارت کلیک کنید تا برگردد</li>
                    <li>اگر پاسخ را می‌دانستید، دکمه "درست" را بزنید</li>
                    <li>اگر پاسخ را نمی‌دانستید، دکمه "نادرست" را بزنید</li>
                </ul>

                <h3>جعبه‌های لایتنر:</h3>
                <ul>
                    <li>جعبه ۱: مرور روزانه</li>
                    <li>جعبه ۲: مرور هر ۲ روز</li>
                    <li>جعبه ۳: مرور هر ۴ روز</li>
                    <li>جعبه ۴: مرور هر ۷ روز</li>
                    <li>جعبه ۵: مرور هر ۱۵ روز</li>
                </ul>
            </div>
        `,
        confirmButtonText: 'متوجه شدم'
    });
}

// Event Listeners
flashcard.addEventListener('click', (e) => {
    // اگر روی دکمه صدا کلیک شده، از چرخش جلوگیری کن
    if (e.target.closest('#playPronunciation')) return;
    flashcard.classList.toggle('flipped');
});

wrongBtn.addEventListener('click', () => moveCard(false));
correctBtn.addEventListener('click', () => moveCard(true));

// نمایش مودال تنظیمات
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

// بستن مودال با کلیک خارج از آن
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// تایید ریست کردن برنامه
function confirmReset() {
    Swal.fire({
        title: 'آیا مطمئن هستید؟',
        text: 'تمام پیشرفت شما از بین خواهد رفت!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'بله، پاک شود',
        cancelButtonText: 'انصراف'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            window.location.reload();
        }
    });
}

// دکمه ریست
document.getElementById('resetBtn').addEventListener('click', confirmReset);

// دکمه آمار
statsBtn.addEventListener('click', showStats);

// تغییر اندازه فونت
document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
    settings.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeValue').textContent = `${settings.fontSize}px`;
    applySettings();
    saveSettings();
});

// تغییر حالت تاریک/روشن
document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    settings.darkMode = e.target.checked;
    applySettings();
    saveSettings();
});

// تغییر تعداد سوال روزانه
document.getElementById('dailyLimitInput').addEventListener('change', (e) => {
    settings.dailyLimit = parseInt(e.target.value);
    saveSettings();
});

// نمایش وضعیت جعبه‌ها
document.getElementById('showBoxStatusBtn').addEventListener('click', showBoxStatus);

helpBtn.addEventListener('click', showHelp);

// اضافه کردن Chart.js به صفحه
function loadChartJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
}

// Initialize
loadSettings();
loadStats();
loadChartJS();
showNewCard(); 