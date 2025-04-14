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
    DAILY_LIMIT: 'dailyLimit'
};

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('leitnerSettings') || '{}');
    
    // اندازه فونت
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize || 16}px`);
    fontSizeSlider.value = settings.fontSize || 16;
    fontSizeValue.textContent = `${settings.fontSize || 16}px`;
    
    // حالت تاریک
    document.body.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    darkModeToggle.checked = settings.darkMode || false;
    
    // تعداد سوال روزانه
    dailyLimitInput.value = settings.dailyLimit || 20;
}

// ذخیره تنظیمات
function saveSettings() {
    const settings = {
        fontSize: parseInt(fontSizeSlider.value),
        darkMode: darkModeToggle.checked,
        dailyLimit: parseInt(dailyLimitInput.value)
    };
    localStorage.setItem('leitnerSettings', JSON.stringify(settings));
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
        document.documentElement.style.setProperty('--font-size', `${size}px`);
        saveSettings();
    });

    // تغییر حالت تاریک/روشن
    darkModeToggle.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
        saveSettings();
    });

    // تغییر تعداد سوال روزانه
    dailyLimitInput.addEventListener('change', saveSettings);

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