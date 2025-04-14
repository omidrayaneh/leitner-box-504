// DOM Elements
const wordNumber = document.getElementById('wordNumber');
const wordText = document.getElementById('wordText');
const pronunciation = document.getElementById('pronunciation');
const definition = document.getElementById('definition');
const example = document.getElementById('example');
const synonyms = document.getElementById('synonyms');
const soundButton = document.getElementById('soundButton');
const wrongBtn = document.getElementById('wrongBtn');
const correctBtn = document.getElementById('correctBtn');
const flashcard = document.querySelector('.flashcard');

let currentWord = null;
let isFlipped = false;
let isPlaying = false;

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

// تنظیمات پیش‌فرض SweetAlert2
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});

// تنظیمات پیش‌فرض برای همه پیام‌های SweetAlert2
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

// بازیابی تنظیمات و وضعیت
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

    // بازیابی کلمه فعلی
    const savedCurrentWord = localStorage.getItem('currentWord');
    if (savedCurrentWord) {
        currentWord = JSON.parse(savedCurrentWord);
        displayWord(currentWord);
    }
}

// اعمال تنظیمات
function applySettings() {
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
    document.body.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
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
        // ذخیره کلمه فعلی
        localStorage.setItem('currentWord', JSON.stringify(currentWord));
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
    if (isPlaying) return;

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.lang = 'en-US';
    
    // تغییر آیکون به حالت در حال پخش
    const icon = soundButton.querySelector('i');
    icon.className = 'fas fa-spinner fa-spin';
    soundButton.disabled = true;
    isPlaying = true;

    // اطمینان از بارگذاری صداها
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        // اگر صداها هنوز بارگذاری نشده‌اند، منتظر بمانید
        speechSynthesis.addEventListener('voiceschanged', () => {
            voices = speechSynthesis.getVoices();
            const americanVoice = voices.find(voice => 
                voice.lang.includes('en-US') && 
                voice.name.includes('Female')
            ) || voices.find(voice => voice.lang.includes('en-US')) || voices[0];
            
            if (americanVoice) {
                utterance.voice = americanVoice;
            }
            speechSynthesis.speak(utterance);
        }, { once: true });
    } else {
        const americanVoice = voices.find(voice => 
            voice.lang.includes('en-US') && 
            voice.name.includes('Female')
        ) || voices.find(voice => voice.lang.includes('en-US')) || voices[0];
        
        if (americanVoice) {
            utterance.voice = americanVoice;
        }
        speechSynthesis.speak(utterance);
    }

    // بعد از اتمام پخش
    utterance.onend = () => {
        icon.className = 'fas fa-volume-up';
        soundButton.disabled = false;
        isPlaying = false;
    };

    // در صورت خطا
    utterance.onerror = (event) => {
        icon.className = 'fas fa-volume-up';
        soundButton.disabled = false;
        isPlaying = false;
        console.error('Error playing pronunciation:', event);
        Swal.fire({
            title: 'خطا',
            text: 'مشکلی در پخش تلفظ پیش آمد. لطفاً دوباره تلاش کنید.',
            icon: 'error',
            confirmButtonText: 'باشه'
        });
    };
}

// نمایش کلمه روی کارت
function displayWord(word) {
    if (!word) return;
    
    wordNumber.textContent = word.id || '';
    wordText.textContent = word.word || '';
    pronunciation.textContent = word.pronunciation || '';
    definition.textContent = word.meaning || '';
    example.textContent = word.example || '';
    synonyms.textContent = word.synonyms ? `مترادف‌ها: ${word.synonyms}` : '';
    
    // برگرداندن کارت به روی اول
    isFlipped = false;
    flashcard.classList.remove('flipped');
}

// جابجایی کارت بین جعبه‌ها
function moveCard(correct) {
    if (!currentWord) return;

    const { word, currentBox } = currentWord;
    const currentBoxIndex = parseInt(currentBox.replace('box', ''));
    let newBoxIndex;

    if (correct) {
        newBoxIndex = Math.min(currentBoxIndex + 1, 5);
    } else {
        newBoxIndex = 1;
    }

    // حذف کلمه از جعبه فعلی
    window.boxes[currentBox] = window.boxes[currentBox].filter(w => w.word !== word);

    // اضافه کردن به جعبه جدید
    window.boxes[`box${newBoxIndex}`].push(currentWord);

    // ذخیره تغییرات
    saveState();
    
    // به‌روزرسانی آمار
    const today = new Date().toISOString().split('T')[0];
    
    // اطمینان از وجود آمار امروز
    if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = {
            reviewed: 0,
            correct: 0,
            wrong: 0
        };
    }
    
    // به‌روزرسانی آمار
    stats.totalReviewed++;
    stats.dailyStats[today].reviewed++;
    
    if (correct) {
        stats.correctAnswers++;
        stats.dailyStats[today].correct++;
    } else {
        stats.wrongAnswers++;
        stats.dailyStats[today].wrong++;
    }
    
    // ذخیره آمار در localStorage
    localStorage.setItem('leitnerStats', JSON.stringify(stats));
}

// ذخیره وضعیت
function saveState() {
    localStorage.setItem('boxes', JSON.stringify(window.boxes));
    localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
}

// Event Listeners
flashcard.addEventListener('click', (e) => {
    // اگر روی دکمه صدا کلیک شده، از چرخش جلوگیری کن
    if (e.target.closest('.sound-btn')) return;
    
    isFlipped = !isFlipped;
    flashcard.classList.toggle('flipped');
});

soundButton.addEventListener('click', () => {
    if (currentWord) {
        playPronunciation(currentWord.word);
    }
});

wrongBtn.addEventListener('click', () => {
    moveCard(false);
    showNewCard();
});

correctBtn.addEventListener('click', () => {
    moveCard(true);
    showNewCard();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // فقط اگر کلمه فعلی وجود نداشت، کارت جدید نمایش داده شود
    if (!currentWord) {
        showNewCard();
    }
}); 