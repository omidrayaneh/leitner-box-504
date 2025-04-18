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

// New DOM Elements
const addNoteBtn = document.getElementById('addNoteBtn');
const addImageBtn = document.getElementById('addImageBtn');
const addExampleBtn = document.getElementById('addExampleBtn');
const personalNote = document.getElementById('personalNote');
const wordImage = document.getElementById('wordImage');
const examplesList = document.getElementById('examplesList');
const difficultyDots = document.querySelectorAll('.difficulty-dot');

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
Swal.mixin({
    customClass: {
        confirmButton: 'swal2-button',
        cancelButton: 'swal2-button',
        denyButton: 'swal2-button'
    },
    buttonsStyling: false
});

// اضافه کردن استایل به head
const style = document.createElement('style');
style.textContent = `
    .swal2-popup {
        font-family: Vazirmatn !important;
    }
    .swal2-title, 
    .swal2-html-container,
    .swal2-input,
    .swal2-textarea {
        font-family: Vazirmatn !important;
    }
    .swal2-button {
        font-family: Vazirmatn !important;
        font-size: 1em !important;
        margin: 5px !important;
        padding: 8px 20px !important;
        border-radius: 5px !important;
        transition: all 0.3s ease !important;
        background-color: #4CAF50 !important;
        color: white !important;
        border: none !important;
    }
    .swal2-button.swal2-cancel-button {
        background-color: #f44336 !important;
    }
    .swal2-button:hover {
        opacity: 0.9 !important;
        transform: translateY(-1px) !important;
    }
    .custom-example {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .example-actions {
        display: flex;
        gap: 5px;
    }
    .example-delete-btn {
        color: #dc3545;
        cursor: pointer;
        padding: 2px 5px;
        font-size: 0.9em;
    }
    .example-delete-btn:hover {
        color: #bd2130;
    }
`;
document.head.appendChild(style);

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
    synonyms.textContent = word.synonyms || '';
    
    // بارگذاری اطلاعات اضافی کلمه
    const wordData = getWordData(word.word);
    
    // به‌روزرسانی یادداشت
    personalNote.value = wordData.notes || '';
    if (wordData.notes) {
        personalNoteContainer.classList.add('has-note');
    } else {
        personalNoteContainer.classList.remove('has-note');
    }
    
    // به‌روزرسانی تصویر
    if (wordData.imageUrl) {
        wordImage.src = wordData.imageUrl;
        wordImageContainer.classList.add('has-image');
    } else {
        wordImage.src = '';
        wordImageContainer.classList.remove('has-image');
    }
    
    // به‌روزرسانی مثال‌ها
    examplesList.innerHTML = '';
    
    // اضافه کردن مثال پیش‌فرض از words.js
    if (word.example) {
        const defaultLi = document.createElement('li');
        defaultLi.className = 'example-item default-example';
        defaultLi.textContent = word.example;
        examplesList.appendChild(defaultLi);
    }
    
    // اضافه کردن مثال‌های ذخیره شده
    if (wordData.examples && wordData.examples.length > 0) {
        wordData.examples.forEach(example => {
            const li = document.createElement('li');
            li.className = 'example-item custom-example';
            li.textContent = example;
            examplesList.appendChild(li);
        });
    }
    
    // به‌روزرسانی نشانگر سختی
    updateDifficultyDots(word.difficulty || 1);
    
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
    // اگر روی دکمه‌ها یا ابزارها کلیک شده، از چرخش جلوگیری کن
    if (e.target.closest('.sound-btn') || 
        e.target.closest('.tool-btn') || 
        e.target.closest('.control-btn') ||
        e.target.closest('.notes-input')) {
        return;
    }
    
    isFlipped = !isFlipped;
    flashcard.classList.toggle('flipped');
});

soundButton.addEventListener('click', () => {
    if (currentWord) {
        playPronunciation(currentWord.word);
    }
});

wrongBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // جلوگیری از چرخش کارت
    moveCard(false);
    showNewCard();
});

correctBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // جلوگیری از چرخش کارت
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

// Extended word data structure in localStorage
function getWordData(word) {
    const key = `word_${word}`;
    const data = localStorage.getItem(key);
    if (data) {
        return JSON.parse(data);
    }
    return {
        notes: '',
        imageUrl: '',
        examples: [],
        lastReviewed: null,
        correctCount: 0,
        wrongCount: 0
    };
}

function saveWordData(word, data) {
    const key = `word_${word}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// تغییر در نمایش مثال‌های شخصی
function addCustomExample(example, data, currentWord) {
    const li = document.createElement('li');
    li.className = 'example-item custom-example';
    
    const exampleText = document.createElement('span');
    exampleText.textContent = example;
    li.appendChild(exampleText);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'example-actions';
    
    const deleteBtn = document.createElement('i');
    deleteBtn.className = 'fas fa-trash example-delete-btn';
    deleteBtn.title = 'حذف مثال';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        Swal.fire({
            title: 'حذف مثال',
            text: 'آیا از حذف این مثال اطمینان دارید؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'بله، حذف شود',
            cancelButtonText: 'انصراف',
            customClass: {
                popup: 'swal2-rtl',
                confirmButton: 'swal2-styled swal2-confirm',
                cancelButton: 'swal2-styled swal2-cancel'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const exampleIndex = data.examples.indexOf(example);
                if (exampleIndex > -1) {
                    data.examples.splice(exampleIndex, 1);
                    saveWordData(currentWord, data);
                    li.remove();
                    
                    Toast.fire({
                        icon: 'success',
                        title: 'مثال با موفقیت حذف شد'
                    });
                }
            }
        });
    });
    
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(actionsDiv);
    examplesList.appendChild(li);
}

// به‌روزرسانی نحوه نمایش مثال‌ها
function loadWordData(word) {
    const data = getWordData(word);
    
    // Update notes
    personalNote.value = data.notes;
    
    // Update image
    if (data.imageUrl) {
        wordImage.src = data.imageUrl;
        wordImage.classList.add('has-image');
    } else {
        wordImage.src = '';
        wordImage.classList.remove('has-image');
    }
    
    // Update examples
    examplesList.innerHTML = '';
    const defaultExample = document.getElementById('example').textContent;
    if (defaultExample) {
        const li = document.createElement('li');
        li.className = 'example-item';
        li.textContent = defaultExample;
        examplesList.appendChild(li);
    }
    
    if (data.examples && data.examples.length > 0) {
        data.examples.forEach(example => {
            addCustomExample(example, data, word);
        });
    }
    
    // Update difficulty indicator
    updateDifficultyDots(data.difficulty || 1);
}

function updateDifficultyDots(level) {
    difficultyDots.forEach((dot, index) => {
        if (index < level) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Event Listeners for new features
addNoteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // جلوگیری از چرخش کارت
    const currentWord = document.getElementById('wordText').textContent;
    const data = getWordData(currentWord);
    
    Swal.fire({
        title: 'یادداشت شخصی',
        html: `
            <div class="notes-container" style="text-align: right; direction: rtl;">
                <div class="word-info" style="margin-bottom: 12px; font-size: 1.1em;">
                    <span style="color: #666;">کلمه:</span> 
                    <span style="font-weight: 500;">${currentWord}</span>
                </div>
                <textarea id="personal-notes" class="swal2-textarea" 
                    placeholder="Write your personal notes here..." 
                    style="height: 100px; width: 90%; margin-top: 8px; font-family: Vazirmatn; direction: ltr !important; text-align: left !important; font-size: 1em; padding: 10px; resize: none;"
                >${data.notes || ''}</textarea>
                <div class="notes-tips" style="margin-top: 12px; font-size: 0.85em; color: #666; text-align: right;">
                    راهنمای نوشتن یادداشت:
                    <ul style="margin-top: 6px; padding-right: 20px;">
                        <li>روش‌های یادآوری را بنویسید</li>
                        <li>کلمات مرتبط را اضافه کنید</li>
                        <li>الگوهای استفاده متداول را یادداشت کنید</li>
                        <li>مثال‌های شخصی اضافه کنید</li>
                    </ul>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'ذخیره',
        cancelButtonText: 'انصراف',
        width: '60vw',
        maxWidth: '400px',
        customClass: {
            popup: 'swal2-rtl',
            title: 'swal2-rtl',
            htmlContainer: 'swal2-rtl'
        },
        preConfirm: () => {
            return document.getElementById('personal-notes').value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            data.notes = result.value;
            saveWordData(currentWord, data);
            personalNote.value = result.value;
            
            if (result.value.trim()) {
                personalNoteContainer.classList.add('has-note');
            } else {
                personalNoteContainer.classList.remove('has-note');
            }
            
            Toast.fire({
                icon: 'success',
                title: 'Notes saved successfully'
            });
        }
    });
});

addImageBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // جلوگیری از چرخش کارت
    const currentWord = document.getElementById('wordText').textContent;
    const data = getWordData(currentWord);
    
    Swal.fire({
        title: 'افزودن تصویر',
        input: 'url',
        inputValue: data.imageUrl,
        inputPlaceholder: 'آدرس تصویر را وارد کنید',
        showCancelButton: true,
        confirmButtonText: 'ذخیره',
        cancelButtonText: 'انصراف',
        customClass: {
            popup: 'swal2-rtl',
            title: 'swal2-rtl',
            htmlContainer: 'swal2-rtl'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            data.imageUrl = result.value;
            saveWordData(currentWord, data);
            wordImage.src = result.value;
            wordImage.classList.add('has-image');
            
            Swal.fire({
                icon: 'success',
                title: 'تصویر اضافه شد',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    });
});

addExampleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentWord = document.getElementById('wordText').textContent;
    const data = getWordData(currentWord);
    
    Swal.fire({
        title: 'افزودن مثال جدید',
        html: `
            <div class="example-input-container" style="direction: rtl; text-align: right;">
                <textarea id="new-example" class="swal2-textarea" placeholder="Write your new example here..." 
                    style="height: 100px; width: 90%; font-family: Vazirmatn; direction: ltr !important; text-align: left !important; font-size: 1em; padding: 10px; resize: none;"></textarea>
                <div class="example-tips" style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    راهنما:
                    <ul style="margin-top: 5px; padding-right: 20px;">
                        <li>از کلمه مورد نظر در جمله استفاده کنید</li>
                        <li>جمله باید کوتاه و مفید باشد</li>
                        <li>از ساختار ساده استفاده کنید</li>
                    </ul>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'افزودن',
        cancelButtonText: 'انصراف',
        customClass: {
            popup: 'swal2-rtl',
            title: 'swal2-rtl',
            htmlContainer: 'swal2-rtl'
        },
        preConfirm: () => {
            return document.getElementById('new-example').value;
        }
    }).then((result) => {
        if (result.isConfirmed && result.value.trim()) {
            if (!data.examples) {
                data.examples = [];
            }
            data.examples.push(result.value);
            saveWordData(currentWord, data);
            
            addCustomExample(result.value, data, currentWord);
            
            Toast.fire({
                icon: 'success',
                title: 'مثال جدید اضافه شد'
            });
        }
    });
});

// Update difficulty when clicking on dots
difficultyDots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
        e.stopPropagation(); // جلوگیری از چرخش کارت
        if (!currentWord) return;
        
        const newLevel = index + 1;
        currentWord.difficulty = newLevel;
        
        // به‌روزرسانی در جعبه مربوطه
        const boxWords = window.boxes[currentWord.currentBox];
        const wordIndex = boxWords.findIndex(w => w.word === currentWord.word);
        if (wordIndex !== -1) {
            boxWords[wordIndex].difficulty = newLevel;
            saveState();
        }
        
        updateDifficultyDots(newLevel);
        
        Toast.fire({
            icon: 'info',
            title: `سطح سختی به ${newLevel} تغییر کرد`
        });
    });
});

// Save notes when they change
personalNote.addEventListener('input', debounce(() => {
    const currentWord = document.getElementById('wordText').textContent;
    const data = getWordData(currentWord);
    data.notes = personalNote.value;
    saveWordData(currentWord, data);
}, 500));

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// اضافه کردن متغیر برای لغات شخصی
if (!window.customWords) {
    window.customWords = [];
}

// اضافه کردن دکمه افزودن لغت جدید
const addNewWordBtn = document.createElement('button');
addNewWordBtn.className = 'tool-btn';
addNewWordBtn.title = 'افزودن لغت جدید';
addNewWordBtn.innerHTML = '<i class="fas fa-plus"></i>';
document.querySelector('.card-tools').appendChild(addNewWordBtn);

// به‌روزرسانی tooltip های دکمه‌های موجود
addNoteBtn.title = 'افزودن یادداشت';
addImageBtn.title = 'افزودن تصویر';
addExampleBtn.title = 'افزودن مثال';

// Event listener برای دکمه افزودن لغت جدید
addNewWordBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    Swal.fire({
        title: 'افزودن لغت جدید',
        html: `
            <div class="new-word-form" style="text-align: right; direction: rtl;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">لغت:</label>
                    <input id="new-word" class="swal2-input" placeholder="لغت انگلیسی را وارد کنید" style="direction: ltr; text-align: left;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">تلفظ:</label>
                    <input id="new-pronunciation" class="swal2-input" placeholder="تلفظ را وارد کنید" style="direction: ltr; text-align: left;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">معنی:</label>
                    <input id="new-meaning" class="swal2-input" placeholder="معنی فارسی را وارد کنید">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">مثال:</label>
                    <textarea id="new-example" class="swal2-textarea" placeholder="یک مثال به انگلیسی وارد کنید" style="direction: ltr; text-align: left;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">مترادف‌ها:</label>
                    <input id="new-synonyms" class="swal2-input" placeholder="مترادف‌ها را با کاما جدا کنید" style="direction: ltr; text-align: left;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'افزودن',
        cancelButtonText: 'انصراف',
        customClass: {
            popup: 'swal2-rtl',
            confirmButton: 'swal2-confirm-button',
            cancelButton: 'swal2-cancel-button'
        },
        preConfirm: () => {
            const word = document.getElementById('new-word').value.trim();
            const pronunciation = document.getElementById('new-pronunciation').value.trim();
            const meaning = document.getElementById('new-meaning').value.trim();
            const example = document.getElementById('new-example').value.trim();
            const synonyms = document.getElementById('new-synonyms').value.trim();

            if (!word || !meaning) {
                Swal.showValidationMessage('لغت و معنی اجباری هستند');
                return false;
            }

            return { word, pronunciation, meaning, example, synonyms };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { word, pronunciation, meaning, example, synonyms } = result.value;
            
            // ساخت لغت جدید
            const newWord = {
                id: window.customWords.length + 1000, // شروع از 1000 برای جلوگیری از تداخل با لغات اصلی
                word: word,
                pronunciation: pronunciation,
                meaning: meaning,
                example: example,
                synonyms: synonyms,
                difficulty: 1,
                isCustom: true // نشانه‌گذاری به عنوان لغت شخصی
            };

            // اضافه کردن به لیست لغات شخصی
            window.customWords.push(newWord);
            
            // اضافه کردن به جعبه اول
            window.boxes.box1.push(newWord);
            
            // ذخیره در localStorage
            localStorage.setItem('customWords', JSON.stringify(window.customWords));
            saveState();

            Toast.fire({
                icon: 'success',
                title: 'لغت جدید با موفقیت اضافه شد'
            });
        }
    });
});

// بازیابی لغات شخصی در هنگام بارگذاری
document.addEventListener('DOMContentLoaded', () => {
    const savedCustomWords = localStorage.getItem('customWords');
    if (savedCustomWords) {
        window.customWords = JSON.parse(savedCustomWords);
        
        // اضافه کردن لغات شخصی به جعبه مناسب
        window.customWords.forEach(word => {
            if (!window.boxes.box1.some(w => w.word === word.word)) {
                window.boxes.box1.push(word);
            }
        });
    }
    
    loadSettings();
    
    if (!currentWord) {
        showNewCard();
    }
}); 