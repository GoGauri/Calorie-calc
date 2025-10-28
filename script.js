(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const KCAL_TO_KJ = 4.184;

  // TDEE Calculator (Mifflin–St Jeor)
  const tdeeForm = $('#tdee-form');
  const tdeeResults = $('#tdee-results');
  const tdeeResetBtn = $('#tdee-reset');

  function parseNumber(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return null;
    const value = parseFloat(el.value);
    return Number.isFinite(value) ? value : null;
  }

  function round(n, d = 0) {
    const p = Math.pow(10, d);
    return Math.round((n + Number.EPSILON) * p) / p;
  }

  function computeBmr(sex, weightKg, heightCm, ageYears) {
    // Mifflin–St Jeor BMR
    // male: 10w + 6.25h − 5a + 5
    // female: 10w + 6.25h − 5a − 161
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    return sex === 'male' ? base + 5 : base - 161;
  }

  function tdeeOutputs(bmr, activity) {
    const tdee = bmr * activity;
    return {
      bmr,
      tdee,
      lose250: tdee - 250,
      lose500: tdee - 500,
      gain250: tdee + 250,
      gain500: tdee + 500,
    };
  }

  function renderTdee(results) {
    const { bmr, tdee, lose250, lose500, gain250, gain500 } = results;
    tdeeResults.classList.remove('hidden');
    tdeeResults.innerHTML = `
      <div><strong>BMR:</strong> ${round(bmr)} kcal/day</div>
      <div><strong>TDEE (maintain):</strong> ${round(tdee)} kcal/day</div>
      <div style="margin-top:8px"><strong>Targets:</strong></div>
      <ul class="guidelines">
        <li>Lose slow: ${round(lose250)} kcal/day (~0.25 kg/week)</li>
        <li>Lose moderate: ${round(lose500)} kcal/day (~0.5 kg/week)</li>
        <li>Gain slow: ${round(gain250)} kcal/day (~0.25 kg/week)</li>
        <li>Gain moderate: ${round(gain500)} kcal/day (~0.5 kg/week)</li>
      </ul>
    `;
  }

  tdeeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const sex = $('#sex').value;
    const age = parseNumber('age');
    const heightCm = parseNumber('heightCm');
    const weightKg = parseNumber('weightKg');
    const activity = parseFloat($('#activity').value);

    if ([age, heightCm, weightKg].some((v) => !Number.isFinite(v))) {
      tdeeResults.classList.remove('hidden');
      tdeeResults.textContent = 'Please fill in valid numbers for age, height, and weight.';
      return;
    }

    const bmr = computeBmr(sex, weightKg, heightCm, age);
    const outputs = tdeeOutputs(bmr, activity);
    renderTdee(outputs);
  });

  tdeeResetBtn?.addEventListener('click', () => {
    tdeeForm.reset();
    tdeeResults.classList.add('hidden');
    tdeeResults.textContent = '';
  });

  // Food Tracker
  const foodForm = $('#food-form');
  const foodTbody = $('#food-tbody');
  const totalKcalEl = $('#total-kcal');
  const totalKjEl = $('#total-kj');
  const clearTrackerBtn = $('#clear-tracker');

  let foodItems = [];

  function kcalToKj(kcal) { return kcal * KCAL_TO_KJ; }
  function kjToKcal(kj) { return kj / KCAL_TO_KJ; }

  function updateTotals() {
    const totalKcal = foodItems.reduce((sum, it) => sum + it.kcal, 0);
    const totalKj = kcalToKj(totalKcal);
    totalKcalEl.textContent = String(round(totalKcal, 1));
    totalKjEl.textContent = String(round(totalKj, 1));
  }

  function renderTable() {
    foodTbody.innerHTML = '';
    foodItems.forEach((it, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.name}</td>
        <td>${it.amount || ''}</td>
        <td>${round(it.kcal, 1)}</td>
        <td>${round(kcalToKj(it.kcal), 1)}</td>
        <td><button class="btn" data-remove="${idx}">Remove</button></td>
      `;
      foodTbody.appendChild(tr);
    });
    updateTotals();
  }

  foodTbody?.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLButtonElement && target.dataset.remove) {
      const idx = parseInt(target.dataset.remove, 10);
      if (Number.isInteger(idx)) {
        foodItems.splice(idx, 1);
        renderTable();
      }
    }
  });

  foodForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#food-name').value.trim();
    const amount = $('#food-amount').value.trim();
    const energy = parseFloat($('#food-energy').value);
    const unit = $('#food-unit').value;
    if (!name || !Number.isFinite(energy)) return;
    const kcal = unit === 'kJ' ? kjToKcal(energy) : energy;
    foodItems.push({ name, amount, kcal });
    foodForm.reset();
    renderTable();
  });

  clearTrackerBtn?.addEventListener('click', () => {
    foodItems = [];
    renderTable();
  });

  // Converter
  const convertForm = $('#convert-form');
  const convertResult = $('#convert-result');

  convertForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = parseFloat($('#convert-value').value);
    const from = $('#convert-from').value;
    const to = $('#convert-to').value;
    if (!Number.isFinite(value)) {
      convertResult.textContent = 'Enter a valid number to convert.';
      return;
    }
    let out;
    if (from === to) {
      out = value;
    } else if (from === 'kcal' && to === 'kJ') {
      out = value * KCAL_TO_KJ;
    } else if (from === 'kJ' && to === 'kcal') {
      out = value / KCAL_TO_KJ;
    }
    convertResult.textContent = `${round(out, 3)} ${to}`;
  });
})();


