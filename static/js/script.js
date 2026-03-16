/**
 * Frontend JavaScript for Nutrition Analyzer
 * Extended with quantity controls, explainable score, rule-based verdict,
 * and daily intake tracker.
 */

const inputCamera = document.getElementById('input-camera');
const inputFile = document.getElementById('input-file');
const btnCamera = document.getElementById('btn-camera');
const btnFile = document.getElementById('btn-file');
const imageMethodButtons = document.getElementById('imageMethodButtons');
const uploadInitial = document.getElementById('upload-initial');
const uploadPreview = document.getElementById('upload-preview');
const uploadPreviewImage = document.getElementById('uploadPreviewImage');
const clearPreviewBtn = document.getElementById('clearPreviewBtn');
const uploadAnalyze = document.getElementById('upload-analyze');
const uploadLoading = document.getElementById('upload-loading');
const uploadRescan = document.getElementById('upload-rescan');
const scanAnotherBtn = document.getElementById('scanAnotherBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const nutritionResult = document.getElementById('nutritionResult');
const recommendations = document.getElementById('recommendations');
const recommendationsPanel = document.getElementById('recommendationsPanel');
const quantityControlsMount = document.getElementById('quantityControlsMount');
const quantityStripSection = document.getElementById('quantityStripSection');
const dailyIntakePanel = document.getElementById('dailyIntakePanel');
const resultsSection = document.getElementById('results');
const resultsGrid = document.getElementById('resultsGrid');
const recommendationsWideWrap = document.getElementById('recommendationsWideWrap');
const chartSection = document.getElementById('chartSection');
const lowConfidenceMount = document.getElementById('lowConfidenceMount');
const lowConfidenceConfirmOverlay = document.getElementById('lowConfidenceConfirmOverlay');
const lowConfidencePreview = document.getElementById('lowConfidencePreview');
const lowConfidenceHeading = document.getElementById('lowConfidenceHeading');
const lowConfidenceConfidenceLine = document.getElementById('lowConfidenceConfidenceLine');
const lowConfidenceYesBtn = document.getElementById('lowConfidenceYesBtn');
const lowConfidenceNoBtn = document.getElementById('lowConfidenceNoBtn');
const historyOverlay = document.getElementById('historyOverlay');
const historyDrawer = document.getElementById('historyDrawer');
const historyDrawerClose = document.getElementById('historyDrawerClose');
const historyDrawerSubtitle = document.getElementById('historyDrawerSubtitle');
const historySummary = document.getElementById('historySummary');
const historyItemList = document.getElementById('historyItemList');
const historyModalOverlay = document.getElementById('historyModalOverlay');
const historyModalClose = document.getElementById('historyModalClose');
const historyModalTitle = document.getElementById('historyModalTitle');
const historyModalSubtitle = document.getElementById('historyModalSubtitle');
const historyModalBody = document.getElementById('historyModalBody');
const historyDetailChartCanvas = document.getElementById('historyDetailChart');

let nutritionChart = null;
let historyDetailChart = null;
let dashboardState = null;
let selectedImageFile = null;
let selectedImagePreviewUrl = null;
let currentUploadState = 'initial';
let pendingLowConfidenceResult = null;
let pendingLowConfidenceConfidencePct = 0;
let pendingLowConfidencePredictedClass = '';

const DAILY_LIMITS = {
    calories: { limit: 2000, unit: 'kcal', label: 'Calories' },
    protein: { limit: 100, unit: 'g', label: 'Protein' },
    fat: { limit: 65, unit: 'g', label: 'Fat' },
    carbs: { limit: 250, unit: 'g', label: 'Carbs' },
    sugar: { limit: 50, unit: 'g', label: 'Sugar' },
    sodium: { limit: 2, unit: 'g', label: 'Sodium' }
};

const DAILY_LOG_KEY = 'daily_log';

function zeroTotals() {
    return {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        sugar: 0,
        sodium: 0
    };
}

function normalizeNutrients(nutrients) {
    const normalized = zeroTotals();
    Object.keys(normalized).forEach((key) => {
        normalized[key] = toNumber(nutrients && nutrients[key], 0);
    });
    return normalized;
}

function getDailyLog() {
    try {
        const raw = sessionStorage.getItem(DAILY_LOG_KEY);
        if (!raw) {
            return { items: [], totals: zeroTotals() };
        }

        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed && parsed.items) ? parsed.items : [];
        const totals = normalizeNutrients(parsed && parsed.totals);
        return { items, totals };
    } catch (error) {
        return { items: [], totals: zeroTotals() };
    }
}

function deepClone(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return value;
    }
}

function getImageThumbnail(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve('');
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 112;
            canvas.height = 112;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve('');
                return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                const scale = Math.max(112 / img.width, 112 / img.height);
                const x = (112 - img.width * scale) / 2;
                const y = (112 - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
                URL.revokeObjectURL(objectUrl);
            };

            img.onerror = () => {
                resolve('');
                URL.revokeObjectURL(objectUrl);
            };

            img.src = objectUrl;
        } catch (error) {
            resolve('');
        }
    });
}

function addItemToLog(foodName, quantityG, nutrients, meta = {}) {
    try {
        const log = getDailyLog();

        log.items.push({
            food_name: String(foodName || 'unknown_food').trim() || 'unknown_food',
            quantity_g: toNumber(quantityG, 0),
            timestamp: new Date().toISOString(),
            thumbnail: String(meta.thumbnail || ''),
            nutrients: normalizeNutrients(nutrients),
            verdict: String(meta.verdict || ''),
            score: toNumber(meta.score, 0),
            score_breakdown: String(meta.scoreBreakdown || ''),
            classification: deepClone(meta.classification || null),
            confidence: toNumber(meta.confidence, 0),
            product_name: String(meta.productName || ''),
            food_key: String(meta.foodKey || foodName || ''),
            recommendations: Array.isArray(meta.recommendations) ? deepClone(meta.recommendations) : [],
            per_100g: deepClone(meta.per100 || null)
        });

        log.totals = zeroTotals();
        log.items.forEach((item) => {
            Object.keys(log.totals).forEach((key) => {
                log.totals[key] += toNumber(item && item.nutrients && item.nutrients[key], 0);
            });
        });

        sessionStorage.setItem(DAILY_LOG_KEY, JSON.stringify(log));
        return normalizeNutrients(log.totals);
    } catch (error) {
        return getDailyLog().totals;
    }
}

function getDailySubtitle(itemCount) {
    const base = 'WHO 2000 kcal / day';
    if (itemCount <= 0) return base;
    const suffix = itemCount === 1 ? 'item' : 'items';
    return `${base}  ·  ${itemCount} ${suffix} logged today`;
}

function updateHistoryButtonCount() {
    const button = document.getElementById('btn-history');
    const label = document.getElementById('btn-history-label');
    const count = getDailyLog().items.length;

    if (label) {
        label.textContent = `History (${count})`;
    } else if (button) {
        button.textContent = `History (${count})`;
    }

    if (button) {
        button.classList.toggle('is-empty', count === 0);
    }
}

function setConsumptionStatus(didConsume) {
    const consumeActionRow = document.getElementById('consumeActionRow');
    const consumeStatusText = document.getElementById('consumeStatusText');
    if (!consumeActionRow || !consumeStatusText) return;

    consumeActionRow.style.display = 'none';
    consumeStatusText.style.display = 'block';

    if (didConsume) {
        consumeStatusText.className = 'consume-status consume-status-yes';
        consumeStatusText.textContent = '✓ Added to your daily intake';
        return;
    }

    consumeStatusText.className = 'consume-status consume-status-no';
    consumeStatusText.textContent = 'Skipped — not added to daily intake';
}

async function handleConsumptionDecision(didConsume) {
    if (!dashboardState || dashboardState.consumeDecision !== 'pending') return;

    const quantityGrams = getQuantityGrams(dashboardState);
    const adjusted = getAdjustedNutrition(dashboardState.per100, quantityGrams);

    if (didConsume) {
        const thumbnail = await getImageThumbnail(selectedImageFile);
        addItemToLog(dashboardState.foodKey, quantityGrams, adjusted, {
            thumbnail,
            verdict: dashboardState.latestClassification && dashboardState.latestClassification.verdict,
            score: dashboardState.latestScore,
            scoreBreakdown: dashboardState.latestScoreBreakdown,
            classification: dashboardState.latestClassification,
            confidence: dashboardState.confidence,
            productName: dashboardState.productName,
            foodKey: dashboardState.foodKey,
            recommendations: dashboardState.latestRecommendations,
            per100: dashboardState.per100
        });
        dashboardState.consumeDecision = 'yes';
        dashboardState.confirmedNutrients = normalizeNutrients(adjusted);
        setConsumptionStatus(true);
    } else {
        dashboardState.consumeDecision = 'no';
        dashboardState.confirmedNutrients = null;
        setConsumptionStatus(false);
    }

    updateHistoryButtonCount();
    renderHistoryDrawer();
    updateDashboard();
}

function bindConsumptionEvents() {
    const consumeYesBtn = document.getElementById('consumeYesBtn');
    const consumeNoBtn = document.getElementById('consumeNoBtn');

    if (consumeYesBtn) {
        consumeYesBtn.addEventListener('click', () => handleConsumptionDecision(true));
    }

    if (consumeNoBtn) {
        consumeNoBtn.addEventListener('click', () => handleConsumptionDecision(false));
    }
}

function updateAnalyzeButtonState() {
    if (!analyzeBtn) return;

    if (currentUploadState === 'initial') {
        analyzeBtn.disabled = true;
        return;
    }

    if (currentUploadState === 'selected') {
        analyzeBtn.disabled = !selectedImageFile;
        return;
    }

    analyzeBtn.disabled = true;
}

function setUploadState(state) {
    currentUploadState = state;

    if (uploadInitial) {
        uploadInitial.style.display = state === 'initial' ? 'block' : 'none';
    }

    if (uploadPreview) {
        uploadPreview.style.display = (state === 'selected' || state === 'analyzing') ? 'flex' : 'none';
    }

    if (uploadAnalyze) {
        uploadAnalyze.style.display = (state === 'initial' || state === 'selected') ? 'block' : 'none';
    }

    if (uploadLoading) {
        uploadLoading.style.display = state === 'analyzing' ? 'block' : 'none';
    }

    if (uploadRescan) {
        uploadRescan.style.display = state === 'result' ? 'block' : 'none';
    }

    if (clearPreviewBtn) {
        clearPreviewBtn.style.display = state === 'analyzing' ? 'none' : 'inline-flex';
    }

    updateAnalyzeButtonState();
}

function clearNativeInputValues() {
    [inputCamera, inputFile].forEach((input) => {
        if (input) {
            input.value = '';
        }
    });
}

function clearSelectedImage() {
    selectedImageFile = null;
    if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
        selectedImagePreviewUrl = null;
    }

    clearNativeInputValues();

    if (uploadPreviewImage) {
        uploadPreviewImage.removeAttribute('src');
    }

    setUploadState('initial');
}

function setSelectedImage(file) {
    if (!file) return;

    selectedImageFile = file;
    if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
    }
    selectedImagePreviewUrl = URL.createObjectURL(file);

    if (uploadPreviewImage) {
        uploadPreviewImage.src = selectedImagePreviewUrl;
    }

    setUploadState('selected');
}

function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedImage(file);
}

if (btnCamera && inputCamera) {
    btnCamera.onclick = () => {
        inputCamera.value = '';
        inputCamera.click();
    };
}

if (btnFile && inputFile) {
    btnFile.onclick = () => {
        inputFile.value = '';
        inputFile.click();
    };
}

[inputCamera, inputFile].forEach((input) => {
    if (input) {
        input.addEventListener('change', handleImageSelection);
    }
});

if (clearPreviewBtn) {
    clearPreviewBtn.addEventListener('click', clearSelectedImage);
}

if (scanAnotherBtn) {
    scanAnotherBtn.addEventListener('click', () => {
        clearSelectedImage();
    });
}

setUploadState('initial');
updateHistoryButtonCount();

function scrollToUpload() {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
}

async function analyze() {
    const file = selectedImageFile;
    if (!file) {
        alert('Please select an image first');
        return;
    }

    setUploadState('analyzing');

    showLoading();

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data && data.status === 'low_confidence') {
            openLowConfidenceConfirmation(data);
            return;
        }

        if (!data.success) {
            showError(data.error || 'Analysis failed');
            setUploadState('selected');
            return;
        }

        displayResults(data);
    } catch (error) {
        console.error('Fetch Error:', error);
        showError('Network error.');
        setUploadState('selected');
    }
}

function triggerUploadFileFlow() {
    closeLowConfidenceConfirmation();
    clearPendingLowConfidenceData();
    setLowConfidenceMode(false);
    clearSelectedImage();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (inputFile) {
        inputFile.value = '';
        inputFile.click();
    }
}

function closeLowConfidenceConfirmation() {
    if (!lowConfidenceConfirmOverlay) return;
    lowConfidenceConfirmOverlay.classList.remove('open');
    lowConfidenceConfirmOverlay.setAttribute('aria-hidden', 'true');
}

function openLowConfidenceConfirmation(data) {
    const pendingResult = data && data.pending_result ? deepClone(data.pending_result) : null;
    if (!pendingResult) {
        showError('Low confidence result is missing analysis payload. Please try again.');
        setUploadState('selected');
        return;
    }

    pendingLowConfidenceResult = pendingResult;
    pendingLowConfidencePredictedClass = String(data.predicted_class || pendingResult.product_name || 'this item');
    pendingLowConfidenceConfidencePct = toNumber(data.confidence_percent, toNumber(data.confidence, 0) * 100);

    if (lowConfidencePreview) {
        if (selectedImagePreviewUrl) {
            lowConfidencePreview.src = selectedImagePreviewUrl;
            lowConfidencePreview.style.display = 'block';
        } else {
            lowConfidencePreview.removeAttribute('src');
            lowConfidencePreview.style.display = 'none';
        }
    }

    if (lowConfidenceHeading) {
        lowConfidenceHeading.innerHTML = `Is this <span class="low-confidence-food-name">${pendingLowConfidencePredictedClass}</span>?`;
    }

    if (lowConfidenceConfidenceLine) {
        lowConfidenceConfidenceLine.innerHTML = `We recognised this with <span class="low-confidence-pct">${pendingLowConfidenceConfidencePct.toFixed(2)}%</span> confidence`;
    }

    if (lowConfidenceConfirmOverlay) {
        lowConfidenceConfirmOverlay.classList.add('open');
        lowConfidenceConfirmOverlay.setAttribute('aria-hidden', 'false');
    }

    setUploadState('selected');
}

function clearPendingLowConfidenceData() {
    pendingLowConfidenceResult = null;
    pendingLowConfidenceConfidencePct = 0;
    pendingLowConfidencePredictedClass = '';
}

function handleLowConfidenceYes() {
    if (!pendingLowConfidenceResult) {
        closeLowConfidenceConfirmation();
        showError('No pending analysis found. Please upload again.');
        setUploadState('selected');
        return;
    }

    const confirmedData = deepClone(pendingLowConfidenceResult);
    const modelConfidencePct = pendingLowConfidenceConfidencePct;
    closeLowConfidenceConfirmation();
    clearPendingLowConfidenceData();
    displayResults(confirmedData, {
        isUserConfirmed: true,
        modelConfidencePct
    });
}

function handleLowConfidenceNo() {
    closeLowConfidenceConfirmation();
    clearPendingLowConfidenceData();
    renderLowConfidenceResult();
}

if (lowConfidenceYesBtn) {
    lowConfidenceYesBtn.addEventListener('click', handleLowConfidenceYes);
}

if (lowConfidenceNoBtn) {
    lowConfidenceNoBtn.addEventListener('click', handleLowConfidenceNo);
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function normalizeFoodKey(apiData) {
    if (apiData.food_key) return String(apiData.food_key).toLowerCase().trim();
    if (apiData.per_100g && apiData.per_100g.food_name) {
        return String(apiData.per_100g.food_name).toLowerCase().trim();
    }
    return String(apiData.product_name || '').toLowerCase().trim().replace(/\s+/g, '_');
}

function extractPer100g(apiData) {
    if (apiData.per_100g) {
        return {
            calories: toNumber(apiData.per_100g.calories_100g),
            protein: toNumber(apiData.per_100g.protein_100g),
            fat: toNumber(apiData.per_100g.fat_100g),
            carbs: toNumber(apiData.per_100g.carbs_100g),
            sugar: toNumber(apiData.per_100g.sugar_100g),
            sodium: toNumber(apiData.per_100g.sodium_100g),
            netWeight: toNumber(apiData.per_100g.net_weight_g, toNumber(apiData.net_weight_g, 100))
        };
    }

    const netWeight = toNumber(apiData.net_weight_g, 100);
    const nutrition = apiData.nutrition || {};
    const scale = netWeight > 0 ? (100 / netWeight) : 1;

    return {
        calories: toNumber(nutrition.calories) * scale,
        protein: toNumber(nutrition.protein) * scale,
        fat: toNumber(nutrition.fat) * scale,
        carbs: toNumber(nutrition.carbs) * scale,
        sugar: toNumber(nutrition.sugar) * scale,
        sodium: toNumber(nutrition.sodium) * scale,
        netWeight
    };
}

function getQuantityGrams(state) {
    if (state.mode === 'serving') {
        return state.netWeight * state.servings;
    }
    return state.customGrams;
}

function getAdjustedNutrition(per100, quantityGrams) {
    const factor = quantityGrams / 100;
    return {
        calories: per100.calories * factor,
        protein: per100.protein * factor,
        fat: per100.fat * factor,
        carbs: per100.carbs * factor,
        sugar: per100.sugar * factor,
        sodium: per100.sodium * factor
    };
}

function getMacroPercentages(per100) {
    const calories = toNumber(per100.calories);
    if (calories <= 0) {
        return {
            proteinCalPct: 0,
            fatCalPct: 0,
            carbCalPct: 0,
            sugarCalPct: 0
        };
    }

    return {
        proteinCalPct: (toNumber(per100.protein) * 4 / calories) * 100,
        fatCalPct: (toNumber(per100.fat) * 9 / calories) * 100,
        carbCalPct: (toNumber(per100.carbs) * 4 / calories) * 100,
        sugarCalPct: (toNumber(per100.sugar) * 4 / calories) * 100
    };
}

function calculateDynamicHealthScore(per100, foodKey) {
    const macro = getMacroPercentages(per100);
    const isDairy = foodKey === 'amul_milk' || foodKey === 'govind_curd';

    const proteinBonus = Math.min(macro.proteinCalPct / 20, 1.0) * 20;
    let fatPenalty = Math.max((macro.fatCalPct - 35) / 15, 0) * 20;
    let sugarPenalty = Math.max((macro.sugarCalPct - 10) / 15, 0) * 15;
    const sodiumPenalty = Math.min(toNumber(per100.sodium) / 1.0, 1.0) * 15;
    let carbBalance = (1 - Math.abs(macro.carbCalPct - 55) / 45) * 10;

    if (isDairy) {
        fatPenalty = 0;
        sugarPenalty = 0;
        if (macro.carbCalPct < 45) {
            carbBalance = Math.max(carbBalance, 0);
        }
    }

    const rawScore = 50 + proteinBonus - fatPenalty - sugarPenalty - sodiumPenalty + carbBalance;
    const score = Math.round(clamp(rawScore, 0, 100));

    let band = 'Healthy';
    let colorClass = 'status-healthy';
    if (score <= 39) {
        band = 'Unhealthy';
        colorClass = 'status-unhealthy';
    } else if (score <= 69) {
        band = 'Moderate';
        colorClass = 'status-moderate';
    }

    return {
        score,
        band,
        colorClass,
        contributions: {
            proteinBonus,
            fatPenalty,
            sugarPenalty,
            sodiumPenalty,
            carbBalance
        },
        macro
    };
}

function formatContribution(label, value, isPenalty = false) {
    const rounded = Math.round(Math.abs(value));
    if (isPenalty) {
        return `${label} -${rounded}`;
    }
    return `${label} +${rounded}`;
}

function classifyProtein(proteinCalPct, isDairy) {
    if (isDairy) {
        if (proteinCalPct >= 15) {
            return { status: 'Healthy', score: 2, reason: `Protein: ${proteinCalPct.toFixed(1)}% of calories - good for dairy products.` };
        }
        if (proteinCalPct >= 5) {
            return { status: 'Moderate', score: 1, reason: `Protein: ${proteinCalPct.toFixed(1)}% of calories - below dairy healthy target (15%).` };
        }
        return { status: 'Unhealthy', score: 0, reason: `Protein: ${proteinCalPct.toFixed(1)}% of calories - too low.` };
    }

    if (proteinCalPct >= 10) {
        return { status: 'Healthy', score: 2, reason: `Protein: ${proteinCalPct.toFixed(1)}% of calories - meets healthy threshold (>=10%).` };
    }
    if (proteinCalPct >= 5) {
        return { status: 'Moderate', score: 1, reason: `Protein: ${proteinCalPct.toFixed(1)}% of calories - slightly low.` };
    }
    return { status: 'Unhealthy', score: 0, reason: `Protein: ${proteinCalPct.toFixed(1)}% of calories - below 5%.` };
}

function classifyFat(fatCalPct, isDairy) {
    if (isDairy) {
        if (fatCalPct <= 45) {
            return { status: 'Healthy', score: 2, reason: `Fat: ${fatCalPct.toFixed(1)}% of calories - acceptable for dairy.` };
        }
        return { status: 'Moderate', score: 1, reason: `Fat: ${fatCalPct.toFixed(1)}% of calories - above dairy healthy range.` };
    }

    if (fatCalPct <= 35) {
        return { status: 'Healthy', score: 2, reason: `Fat: ${fatCalPct.toFixed(1)}% of calories - within healthy limit (<=35%).` };
    }
    if (fatCalPct <= 45) {
        return { status: 'Moderate', score: 1, reason: `Fat: ${fatCalPct.toFixed(1)}% of calories - slightly above healthy limit.` };
    }
    return { status: 'Unhealthy', score: 0, reason: `Fat: ${fatCalPct.toFixed(1)}% of calories - above 45%.` };
}

function classifyCarbs(carbCalPct) {
    if (carbCalPct > 75) {
        return { status: 'Unhealthy', score: 0, reason: `Carbs: ${carbCalPct.toFixed(1)}% of calories - too high (>75%).` };
    }
    if ((carbCalPct >= 65 && carbCalPct <= 75) || carbCalPct < 45) {
        return { status: 'Moderate', score: 1, reason: `Carbs: ${carbCalPct.toFixed(1)}% of calories - outside ideal 45-65% range.` };
    }
    return { status: 'Healthy', score: 2, reason: `Carbs: ${carbCalPct.toFixed(1)}% of calories - in ideal 45-65% range.` };
}

function classifySugar(sugarCalPct, isDairy) {
    if (isDairy) {
        return { status: 'Healthy', score: 2, reason: 'Natural lactose — not added sugar (dairy exception applied).' };
    }

    if (sugarCalPct > 20) {
        return { status: 'Unhealthy', score: 0, reason: `Sugar: ${sugarCalPct.toFixed(1)}% of calories - above 20%.` };
    }
    if (sugarCalPct >= 10) {
        return { status: 'Moderate', score: 1, reason: `Sugar: ${sugarCalPct.toFixed(1)}% of calories - higher than ideal.` };
    }
    return { status: 'Healthy', score: 2, reason: `Sugar: ${sugarCalPct.toFixed(1)}% of calories - low and healthy.` };
}

function classifySodium(sodiumPer100) {
    if (sodiumPer100 > 0.6) {
        return { status: 'Unhealthy', score: 0, reason: `Sodium: ${sodiumPer100.toFixed(2)} g/100g - above 0.6 g.` };
    }
    if (sodiumPer100 >= 0.3) {
        return { status: 'Moderate', score: 1, reason: `Sodium: ${sodiumPer100.toFixed(2)} g/100g - moderate range.` };
    }
    return { status: 'Healthy', score: 2, reason: `Sodium: ${sodiumPer100.toFixed(2)} g/100g - low and healthy.` };
}

function getStatusClass(status) {
    if (status === 'Healthy') return 'status-healthy';
    if (status === 'Moderate') return 'status-moderate';
    return 'status-unhealthy';
}

function classifyFoodByRules(per100, foodKey) {
    const macro = getMacroPercentages(per100);
    const isDairy = foodKey === 'amul_milk' || foodKey === 'govind_curd';

    const rows = [
        {
            nutrient: 'Protein',
            actual: `${macro.proteinCalPct.toFixed(1)}% calories`,
            ...classifyProtein(macro.proteinCalPct, isDairy)
        },
        {
            nutrient: 'Fat',
            actual: `${macro.fatCalPct.toFixed(1)}% calories`,
            ...classifyFat(macro.fatCalPct, isDairy)
        },
        {
            nutrient: 'Carbs',
            actual: `${macro.carbCalPct.toFixed(1)}% calories`,
            ...classifyCarbs(macro.carbCalPct)
        },
        {
            nutrient: 'Sugar',
            actual: `${macro.sugarCalPct.toFixed(1)}% calories`,
            ...classifySugar(macro.sugarCalPct, isDairy)
        },
        {
            nutrient: 'Sodium',
            actual: `${toNumber(per100.sodium).toFixed(2)} g/100g`,
            ...classifySodium(toNumber(per100.sodium))
        }
    ];

    const totalScore = rows.reduce((sum, row) => sum + row.score, 0);
    let verdict = 'Healthy';
    if (totalScore <= 4) verdict = 'Unhealthy';
    else if (totalScore <= 7) verdict = 'Moderate';

    return {
        rows,
        totalScore,
        verdict,
        verdictClass: getStatusClass(verdict),
        flaggedModerate: rows.filter((r) => r.status === 'Moderate').map((r) => r.nutrient),
        flaggedUnhealthy: rows.filter((r) => r.status === 'Unhealthy').map((r) => r.nutrient)
    };
}

function getRecommendationLines(classification) {
    const lines = [];
    const issueOrder = [...classification.flaggedUnhealthy, ...classification.flaggedModerate];

    const mappedTips = {
        Protein: 'Add a protein-rich side (eggs, milk, curd, pulses) to balance this meal.',
        Fat: 'Pair with low-fat foods and avoid adding extra fried sides.',
        Carbs: 'Combine with fiber/protein foods to reduce blood sugar spikes.',
        Sugar: 'Limit added sweets for the rest of the day and hydrate well.',
        Sodium: 'Reduce salty foods in the next meals and increase water intake.'
    };

    issueOrder.forEach((nutrient) => {
        if (mappedTips[nutrient] && !lines.includes(mappedTips[nutrient])) {
            lines.push(mappedTips[nutrient]);
        }
    });

    if (lines.length === 0) {
        lines.push('This profile is well balanced for most daily diets. Keep portion control and variety.');
        lines.push('Pair with fresh fruits/vegetables to improve micronutrient quality.');
    }

    if (classification.verdict === 'Unhealthy') {
        lines.unshift('Consume occasionally and keep the rest of the day lighter and less processed.');
    }

    return lines;
}

function getDailyStatusClass(pct) {
    if (pct > 100) return 'daily-red';
    if (pct >= 61) return 'daily-orange';
    if (pct >= 31) return 'daily-amber';
    return 'daily-green';
}

function setLowConfidenceMode(isLowConfidence) {
    if (resultsGrid) {
        resultsGrid.style.display = isLowConfidence ? 'none' : 'grid';
    }

    if (recommendationsWideWrap) {
        recommendationsWideWrap.style.display = isLowConfidence ? 'none' : 'block';
    }

    if (chartSection) {
        chartSection.style.display = isLowConfidence ? 'none' : 'block';
    }

    if (lowConfidenceMount) {
        lowConfidenceMount.style.display = isLowConfidence ? 'block' : 'none';
        if (!isLowConfidence) {
            lowConfidenceMount.innerHTML = '';
        }
    }
}

function renderLowConfidenceResult() {
    closeLowConfidenceConfirmation();

    dashboardState = null;

    if (quantityStripSection) {
        quantityStripSection.classList.add('is-hidden');
    }

    if (quantityControlsMount) {
        quantityControlsMount.innerHTML = '<p class="placeholder-text">Quantity controls will appear after analysis.</p>';
    }

    if (dailyIntakePanel) {
        dailyIntakePanel.innerHTML = '<p class="placeholder-text">WHO 2000 kcal/day tracker appears after analysis.</p>';
    }

    if (recommendationsPanel) {
        recommendationsPanel.innerHTML = '<p class="placeholder-text">Upload a label to get personalized recommendations.</p>';
    }

    setLowConfidenceMode(true);

    if (lowConfidenceMount) {
        lowConfidenceMount.innerHTML = `
            <div class="low-confidence-card">
                <div class="low-confidence-icon" aria-hidden="true">🔍</div>
                <h3 class="low-confidence-title">We couldn't identify this product</h3>
                <p class="low-confidence-subtext">
                    This item doesn't match any of our supported products. We currently provide analysis for
                    the following 7 items:
                </p>

                <div class="low-confidence-pills" aria-label="Supported products">
                    <span class="low-confidence-pill">Parle G</span>
                    <span class="low-confidence-pill">Amul Milk</span>
                    <span class="low-confidence-pill">Kit Kat</span>
                    <span class="low-confidence-pill">Lays Chips</span>
                    <span class="low-confidence-pill">Govind Curd</span>
                    <span class="low-confidence-pill">Oreo</span>
                    <span class="low-confidence-pill">Maggie</span>
                </div>

                <p class="low-confidence-closing">
                    We're continuously working to expand our database.
                    More products coming soon!
                </p>

                <div class="low-confidence-divider" aria-hidden="true"></div>

                <button type="button" id="lowConfidenceRetryBtn" class="scan-another-btn low-confidence-retry-btn">
                    ↺ Try a Supported Item
                </button>
            </div>
        `;

        const retryBtn = document.getElementById('lowConfidenceRetryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', triggerUploadFileFlow);
        }
    }

    setUploadState('result');

    if (resultsSection) {
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 200);
    }
}

function renderDailyIntake(adjustedNutrition) {
    const log = getDailyLog();

    const rows = Object.keys(DAILY_LIMITS).map((key) => {
        const conf = DAILY_LIMITS[key];
        const priorValue = toNumber(log.totals[key]);
        const currentItemValue = toNumber(adjustedNutrition[key]);

        let currentBarValue = currentItemValue;
        let currentMetaValue = currentItemValue;

        if (dashboardState && dashboardState.consumeDecision === 'yes') {
            currentBarValue = 0;
            currentMetaValue = toNumber(dashboardState.confirmedNutrients && dashboardState.confirmedNutrients[key], 0);
        } else if (dashboardState && dashboardState.consumeDecision === 'no') {
            currentBarValue = 0;
            currentMetaValue = 0;
        }

        const combinedValue = priorValue + currentBarValue;
        const combinedPctRaw = conf.limit > 0 ? (combinedValue / conf.limit) * 100 : 0;
        const priorPct = conf.limit > 0 ? clamp((priorValue / conf.limit) * 100, 0, 100) : 0;
        const combinedPctCapped = conf.limit > 0 ? clamp((combinedValue / conf.limit) * 100, 0, 100) : 0;
        const currentPct = Math.max(combinedPctCapped - priorPct, 0);
        const statusClass = getDailyStatusClass(combinedPctRaw);
        const exceedsLabel = combinedPctRaw > 100 ? '<span class="daily-exceeds">Exceeds daily limit</span>' : '';

        return `
            <div class="daily-row">
                <div class="daily-header">
                    <span class="daily-name">${conf.label}</span>
                    <span class="daily-pct ${statusClass}">${combinedPctRaw.toFixed(1)}%</span>
                </div>
                <div class="daily-bar-track">
                    <div class="daily-bar-segments">
                        <div class="daily-bar-fill daily-bar-prior" style="width:${priorPct}%;"></div>
                        <div class="daily-bar-fill daily-bar-current" style="width:${currentPct}%;"></div>
                    </div>
                </div>
                <div class="daily-meta">
                    ${combinedValue.toFixed(2)} ${conf.unit} today (${currentMetaValue.toFixed(2)} ${conf.unit} from this item) out of ${conf.limit} ${conf.unit} daily limit ${exceedsLabel}
                </div>
            </div>
        `;
    }).join('');

    return {
        rows,
        itemCount: log.items.length
    };
}

function normalizeVerdictLabel(verdict) {
    const value = String(verdict || '').toLowerCase();
    if (value.includes('unhealthy')) return 'Unhealthy';
    if (value.includes('healthy')) return 'Healthy';
    if (value.includes('moderate')) return 'Moderate';
    return 'Moderate';
}

function formatFoodName(foodName) {
    const base = String(foodName || 'Unknown Food').replace(/_/g, ' ').trim();
    return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLoggedTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getPer100FromHistoryItem(item) {
    if (item && item.per_100g) {
        return {
            calories: toNumber(item.per_100g.calories),
            protein: toNumber(item.per_100g.protein),
            fat: toNumber(item.per_100g.fat),
            carbs: toNumber(item.per_100g.carbs),
            sugar: toNumber(item.per_100g.sugar),
            sodium: toNumber(item.per_100g.sodium)
        };
    }

    const quantityGrams = Math.max(toNumber(item && item.quantity_g, 0), 1);
    const factor = quantityGrams / 100;
    const nutrients = normalizeNutrients(item && item.nutrients);

    return {
        calories: nutrients.calories / factor,
        protein: nutrients.protein / factor,
        fat: nutrients.fat / factor,
        carbs: nutrients.carbs / factor,
        sugar: nutrients.sugar / factor,
        sodium: nutrients.sodium / factor
    };
}

function initHistoryDetailChart(item) {
    if (!historyDetailChartCanvas || typeof Chart === 'undefined') return;

    const ctx = historyDetailChartCanvas.getContext('2d');
    if (!ctx) return;

    if (historyDetailChart) {
        historyDetailChart.destroy();
    }

    const nutrients = normalizeNutrients(item && item.nutrients);
    const per100 = getPer100FromHistoryItem(item);
    const quantityGrams = Math.max(toNumber(item && item.quantity_g, 0), 1);
    const quantityFactor = quantityGrams / 100;
    const foodKey = String(item && (item.food_key || item.food_name) || '').toLowerCase();
    const isDairy = foodKey === 'amul_milk' || foodKey === 'govind_curd';

    const thresholdPer100 = {
        protein: (toNumber(per100.calories) * 0.10) / 4,
        fat: (toNumber(per100.calories) * (isDairy ? 0.45 : 0.35)) / 9,
        carbs: (toNumber(per100.calories) * 0.65) / 4,
        sugar: isDairy ? toNumber(per100.sugar) : (toNumber(per100.calories) * 0.10) / 4,
        sodium: 0.3
    };

    const labels = ['Protein', 'Fat', 'Carbs', 'Sugar', 'Sodium'];
    const actualData = [nutrients.protein, nutrients.fat, nutrients.carbs, nutrients.sugar, nutrients.sodium];
    const thresholdData = [
        thresholdPer100.protein * quantityFactor,
        thresholdPer100.fat * quantityFactor,
        thresholdPer100.carbs * quantityFactor,
        thresholdPer100.sugar * quantityFactor,
        thresholdPer100.sodium * quantityFactor
    ];

    historyDetailChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: '#2f7f5f',
                    borderColor: '#2f7f5f',
                    borderWidth: 1,
                    borderRadius: 8,
                    maxBarThickness: 28
                },
                {
                    label: 'Healthy limit',
                    data: thresholdData,
                    backgroundColor: '#b8c4b6',
                    borderColor: '#a5b1a3',
                    borderWidth: 1,
                    borderRadius: 8,
                    maxBarThickness: 28
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#2d3d2f',
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} g`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#5a6b5c' },
                    grid: { color: 'rgba(90, 107, 92, 0.18)' }
                },
                x: {
                    ticks: {
                        color: '#2d3d2f',
                        font: { weight: '600' }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderHistoryDetailModal(item) {
    if (!historyModalTitle || !historyModalSubtitle || !historyModalBody) return;

    const readableName = item.product_name || formatFoodName(item.food_name);
    const verdictLabel = normalizeVerdictLabel(item.classification && item.classification.verdict ? item.classification.verdict : item.verdict);
    const verdictClass = getStatusClass(verdictLabel);
    const classScore = toNumber(item.classification && item.classification.totalScore, 0);
    const nutrients = normalizeNutrients(item.nutrients);
    const confidence = toNumber(item.confidence, 0);
    const score = toNumber(item.score, 0);
    const scoreBreakdown = String(item.score_breakdown || '-');
    const rows = Array.isArray(item.classification && item.classification.rows) ? item.classification.rows : [];
    const recommendations = Array.isArray(item.recommendations) ? item.recommendations : [];

    historyModalTitle.textContent = `${readableName} — Detailed Analysis`;
    historyModalSubtitle.textContent = `${toNumber(item.quantity_g, 0).toFixed(0)}g · Logged at ${formatLoggedTime(item.timestamp)} · ${verdictLabel} (${classScore}/10)`;

    historyModalBody.innerHTML = `
        <div class="history-detail-card">
            <h5>Nutrition Info</h5>
            <div class="nutrition-container">
                <h4>${readableName}</h4>
                <p><strong>Confidence:</strong> ${confidence.toFixed(2)}%</p>
                <div class="score-badge ${score <= 39 ? 'status-unhealthy' : score <= 69 ? 'status-moderate' : 'status-healthy'}">
                    <div class="score-title">Health Score (Formula-based)</div>
                    <div class="score-value">${score} <span class="score-band">/100</span></div>
                    <div class="score-breakdown">${scoreBreakdown}</div>
                </div>
                <div class="verdict-badge ${verdictClass}">${verdictLabel}</div>
                <div class="nutrition-grid">
                    <div class="nutrition-item"><span class="label">Calories</span><span class="value">${nutrients.calories.toFixed(2)} kcal</span></div>
                    <div class="nutrition-item"><span class="label">Protein</span><span class="value">${nutrients.protein.toFixed(2)} g</span></div>
                    <div class="nutrition-item"><span class="label">Fat</span><span class="value">${nutrients.fat.toFixed(2)} g</span></div>
                    <div class="nutrition-item"><span class="label">Carbs</span><span class="value">${nutrients.carbs.toFixed(2)} g</span></div>
                    <div class="nutrition-item"><span class="label">Sugar</span><span class="value">${nutrients.sugar.toFixed(2)} g</span></div>
                    <div class="nutrition-item"><span class="label">Sodium</span><span class="value">${nutrients.sodium.toFixed(2)} g</span></div>
                </div>
            </div>
        </div>

        <div class="history-detail-card">
            <h5>Dietary Analysis</h5>
            <div class="recommendation-container">
                <h4>Health Classification (ICMR/WHO Rules) <span class="status-chip">${classScore} / 10</span></h4>
                <div class="verdict-badge ${verdictClass}">${verdictLabel}</div>
                <div class="nutrient-rule-table-wrap">
                    <table class="nutrient-rule-table">
                        <thead>
                            <tr>
                                <th>Nutrient</th>
                                <th>Actual</th>
                                <th>Status</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row) => `
                                <tr>
                                    <td>${row.nutrient}</td>
                                    <td>${row.actual}</td>
                                    <td><span class="status-chip ${getStatusClass(row.status)}">${row.status}</span></td>
                                    <td>${row.reason}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <ul class="recommendation-list" style="margin-top:10px;">
                    ${recommendations.map((line) => `<li>${line}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    initHistoryDetailChart(item);
}

function closeHistoryModal() {
    if (historyModalOverlay) {
        historyModalOverlay.classList.remove('open');
    }
}

function openHistoryModalByIndex(index) {
    const log = getDailyLog();
    const item = log.items[index];
    if (!item) return;

    renderHistoryDetailModal(item);
    if (historyModalOverlay) {
        historyModalOverlay.classList.add('open');
    }
}

function renderHistoryDrawer() {
    if (!historyDrawerSubtitle || !historySummary || !historyItemList) return;

    const log = getDailyLog();
    const count = log.items.length;
    historyDrawerSubtitle.textContent = `${count} ${count === 1 ? 'item' : 'items'} confirmed`;

    if (count === 0) {
        historySummary.innerHTML = '<div class="history-summary-empty">No items confirmed yet. Scan a food item and tap \"Yes, I ate this\" to start tracking.</div>';
        historyItemList.innerHTML = '<div class="history-item-empty">No history to display yet.</div>';
        return;
    }

    historySummary.innerHTML = `
        <div class="history-summary-grid">
            <div class="history-summary-tile">
                <div class="label">Calories</div>
                <div class="value">${toNumber(log.totals.calories).toFixed(1)} kcal</div>
            </div>
            <div class="history-summary-tile">
                <div class="label">Protein</div>
                <div class="value">${toNumber(log.totals.protein).toFixed(1)} g</div>
            </div>
            <div class="history-summary-tile">
                <div class="label">Fat</div>
                <div class="value">${toNumber(log.totals.fat).toFixed(1)} g</div>
            </div>
        </div>
    `;

    historyItemList.innerHTML = log.items.slice().reverse().map((item, reversedIndex) => {
        const index = log.items.length - 1 - reversedIndex;
        const readableName = item.product_name || formatFoodName(item.food_name);
        const verdictLabel = normalizeVerdictLabel(item.classification && item.classification.verdict ? item.classification.verdict : item.verdict);
        const verdictClass = getStatusClass(verdictLabel);
        const nutrients = normalizeNutrients(item.nutrients);

        const thumbHtml = item.thumbnail
            ? `<img class="history-thumb" src="${item.thumbnail}" alt="${readableName} thumbnail">`
            : '<div class="history-thumb history-thumb-placeholder"></div>';

        return `
            <div class="history-item-card" data-history-index="${index}">
                ${thumbHtml}
                <div class="history-item-meta">
                    <div class="history-item-row-top">
                        <div class="history-item-name">${readableName}</div>
                        <span class="status-chip ${verdictClass}">${verdictLabel}</span>
                    </div>
                    <div class="history-item-time">${toNumber(item.quantity_g, 0).toFixed(0)}g · logged at ${formatLoggedTime(item.timestamp)}</div>
                    <div class="history-item-nutrients">Calories ${nutrients.calories.toFixed(1)}kcal · Fat ${nutrients.fat.toFixed(2)}g · Sodium ${nutrients.sodium.toFixed(2)}g</div>
                    <div class="history-item-link">View detailed analysis →</div>
                </div>
            </div>
        `;
    }).join('');
}

function openHistoryDrawer() {
    if (!historyOverlay || !historyDrawer) return;
    updateHistoryButtonCount();
    renderHistoryDrawer();
    historyOverlay.classList.add('open');
    historyDrawer.classList.add('open');
}

function closeHistoryDrawer() {
    if (historyOverlay) historyOverlay.classList.remove('open');
    if (historyDrawer) historyDrawer.classList.remove('open');
    closeHistoryModal();
}

if (historyDrawerClose) {
    historyDrawerClose.addEventListener('click', closeHistoryDrawer);
}

if (historyOverlay) {
    historyOverlay.addEventListener('click', (event) => {
        if (event.target === historyOverlay) {
            closeHistoryDrawer();
        }
    });
}

if (historyItemList) {
    historyItemList.addEventListener('click', (event) => {
        const card = event.target.closest('[data-history-index]');
        if (!card) return;
        openHistoryModalByIndex(Number(card.getAttribute('data-history-index')));
    });
}

if (historyModalClose) {
    historyModalClose.addEventListener('click', closeHistoryModal);
}

if (historyModalOverlay) {
    historyModalOverlay.addEventListener('click', (event) => {
        if (event.target === historyModalOverlay) {
            closeHistoryModal();
        }
    });
}

function initChart(nutrition, per100, quantityGrams, foodKey) {
    const canvas = document.getElementById('nutritionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (nutritionChart) {
        nutritionChart.destroy();
    }

    const isDairy = foodKey === 'amul_milk' || foodKey === 'govind_curd';
    const quantityFactor = quantityGrams / 100;
    const caloriesPer100 = toNumber(per100.calories);

    const thresholdPer100 = {
        protein: (caloriesPer100 * 0.10) / 4,
        fat: (caloriesPer100 * (isDairy ? 0.45 : 0.35)) / 9,
        carbs: (caloriesPer100 * 0.65) / 4,
        sugar: isDairy ? toNumber(per100.sugar) : (caloriesPer100 * 0.10) / 4,
        sodium: 0.3
    };

    const labels = ['Protein', 'Fat', 'Carbs', 'Sugar', 'Sodium'];
    const nutrientKeys = ['protein', 'fat', 'carbs', 'sugar', 'sodium'];
    const actualData = [nutrition.protein, nutrition.fat, nutrition.carbs, nutrition.sugar, nutrition.sodium];
    const thresholdData = [
        thresholdPer100.protein * quantityFactor,
        thresholdPer100.fat * quantityFactor,
        thresholdPer100.carbs * quantityFactor,
        thresholdPer100.sugar * quantityFactor,
        thresholdPer100.sodium * quantityFactor
    ];

    const actualColors = actualData.map((value, idx) => {
        const threshold = thresholdData[idx];
        const nutrient = nutrientKeys[idx];
        const tolerance = threshold * 0.15;
        const lowerBound = threshold - tolerance;
        const upperBound = threshold + tolerance;

        const isWithinHealthyRange = nutrient === 'protein'
            ? value >= lowerBound
            : value >= lowerBound && value <= upperBound;

        return isWithinHealthyRange ? '#2f7f5f' : '#c24732';
    });

    const actualValueLabelPlugin = {
        id: 'actualValueLabelPlugin',
        afterDatasetsDraw(chart) {
            const datasetIndex = 0;
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta || !meta.data) return;

            const chartCtx = chart.ctx;
            chartCtx.save();
            chartCtx.font = '600 11px "Plus Jakarta Sans"';
            chartCtx.fillStyle = '#1f2f22';
            chartCtx.textAlign = 'center';
            chartCtx.textBaseline = 'bottom';

            meta.data.forEach((bar, index) => {
                const value = actualData[index];
                chartCtx.fillText(`${value.toFixed(2)}g`, bar.x, bar.y - 4);
            });

            chartCtx.restore();
        }
    };

    nutritionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: actualColors,
                    borderColor: actualColors,
                    borderWidth: 1,
                    borderRadius: 8,
                    maxBarThickness: 28
                },
                {
                    label: 'Healthy limit',
                    data: thresholdData,
                    backgroundColor: '#b8c4b6',
                    borderColor: '#a5b1a3',
                    borderWidth: 1,
                    borderRadius: 8,
                    maxBarThickness: 28
                }
            ]
        },
        plugins: [actualValueLabelPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        generateLabels(chart) {
                            const hasOutOfRange = actualColors.some((color) => color === '#c24732');
                            const actualLegendColor = hasOutOfRange ? '#c24732' : '#2f7f5f';

                            return [
                                {
                                    text: 'Actual',
                                    fillStyle: actualLegendColor,
                                    strokeStyle: actualLegendColor,
                                    lineWidth: 1,
                                    hidden: !chart.isDatasetVisible(0),
                                    datasetIndex: 0
                                },
                                {
                                    text: 'Healthy limit',
                                    fillStyle: '#b8c4b6',
                                    strokeStyle: '#a5b1a3',
                                    lineWidth: 1,
                                    hidden: !chart.isDatasetVisible(1),
                                    datasetIndex: 1
                                }
                            ];
                        },
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 12,
                            weight: '600'
                        },
                        color: '#2d3d2f'
                    }
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} g`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'grams (g)',
                        color: '#39533c',
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 12,
                            weight: '600'
                        }
                    },
                    ticks: {
                        color: '#5a6b5c'
                    },
                    grid: {
                        color: 'rgba(90, 107, 92, 0.18)'
                    }
                },
                x: {
                    ticks: {
                        color: '#2d3d2f',
                        font: { weight: '600' }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function bindQuantityEvents() {
    const servingModeBtn = document.getElementById('modeServingBtn');
    const customModeBtn = document.getElementById('modeCustomBtn');
    const minusServingBtn = document.getElementById('servingMinusBtn');
    const plusServingBtn = document.getElementById('servingPlusBtn');
    const customGramInput = document.getElementById('customGramInput');

    if (servingModeBtn) {
        servingModeBtn.addEventListener('click', () => {
            dashboardState.mode = 'serving';
            updateDashboard();
        });
    }

    if (customModeBtn) {
        customModeBtn.addEventListener('click', () => {
            dashboardState.mode = 'custom';
            updateDashboard();
        });
    }

    if (minusServingBtn) {
        minusServingBtn.addEventListener('click', () => {
            dashboardState.servings = Math.max(1, dashboardState.servings - 1);
            updateDashboard();
        });
    }

    if (plusServingBtn) {
        plusServingBtn.addEventListener('click', () => {
            dashboardState.servings += 1;
            updateDashboard();
        });
    }

    if (customGramInput) {
        customGramInput.addEventListener('input', () => {
            dashboardState.customGrams = Math.max(0, toNumber(customGramInput.value, dashboardState.netWeight));
            updateDashboard();
        });
    }
}

function bindHistoryButtonEvents() {
    const historyButton = document.getElementById('btn-history');
    if (!historyButton) return;

    historyButton.addEventListener('click', openHistoryDrawer);
    updateHistoryButtonCount();
}

function updateDashboard() {
    if (!dashboardState) return;

    const quantityGrams = getQuantityGrams(dashboardState);
    const adjusted = getAdjustedNutrition(dashboardState.per100, quantityGrams);
    const scoreResult = calculateDynamicHealthScore(dashboardState.per100, dashboardState.foodKey);
    const classification = classifyFoodByRules(dashboardState.per100, dashboardState.foodKey);
    const recommendationLines = getRecommendationLines(classification);

    const servingModeBtn = document.getElementById('modeServingBtn');
    const customModeBtn = document.getElementById('modeCustomBtn');
    const servingControls = document.getElementById('servingControls');
    const customControls = document.getElementById('customControls');
    const servingCount = document.getElementById('servingCount');
    const customGramInput = document.getElementById('customGramInput');
    const quantityNote = document.getElementById('quantityNote');

    if (servingModeBtn && customModeBtn) {
        servingModeBtn.classList.toggle('active', dashboardState.mode === 'serving');
        customModeBtn.classList.toggle('active', dashboardState.mode === 'custom');
    }

    if (servingControls && customControls) {
        servingControls.style.display = dashboardState.mode === 'serving' ? 'flex' : 'none';
        customControls.style.display = dashboardState.mode === 'custom' ? 'block' : 'none';
    }

    if (servingCount) {
        servingCount.textContent = String(dashboardState.servings);
    }

    if (customGramInput) {
        customGramInput.value = String(Math.round(dashboardState.customGrams));
    }

    if (quantityNote) {
        quantityNote.textContent = `Calculated for ${quantityGrams.toFixed(1)} g`;
    }

    const servingSummaryText = document.getElementById('servingSummaryText');
    if (servingSummaryText) {
        servingSummaryText.textContent = `${quantityGrams.toFixed(1)}g serving`;
    }

    const nutrientValueMap = {
        caloriesValue: `${adjusted.calories.toFixed(2)} kcal`,
        proteinValue: `${adjusted.protein.toFixed(2)} g`,
        fatValue: `${adjusted.fat.toFixed(2)} g`,
        carbsValue: `${adjusted.carbs.toFixed(2)} g`,
        sugarValue: `${adjusted.sugar.toFixed(2)} g`,
        sodiumValue: `${adjusted.sodium.toFixed(2)} g`
    };

    Object.keys(nutrientValueMap).forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = nutrientValueMap[id];
        }
    });

    const scoreValue = document.getElementById('dynamicScoreValue');
    const scoreBand = document.getElementById('dynamicScoreBand');
    const scoreBadge = document.getElementById('dynamicScoreBadge');
    const scoreBreakdown = document.getElementById('dynamicScoreBreakdown');

    const scoreBreakdownText = [
        formatContribution('Protein', scoreResult.contributions.proteinBonus, false),
        formatContribution('Fat', scoreResult.contributions.fatPenalty, true),
        formatContribution('Sugar', scoreResult.contributions.sugarPenalty, true),
        formatContribution('Sodium', scoreResult.contributions.sodiumPenalty, true),
        formatContribution('Carbs', scoreResult.contributions.carbBalance, false)
    ].join(' · ');

    dashboardState.latestAdjustedNutrition = normalizeNutrients(adjusted);
    dashboardState.latestScore = scoreResult.score;
    dashboardState.latestScoreBreakdown = scoreBreakdownText;
    dashboardState.latestClassification = deepClone(classification);
    dashboardState.latestRecommendations = deepClone(recommendationLines);
    updateHistoryButtonCount();

    if (scoreValue) scoreValue.textContent = `${scoreResult.score} / 100`;
    if (scoreBand) scoreBand.textContent = scoreResult.band;
    if (scoreBadge) {
        scoreBadge.className = `score-badge ${scoreResult.colorClass}`;
    }
    if (scoreBreakdown) {
        scoreBreakdown.textContent = scoreBreakdownText;
    }

    const verdictBadge = document.getElementById('verdictBadge');
    const dairyExceptionNote = document.getElementById('dairyExceptionNote');
    if (verdictBadge) {
        verdictBadge.className = `verdict-badge ${classification.verdictClass}`;
        verdictBadge.textContent = `${classification.verdict}`;
    }

    const classificationScoreChip = document.getElementById('classificationScoreChip');
    if (classificationScoreChip) {
        classificationScoreChip.textContent = `${classification.totalScore} / 10`;
    }
    if (dairyExceptionNote) {
        const isDairy = dashboardState.foodKey === 'amul_milk' || dashboardState.foodKey === 'govind_curd';
        dairyExceptionNote.style.display = isDairy ? 'block' : 'none';
    }

    const nutrientTableBody = document.getElementById('nutrientRuleRows');
    if (nutrientTableBody) {
        nutrientTableBody.innerHTML = classification.rows.map((row) => `
            <tr>
                <td>${row.nutrient}</td>
                <td>${row.actual}</td>
                <td><span class="status-chip ${getStatusClass(row.status)}">${row.status}</span></td>
                <td>${row.reason}</td>
            </tr>
        `).join('');
    }

    const recommendationList = document.getElementById('dynamicRecommendations');
    if (recommendationList) {
        recommendationList.innerHTML = recommendationLines.map((line) => `<li>${line}</li>`).join('');
    }

    const dailyIntakeRows = document.getElementById('dailyIntakeRows');
    const dailyIntakeSubtitle = document.getElementById('dailyIntakeSubtitle');
    const dailyView = renderDailyIntake(adjusted);

    if (dailyIntakeRows) {
        dailyIntakeRows.innerHTML = dailyView.rows;
    }
    if (dailyIntakeSubtitle) {
        dailyIntakeSubtitle.textContent = getDailySubtitle(dailyView.itemCount);
    }

    initChart(adjusted, dashboardState.per100, quantityGrams, dashboardState.foodKey);
}

function displayResults(data, options = {}) {
    closeLowConfidenceConfirmation();
    clearPendingLowConfidenceData();

    setLowConfidenceMode(false);

    const per100 = extractPer100g(data);
    const foodKey = normalizeFoodKey(data);
    const netWeight = Math.max(1, toNumber(data.net_weight_g, per100.netWeight || 100));

    dashboardState = {
        mode: 'serving',
        servings: 1,
        customGrams: netWeight,
        netWeight,
        per100,
        foodKey,
        productName: data.product_name || 'Unknown food',
        confidence: toNumber(data.confidence),
        consumeDecision: 'pending',
        confirmedNutrients: null
    };

    if (quantityControlsMount) {
        quantityControlsMount.innerHTML = `
            <div class="quantity-block">
                <h5>Quantity</h5>
                <div class="mode-toggle">
                    <button id="modeServingBtn" class="mode-btn active" type="button">Per Serving</button>
                    <button id="modeCustomBtn" class="mode-btn" type="button">Custom (grams)</button>
                </div>

                <div id="servingControls" class="serving-controls">
                    <div class="serving-readonly">1 serving = ${dashboardState.netWeight.toFixed(0)} g</div>
                    <div class="serving-stepper">
                        <button id="servingMinusBtn" type="button">-</button>
                        <span id="servingCount">1</span>
                        <button id="servingPlusBtn" type="button">+</button>
                    </div>
                </div>

                <div id="customControls" class="custom-controls" style="display:none;">
                    <label for="customGramInput">Custom grams:</label>
                    <input id="customGramInput" type="number" min="1" step="1" value="${dashboardState.netWeight.toFixed(0)}">
                </div>

                <p id="quantityNote" class="quantity-note">Calculated for ${dashboardState.netWeight.toFixed(1)} g</p>
                <button type="button" id="btn-history" class="history-trigger-btn is-empty">
                    <span class="history-icon" aria-hidden="true">🕐</span>
                    <span id="btn-history-label">History (0)</span>
                </button>
            </div>
        `;
    }

    if (quantityStripSection) {
        quantityStripSection.classList.remove('is-hidden');
    }

    const modelSuggestedConfidence = toNumber(options.modelConfidencePct, dashboardState.confidence);
    const confidenceLine = options.isUserConfirmed
        ? `<span class="user-confirmed-label">User confirmed</span> · Model suggested <span class="user-confirmed-model-pct">${modelSuggestedConfidence.toFixed(2)}%</span> | <span id="servingSummaryText">${dashboardState.netWeight.toFixed(1)}g serving</span>`
        : `<strong>Confidence:</strong> ${dashboardState.confidence.toFixed(2)}% | <span id="servingSummaryText">${dashboardState.netWeight.toFixed(1)}g serving</span>`;

    nutritionResult.innerHTML = `
        <div class="nutrition-container">
            <h4>${dashboardState.productName}</h4>
            <p>${confidenceLine}</p>

            <div id="dynamicScoreBadge" class="score-badge status-moderate">
                <div class="score-title">Health Score (Formula-based)</div>
                <div id="dynamicScoreValue" class="score-value">-</div>
                <div id="dynamicScoreBand" class="score-band">-</div>
                <div id="dynamicScoreBreakdown" class="score-breakdown"></div>
            </div>

            <div class="nutrition-grid">
                <div class="nutrition-item"><span class="label">Calories</span><span class="value" id="caloriesValue">-</span></div>
                <div class="nutrition-item"><span class="label">Protein</span><span class="value" id="proteinValue">-</span></div>
                <div class="nutrition-item"><span class="label">Fat</span><span class="value" id="fatValue">-</span></div>
                <div class="nutrition-item"><span class="label">Carbs</span><span class="value" id="carbsValue">-</span></div>
                <div class="nutrition-item"><span class="label">Sugar</span><span class="value" id="sugarValue">-</span></div>
                <div class="nutrition-item"><span class="label">Sodium</span><span class="value" id="sodiumValue">-</span></div>
            </div>

            <div class="consume-widget" id="consumeWidget">
                <div class="consume-label">Did you consume this item?</div>
                <div class="consume-actions" id="consumeActionRow">
                    <button type="button" class="consume-btn consume-btn-yes" id="consumeYesBtn">✓ Yes, I ate this</button>
                    <button type="button" class="consume-btn consume-btn-no" id="consumeNoBtn">✗ No, skip</button>
                </div>
                <div class="consume-status" id="consumeStatusText" style="display:none;"></div>
            </div>
        </div>
    `;

    if (dailyIntakePanel) {
        dailyIntakePanel.innerHTML = `
            <div class="daily-intake-block">
                <h5 id="dailyIntakeSubtitle">WHO 2000 kcal / day</h5>
                <div id="dailyIntakeRows"></div>
                <p class="daily-footnote">Based on a 2000 kcal/day diet as recommended by WHO. Individual needs may vary.</p>
            </div>
        `;
    }

    recommendations.innerHTML = `
        <div class="recommendation-container verdict-moderate">
            <h4>Health Classification (ICMR/WHO Rules) <span id="classificationScoreChip" class="status-chip">- / 10</span></h4>
            <div id="verdictBadge" class="verdict-badge status-moderate">Moderate</div>
            <div id="dairyExceptionNote" class="dairy-exception-note" style="display:none;">Dairy exception applied — natural lactose & fat excluded from penalty (ICMR guidelines).</div>

            <div class="nutrient-rule-table-wrap">
                <table class="nutrient-rule-table">
                    <thead>
                        <tr>
                            <th>Nutrient</th>
                            <th>Actual</th>
                            <th>Status</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody id="nutrientRuleRows"></tbody>
                </table>
            </div>
        </div>
    `;

    if (recommendationsPanel) {
        recommendationsPanel.innerHTML = `
            <div class="recommendation-panel">
                <ul id="dynamicRecommendations" class="recommendation-list"></ul>
            </div>
        `;
    }

    bindQuantityEvents();
    bindHistoryButtonEvents();
    bindConsumptionEvents();
    updateDashboard();
    setUploadState('result');

    if (resultsSection) {
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 200);
    }
}

function showLoading() {
    closeLowConfidenceConfirmation();

    setLowConfidenceMode(false);

    if (quantityStripSection) {
        quantityStripSection.classList.add('is-hidden');
    }
    if (quantityControlsMount) {
        quantityControlsMount.innerHTML = '<p class="placeholder-text">Analyzing label...</p>';
    }
    if (dailyIntakePanel) {
        dailyIntakePanel.innerHTML = '<p class="placeholder-text">Preparing daily intake tracker...</p>';
    }
    if (recommendationsPanel) {
        recommendationsPanel.innerHTML = '<p class="placeholder-text">Preparing personalized recommendations...</p>';
    }

    nutritionResult.innerHTML = '<div class="loading"><h4>Analyzing your image...</h4><p>Please wait while we process your food label.</p></div>';
    recommendations.innerHTML = '<div class="loading">Preparing result dashboard...</div>';
}

function showError(message) {
    closeLowConfidenceConfirmation();

    setLowConfidenceMode(false);

    if (quantityStripSection) {
        quantityStripSection.classList.add('is-hidden');
    }
    if (dailyIntakePanel) {
        dailyIntakePanel.innerHTML = '<p class="placeholder-text">WHO 2000 kcal/day tracker appears after analysis.</p>';
    }
    if (recommendationsPanel) {
        recommendationsPanel.innerHTML = '<p class="placeholder-text">Recommendations appear after successful analysis.</p>';
    }

    nutritionResult.innerHTML = `<div class="error"><h4>Error</h4><p>${message}</p></div>`;
    recommendations.innerHTML = '';
}
