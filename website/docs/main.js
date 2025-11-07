// Optional: Worker endpoint injected via window.LEAD_API (set in index.html)
const API_BASE = (typeof window !== 'undefined' && window.LEAD_API) ? window.LEAD_API.replace(/\/$/, '') : '';
const form = document.getElementById('leadForm');
const toastEl = document.getElementById('toast');
const ctaBtn = document.getElementById('ctaBtn');

function showToast(msg, type='success'){ 
  toastEl.textContent = msg; 
  toastEl.className = `toast ${type}`; 
  requestAnimationFrame(()=> toastEl.classList.add('show')); 
  setTimeout(()=> toastEl.classList.remove('show'), 4000); 
}

ctaBtn.addEventListener('click', ()=> {
  document.getElementById('lead').scrollIntoView({ behavior: 'smooth' });
});

Array.from(document.querySelectorAll('.request-btn')).forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('lead').scrollIntoView({ behavior: 'smooth' });
    const course = btn.getAttribute('data-course');
    const messageField = form.querySelector('textarea[name="message"]');
    if (!messageField.value) {
      messageField.value = `Qiziqayotgan dastur: ${course}`;
    }
    messageField.focus();
  });
});

function extractFormData(form){
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    name: data.name?.trim(),
    phone: data.phone?.trim(),
    username: data.username?.trim(),
    company: data.company?.trim(),
    message: data.message?.trim()
  };
}

function validate(data){
  const errors = [];
  if (!data.name || data.name.length < 2) errors.push('Ism kamida 2 belgi');
  if (!data.phone || !/^\+?[0-9\s()-]{6,}$/.test(data.phone)) errors.push('Telefon raqamini to‘g‘ri kiriting');
  if (!data.username || !/^@?[A-Za-z0-9_]{5,}$/.test(data.username)) errors.push('@username to‘g‘ri kiriting');
  if (data.company && data.company.length < 2) errors.push('Kompaniya nomi kamida 2 belgi');
  if (!data.message || data.message.length < 5) errors.push('Xabar kamida 5 belgi');
  return errors;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('formStatus');
  statusEl.textContent='';

  const data = extractFormData(form);
  const errors = validate(data);
  if (errors.length){
    showToast(errors[0], 'error');
    statusEl.textContent = errors.join(', ');
    return;
  }
  submitBtn.disabled = true;
  const original = submitBtn.textContent;
  submitBtn.textContent = 'Yuborilmoqda…';
  try {
    const resp = await fetch(`${API_BASE}/api/lead`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const json = await resp.json();
    if (!json.ok){
      const msg = json.errors?.[0] || 'Xatolik. Qayta urinib ko‘ring.';
      showToast(msg, 'error');
      statusEl.textContent = json.errors?.join(', ');
    } else {
      showToast('Rahmat! Tez orada bog‘lanamiz.');
      form.reset();
    }
  } catch (err){
    showToast('Tarmoq xatosi', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = original;
  }
});
