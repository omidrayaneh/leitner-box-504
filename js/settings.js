// DOM Elements
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const darkModeToggle = document.getElementById('darkModeToggle');
const dailyLimitInput = document.getElementById('dailyLimitInput');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFile = document.getElementById('restoreFile');
const resetBtn = document.getElementById('resetBtn');
const showBoxStatusBtn = document.getElementById('showBoxStatusBtn');
const reviewTimeInput = document.getElementById('reviewTimeInput');
const notificationToggle = document.getElementById('notificationToggle');
const sortTypeSelect = document.getElementById('sortTypeSelect');

// تنظیمات پیش‌فرض SweetAlert2
Swal.defaultParams = {
    confirmButtonText: 'تأیید',
    cancelButtonText: 'انصراف',
    customClass: {
        popup: 'swal2-rtl',
        title: 'swal2-title-rtl',
        htmlContainer: 'swal2-html-rtl',
        confirmButton: 'swal2-confirm-rtl',
        cancelButton: 'swal2-cancel-rtl',
        denyButton: 'swal2-deny-rtl'
    }
};

// Settings keys
const SETTINGS_KEYS = {
    FONT_SIZE: 'fontSize',
    DARK_MODE: 'darkMode',
    DAILY_LIMIT: 'dailyLimit',
    REVIEW_TIME: 'reviewTime',
    NOTIFICATIONS: 'notifications',
    SORT_TYPE: 'sortType'
};

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('leitnerSettings') || '{}');
    
    // اندازه فونت
    const fontSize = settings.fontSize || 16;
    document.documentElement.style.fontSize = `${fontSize}px`;
    fontSizeSlider.value = fontSize;
    fontSizeValue.textContent = `${fontSize}px`;
    
    // حالت تاریک
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    darkModeToggle.checked = settings.darkMode || false;
    
    // تعداد سوال روزانه
    dailyLimitInput.value = settings.dailyLimit || 20;

    // زمان مرور
    reviewTimeInput.value = settings.reviewTime || '09:00';
    
    // نوتیفیکیشن
    notificationToggle.checked = settings.notifications || false;
    if (settings.notifications) {
        requestNotificationPermission();
    }

    // نوع مرتب‌سازی
    sortTypeSelect.value = settings.sortType || 'alphabetical';
}

// ذخیره تنظیمات
function saveSettings() {
    const settings = {
        fontSize: parseInt(fontSizeSlider.value),
        darkMode: darkModeToggle.checked,
        dailyLimit: parseInt(dailyLimitInput.value),
        reviewTime: reviewTimeInput.value,
        notifications: notificationToggle.checked,
        sortType: sortTypeSelect.value
    };
    localStorage.setItem('leitnerSettings', JSON.stringify(settings));

    // تنظیم زمان یادآوری اگر نوتیفیکیشن فعال باشد
    if (settings.notifications && Notification.permission === 'granted') {
        scheduleReviewReminder(settings.reviewTime);
    }
}

// درخواست مجوز نوتیفیکیشن
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        Swal.fire({
            title: 'خطا',
            text: 'مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند',
            icon: 'error',
            confirmButtonText: 'باشه'
        });
        notificationToggle.checked = false;
        return false;
    }

    try {
        // اگر قبلاً مجوز گرفته شده باشد
        if (Notification.permission === 'granted') {
            return true;
        }
        
        // اگر قبلاً مجوز رد شده باشد
        if (Notification.permission === 'denied') {
            Swal.fire({
                title: 'خطا',
                text: 'دسترسی به نوتیفیکیشن مسدود شده است. لطفاً از تنظیمات مرورگر آن را فعال کنید',
                icon: 'warning',
                confirmButtonText: 'باشه'
            });
            notificationToggle.checked = false;
            return false;
        }

        // درخواست مجوز
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            Swal.fire({
                title: 'موفق',
                text: 'دسترسی به نوتیفیکیشن با موفقیت فعال شد',
                icon: 'success',
                confirmButtonText: 'باشه'
            });
            return true;
        } else {
            Swal.fire({
                title: 'خطا',
                text: 'برای دریافت یادآوری، لطفاً به نوتیفیکیشن اجازه دسترسی دهید',
                icon: 'warning',
                confirmButtonText: 'باشه'
            });
            notificationToggle.checked = false;
            return false;
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        Swal.fire({
            title: 'خطا',
            text: 'خطا در درخواست دسترسی به نوتیفیکیشن',
            icon: 'error',
            confirmButtonText: 'باشه'
        });
        notificationToggle.checked = false;
        return false;
    }
}

// تنظیم یادآور مرور
function scheduleReviewReminder(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    // اگر زمان یادآوری برای امروز گذشته، برای فردا تنظیم شود
    if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime - now;
    setTimeout(() => {
        showNotification();
        // تنظیم مجدد برای روز بعد
        scheduleReviewReminder(time);
    }, timeUntilReminder);
}

// نمایش نوتیفیکیشن
function showNotification() {
    if (Notification.permission === 'granted') {
        new Notification('یادآوری مرور لغات', {
            body: 'زمان مرور لغات امروز فرا رسیده است',
            icon: '/icon.png'
        });
    }
}

// مرتب‌سازی لغات
function sortWords(type) {
    const boxes = JSON.parse(localStorage.getItem('boxes') || '{"box1":[],"box2":[],"box3":[],"box4":[],"box5":[]}');
    
    // تبدیل همه جعبه‌ها به یک آرایه
    let allWords = [];
    for (let box in boxes) {
        allWords = allWords.concat(boxes[box].map(word => ({...word, box})));
    }

    // مرتب‌سازی بر اساس نوع انتخاب شده
    switch (type) {
        case 'alphabetical':
            allWords.sort((a, b) => a.word.localeCompare(b.word));
            break;
        case 'difficulty':
            allWords.sort((a, b) => b.difficulty - a.difficulty);
            break;
        case 'box':
            allWords.sort((a, b) => a.box.localeCompare(b.box));
            break;
        case 'lastReview':
            allWords.sort((a, b) => new Date(b.lastReview) - new Date(a.lastReview));
            break;
    }

    return allWords;
}

// نمایش وضعیت جعبه‌ها
function showBoxStatus() {
    const boxes = JSON.parse(localStorage.getItem('boxes') || '{"box1":[],"box2":[],"box3":[],"box4":[],"box5":[]}');
    const dailyCount = localStorage.getItem('dailyQuestionCount') || '0';
    const settings = JSON.parse(localStorage.getItem('leitnerSettings') || '{"dailyLimit":20}');

    Swal.fire({
        title: 'وضعیت جعبه‌ها',
        html: `
            <div dir="rtl" class="box-status">
                <p>جعبه ۱ (روزانه): ${boxes.box1.length} لغت</p>
                <p>جعبه ۲ (هر ۲ روز): ${boxes.box2.length} لغت</p>
                <p>جعبه ۳ (هر ۴ روز): ${boxes.box3.length} لغت</p>
                <p>جعبه ۴ (هر ۷ روز): ${boxes.box4.length} لغت</p>
                <p>جعبه ۵ (هر ۱۵ روز): ${boxes.box5.length} لغت</p>
                <hr>
                <p>تعداد سوالات امروز: ${dailyCount} از ${settings.dailyLimit}</p>
            </div>
        `,
        confirmButtonText: 'بستن'
    });
}

// تایید ریست کردن برنامه
function confirmReset() {
    Swal.fire({
        title: 'آیا مطمئن هستید؟',
        text: 'تمام پیشرفت شما از بین خواهد رفت!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'بله، پاک شود',
        cancelButtonText: 'انصراف'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            Swal.fire({
                title: 'انجام شد!',
                text: 'همه اطلاعات پاک شد.',
                icon: 'success',
                confirmButtonText: 'باشه'
            }).then(() => {
                window.location.reload();
            });
        }
    });
}

// بازیابی از فایل پشتیبان
async function restoreFromBackup(file) {
    try {
        const text = await file.text();
        const backup = JSON.parse(text);
        
        if (!backup.boxes || !backup.stats || !backup.settings || !backup.version) {
            throw new Error('فایل پشتیبان نامعتبر است');
        }

        const result = await Swal.fire({
            title: 'بازیابی اطلاعات',
            html: `
                <div dir="rtl">
                    <p>آیا مطمئن هستید که می‌خواهید اطلاعات را از فایل پشتیبان بازیابی کنید؟</p>
                    <p>تاریخ پشتیبان: ${new Date(backup.date).toLocaleDateString('fa-IR')}</p>
                    <p>نسخه: ${backup.version}</p>
                    <p class="text-danger">این عمل قابل بازگشت نیست!</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2196F3',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'بله، بازیابی شود',
            cancelButtonText: 'انصراف'
        });

        if (result.isConfirmed) {
            localStorage.setItem('boxes', JSON.stringify(backup.boxes));
            localStorage.setItem('leitnerStats', JSON.stringify(backup.stats));
            localStorage.setItem('leitnerSettings', JSON.stringify(backup.settings));
            
            await Swal.fire({
                title: 'بازیابی موفق',
                text: 'اطلاعات با موفقیت بازیابی شد.',
                icon: 'success',
                confirmButtonText: 'باشه'
            });
            
            window.location.reload();
        }
    } catch (error) {
        console.error('Error restoring backup:', error);
        Swal.fire({
            title: 'خطا',
            text: 'خطا در بازیابی فایل پشتیبان: ' + error.message,
            icon: 'error',
            confirmButtonText: 'باشه'
        });
    }
}

// ایجاد فایل پشتیبان
function createBackup() {
    const backup = {
        boxes: JSON.parse(localStorage.getItem('boxes') || '{"box1":[],"box2":[],"box3":[],"box4":[],"box5":[]}'),
        stats: JSON.parse(localStorage.getItem('leitnerStats') || '{"totalReviewed":0,"correctAnswers":0,"wrongAnswers":0,"dailyStats":{}}'),
        settings: JSON.parse(localStorage.getItem('leitnerSettings') || '{"fontSize":16,"darkMode":false,"dailyLimit":20}'),
        version: '1.0.0',
        date: new Date().toISOString()
    };

    const backupStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `leitner-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
        title: 'پشتیبان‌گیری موفق',
        text: 'فایل پشتیبان با موفقیت ایجاد شد.',
        icon: 'success',
        confirmButtonText: 'باشه'
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // بارگذاری تنظیمات اولیه
    loadSettings();
    
    // تغییر اندازه فونت
    fontSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        fontSizeValue.textContent = `${size}px`;
        document.documentElement.style.fontSize = `${size}px`;
        saveSettings();
    });

    // تغییر حالت تاریک/روشن
    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        saveSettings();
    });

    // تغییر تعداد سوال روزانه
    dailyLimitInput.addEventListener('change', saveSettings);

    // تغییر زمان مرور
    reviewTimeInput.addEventListener('change', saveSettings);

    // تغییر وضعیت نوتیفیکیشن
    notificationToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                e.target.checked = false;
            }
        }
        saveSettings();
    });

    // تغییر نوع مرتب‌سازی
    sortTypeSelect.addEventListener('change', (e) => {
        const sortedWords = sortWords(e.target.value);
        saveSettings();
        // نمایش نتیجه مرتب‌سازی
        showSortedWords(sortedWords);
    });

    // نمایش وضعیت جعبه‌ها
    showBoxStatusBtn.addEventListener('click', showBoxStatus);

    // پشتیبان‌گیری
    backupBtn.addEventListener('click', createBackup);

    // بازیابی
    restoreBtn.addEventListener('click', () => {
        restoreFile.click();
    });

    restoreFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            restoreFromBackup(e.target.files[0]);
        }
    });

    // ریست کردن
    resetBtn.addEventListener('click', confirmReset);
});

// نمایش لغات مرتب شده
function showSortedWords(words) {
    let html = '<div class="sorted-words">';
    words.forEach(word => {
        html += `
            <div class="word-item">
                <span class="word-text">${word.word}</span>
                <span class="word-box">جعبه ${word.box.replace('box', '')}</span>
                ${word.lastReview ? `<span class="word-review">آخرین مرور: ${new Date(word.lastReview).toLocaleDateString('fa-IR')}</span>` : ''}
                ${word.difficulty ? `<span class="word-difficulty">سختی: ${word.difficulty}</span>` : ''}
            </div>
        `;
    });
    html += '</div>';

    Swal.fire({
        title: 'لغات مرتب شده',
        html: html,
        width: '80%',
        confirmButtonText: 'بستن'
    });
} 