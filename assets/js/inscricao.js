/* ==========================================================================
   Inscrição — Sabores dos 3 Climas
   - Reordenação e máscaras automáticas (WhatsApp, CNPJ)
   - Validações rigorosas em tempo real (Nome, WhatsApp com DDD Anatel, E-mail, Empresa, CNPJ)
   - Verificação anti-duplicidade em 5 campos contra DB e localStorage
   - Trava antiflood / Rate Limiting (máx 2 tentativas, 5 min cooldown)
   - Toggle condicional com animação do campo CNPJ
   - Modal de sucesso e persistência
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motionQuery.matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (!hasGsap) document.documentElement.classList.add('no-gsap');

  /* ------------------------------------------------------------------
     0. Símbolo do header (timeline GSAP)
     ------------------------------------------------------------------ */
  const logo = $('#logoSymbol');
  function playLogo() {
    if (!hasGsap || !logo) return;
    const L = $$('.l', logo);
    gsap.killTweensOf(L);
    gsap.set(L, { clearProps: 'all' });
    L.forEach(e => gsap.set(e, { autoAlpha: 0, transformOrigin: e.dataset.o }));
    const tl = gsap.timeline({ delay: .15 });
    const blk = $$('.blk', logo), s = $('.s', logo), ico = $$('.ico', logo);
    tl.fromTo(blk, { scale: .3, rotation: -20, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: .8, ease: 'back.out(1.5)', stagger: .1 }, 0)
      .set(s, { autoAlpha: 1 }, 1.3)
      .fromTo(s, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .7, ease: 'power2.inOut' }, 1.3)
      .fromTo(ico, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .45, ease: 'back.out(2)', stagger: .07 }, 1.9);
    if (reduce) tl.progress(1);
  }
  playLogo();
  logo?.addEventListener('mouseenter', () => playLogo());

  /* ------------------------------------------------------------------
     1. Mobile nav toggle
     ------------------------------------------------------------------ */
  const nav = $('#mainNav');
  const toggle = $('#navToggle');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  matchMedia('(min-width: 1280px)').addEventListener('change', e => e.matches && setMenu(false));

  /* ------------------------------------------------------------------
     2. Lista oficial de DDDs da Anatel
     ------------------------------------------------------------------ */
  const DDDS_VALIDOS = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55,
    61, 62, 64, 63, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99
  ]);

  /* ------------------------------------------------------------------
     3. Máscaras automáticas amigáveis
     ------------------------------------------------------------------ */
  const fWhatsapp = $('#fWhatsapp');
  const fCnpj = $('#fCnpj');

  function maskPhone(v) {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length > 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 2) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return '';
  }

  fWhatsapp.addEventListener('input', () => {
    fWhatsapp.value = maskPhone(fWhatsapp.value);
  });

  function maskCNPJ(v) {
    const digits = v.replace(/\D/g, '').slice(0, 14);
    if (digits.length > 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    } else if (digits.length > 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else if (digits.length > 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length > 2) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    return digits;
  }

  fCnpj.addEventListener('input', () => {
    fCnpj.value = maskCNPJ(fCnpj.value);
  });

  /* ------------------------------------------------------------------
     4. Campo condicional CNPJ
     ------------------------------------------------------------------ */
  const cnpjField = $('#cnpjField');
  const radios = $$('input[name="possui_cnpj"]');

  radios.forEach(r => {
    r.addEventListener('change', () => {
      const show = r.value === 'Sim';
      cnpjField.hidden = false;
      requestAnimationFrame(() => {
        cnpjField.classList.toggle('is-visible', show);
        if (!show) {
          clearError(fCnpj, $('#errCnpj'));
          cnpjField.addEventListener('transitionend', function handler() {
            if (!cnpjField.classList.contains('is-visible')) {
              cnpjField.hidden = true;
            }
            cnpjField.removeEventListener('transitionend', handler);
          });
        } else {
          fCnpj.focus();
        }
      });
    });
  });

  /* ------------------------------------------------------------------
     5. Funções de Validação Algorítmica e Regras
     ------------------------------------------------------------------ */
  function showError(fieldEl, errEl, msg) {
    if (fieldEl) fieldEl.classList.add('is-invalid');
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add('is-visible');
    }
  }

  function clearError(fieldEl, errEl) {
    if (fieldEl) fieldEl.classList.remove('is-invalid');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.remove('is-visible');
    }
  }

  // Validação de Nome Completo
  function validarNome(val) {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return { valid: false, msg: 'Por favor, informe seu nome completo.' };
    }
    // Não pode conter números, símbolos ou emojis
    if (/[\d\p{Extended_Pictographic}]/u.test(trimmed)) {
      return { valid: false, msg: 'O nome não pode conter números, símbolos ou emojis.' };
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      return { valid: false, msg: 'O nome deve conter apenas letras e espaços.' };
    }
    // Mínimo de 2 palavras, cada uma com pelo menos 4 caracteres alfabéticos
    const words = trimmed.split(/\s+/);
    const validWords = words.filter(w => /^[a-zA-ZÀ-ÿ]{4,}$/.test(w));
    if (validWords.length < 2) {
      return { valid: false, msg: 'Informe nome e sobrenome (cada um com no mínimo 4 letras).' };
    }
    return { valid: true };
  }

  // Validação de Contato / WhatsApp
  function validarWhatsApp(val) {
    const digits = (val || '').replace(/\D/g, '');
    if (!digits) {
      return { valid: false, msg: 'Por favor, informe seu contato / WhatsApp.' };
    }
    if (digits.length !== 10 && digits.length !== 11) {
      return { valid: false, msg: 'Informe um número com DDD válido (10 ou 11 dígitos).' };
    }
    const ddd = parseInt(digits.slice(0, 2), 10);
    if (!DDDS_VALIDOS.has(ddd)) {
      return { valid: false, msg: 'DDD inválido. Informe um DDD brasileiro oficial.' };
    }
    if (digits.length === 11 && digits[2] !== '9') {
      return { valid: false, msg: 'Celular com 11 dígitos deve iniciar com 9 após o DDD.' };
    }
    if (/^(\d)\1+$/.test(digits.slice(2))) {
      return { valid: false, msg: 'Informe um número de telefone válido.' };
    }
    return { valid: true };
  }

  // Validação de E-mail
  function validarEmail(val) {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return { valid: false, msg: 'Por favor, informe seu e-mail.' };
    }
    if (/\s/.test(trimmed)) {
      return { valid: false, msg: 'O e-mail não pode conter espaços em branco.' };
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, msg: 'Informe um e-mail válido (ex: seu@email.com).' };
    }
    return { valid: true };
  }

  // Validação de Nome da Empresa
  function validarEmpresa(val) {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return { valid: false, msg: 'Informe o nome da empresa ou estabelecimento.' };
    }
    if (trimmed.length < 4) {
      return { valid: false, msg: 'O nome da empresa deve conter no mínimo 4 caracteres.' };
    }
    return { valid: true };
  }

  // Validação Algorítmica de CNPJ
  function validarCNPJ(cnpj) {
    const b = (cnpj || '').replace(/\D/g, '');
    if (b.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(b)) return false;

    // 1º Dígito Verificador
    let tamanho = 12;
    let numeros = b.substring(0, tamanho);
    let digitos = b.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

    // 2º Dígito Verificador
    tamanho = 13;
    numeros = b.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

    return true;
  }

  function validarCampoCnpj() {
    const possuiCnpj = $('input[name="possui_cnpj"]:checked')?.value;
    const cnpjVal = $('#fCnpj').value.trim();
    const cnpjDigits = cnpjVal.replace(/\D/g, '');

    if (possuiCnpj === 'Sim') {
      if (!cnpjDigits) {
        return { valid: false, msg: 'Por favor, informe o CNPJ da sua empresa.' };
      }
      if (!validarCNPJ(cnpjDigits)) {
        return { valid: false, msg: 'CNPJ inválido. Verifique os dígitos informados.' };
      }
    } else if (cnpjDigits.length > 0) {
      if (!validarCNPJ(cnpjDigits)) {
        return { valid: false, msg: 'CNPJ inválido. Verifique os dígitos informados.' };
      }
    }
    return { valid: true };
  }

  /* ------------------------------------------------------------------
     6. Feedback em tempo real (blur e input)
     ------------------------------------------------------------------ */
  const fNome = $('#fNome');
  const errNome = $('#errNome');
  const errWhatsapp = $('#errWhatsapp');
  const fEmail = $('#fEmail');
  const errEmail = $('#errEmail');
  const fEmpresa = $('#fEmpresa');
  const errEmpresa = $('#errEmpresa');
  const errCnpj = $('#errCnpj');
  const errCnpjGroup = $('#errCnpjGroup');
  const alertDuplicado = $('#alertDuplicado');
  const alertDuplicadoMsg = $('#alertDuplicadoMsg');

  function hideDuplicateAlert() {
    if (alertDuplicado && !alertDuplicado.hidden) {
      alertDuplicado.hidden = true;
    }
  }

  fNome.addEventListener('blur', () => {
    const res = validarNome(fNome.value);
    res.valid ? clearError(fNome, errNome) : showError(fNome, errNome, res.msg);
  });
  fNome.addEventListener('input', () => {
    hideDuplicateAlert();
    if (fNome.classList.contains('is-invalid')) {
      const res = validarNome(fNome.value);
      if (res.valid) clearError(fNome, errNome);
    }
  });

  fWhatsapp.addEventListener('blur', () => {
    const res = validarWhatsApp(fWhatsapp.value);
    res.valid ? clearError(fWhatsapp, errWhatsapp) : showError(fWhatsapp, errWhatsapp, res.msg);
  });
  fWhatsapp.addEventListener('input', () => {
    hideDuplicateAlert();
    if (fWhatsapp.classList.contains('is-invalid')) {
      const res = validarWhatsApp(fWhatsapp.value);
      if (res.valid) clearError(fWhatsapp, errWhatsapp);
    }
  });

  fEmail.addEventListener('blur', () => {
    const res = validarEmail(fEmail.value);
    res.valid ? clearError(fEmail, errEmail) : showError(fEmail, errEmail, res.msg);
  });
  fEmail.addEventListener('input', () => {
    hideDuplicateAlert();
    if (fEmail.classList.contains('is-invalid')) {
      const res = validarEmail(fEmail.value);
      if (res.valid) clearError(fEmail, errEmail);
    }
  });

  fEmpresa.addEventListener('blur', () => {
    const res = validarEmpresa(fEmpresa.value);
    res.valid ? clearError(fEmpresa, errEmpresa) : showError(fEmpresa, errEmpresa, res.msg);
  });
  fEmpresa.addEventListener('input', () => {
    hideDuplicateAlert();
    if (fEmpresa.classList.contains('is-invalid')) {
      const res = validarEmpresa(fEmpresa.value);
      if (res.valid) clearError(fEmpresa, errEmpresa);
    }
  });

  fCnpj.addEventListener('blur', () => {
    const res = validarCampoCnpj();
    res.valid ? clearError(fCnpj, errCnpj) : showError(fCnpj, errCnpj, res.msg);
  });
  fCnpj.addEventListener('input', () => {
    hideDuplicateAlert();
    if (fCnpj.classList.contains('is-invalid')) {
      const res = validarCampoCnpj();
      if (res.valid) clearError(fCnpj, errCnpj);
    }
  });

  radios.forEach(r => {
    r.addEventListener('change', () => {
      clearError(null, errCnpjGroup);
      hideDuplicateAlert();
    });
  });

  function validateAll() {
    let isValid = true;

    const rNome = validarNome(fNome.value);
    if (!rNome.valid) { showError(fNome, errNome, rNome.msg); isValid = false; } else { clearError(fNome, errNome); }

    const rWhats = validarWhatsApp(fWhatsapp.value);
    if (!rWhats.valid) { showError(fWhatsapp, errWhatsapp, rWhats.msg); isValid = false; } else { clearError(fWhatsapp, errWhatsapp); }

    const rEmail = validarEmail(fEmail.value);
    if (!rEmail.valid) { showError(fEmail, errEmail, rEmail.msg); isValid = false; } else { clearError(fEmail, errEmail); }

    const rEmpresa = validarEmpresa(fEmpresa.value);
    if (!rEmpresa.valid) { showError(fEmpresa, errEmpresa, rEmpresa.msg); isValid = false; } else { clearError(fEmpresa, errEmpresa); }

    const cnpjChecked = $('input[name="possui_cnpj"]:checked');
    if (!cnpjChecked) {
      showError(null, errCnpjGroup, 'Selecione uma opção.');
      isValid = false;
    } else {
      clearError(null, errCnpjGroup);
      const rCnpj = validarCampoCnpj();
      if (!rCnpj.valid) { showError(fCnpj, errCnpj, rCnpj.msg); isValid = false; } else { clearError(fCnpj, errCnpj); }
    }

    return isValid;
  }

  /* ------------------------------------------------------------------
     7. Rate Limiting (localStorage) — Trava Antiflood
     - Máximo 2 tentativas consecutivas
     - Bloqueio temporário de 5 minutos ao atingir a 2ª tentativa
     ------------------------------------------------------------------ */
  const RATE_LIMIT_KEY = 'db_inscricoes_ratelimit';
  const MAX_ATTEMPTS = 2;
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
  const btnSubmit = $('#btnSubmit');
  const alertRateLimit = $('#alertRateLimit');
  const countdownEl = $('#rateLimitCountdown');
  let countdownTimer = null;

  function getRateLimit() {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return { attempts: 0, bloqueadoAte: 0 };
      const parsed = JSON.parse(raw);
      return {
        attempts: Number(parsed.attempts) || 0,
        bloqueadoAte: Number(parsed.bloqueadoAte) || 0,
      };
    } catch {
      return { attempts: 0, bloqueadoAte: 0 };
    }
  }

  function saveRateLimit(data) {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar rate limit:', e);
    }
  }

  function checkRateLimitLock() {
    const rl = getRateLimit();
    const now = Date.now();

    if (rl.bloqueadoAte && now < rl.bloqueadoAte) {
      btnSubmit.disabled = true;
      alertRateLimit.hidden = false;

      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((rl.bloqueadoAte - Date.now()) / 1000));
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          saveRateLimit({ attempts: 0, bloqueadoAte: 0 });
          btnSubmit.disabled = false;
          alertRateLimit.hidden = true;
        } else {
          const m = Math.floor(remaining / 60);
          const s = remaining % 60;
          if (countdownEl) {
            countdownEl.textContent = `${m} minuto(s) e ${s} segundo(s)`;
          }
        }
      };

      updateCountdown();
      if (!countdownTimer) {
        countdownTimer = setInterval(updateCountdown, 1000);
      }
      return true; // Bloqueado
    } else {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      btnSubmit.disabled = false;
      alertRateLimit.hidden = true;
      if (rl.bloqueadoAte && now >= rl.bloqueadoAte) {
        saveRateLimit({ attempts: 0, bloqueadoAte: 0 });
      }
      return false; // Liberado
    }
  }

  function recordSubmitAttempt() {
    const rl = getRateLimit();
    rl.attempts = (rl.attempts || 0) + 1;
    if (rl.attempts >= MAX_ATTEMPTS) {
      rl.bloqueadoAte = Date.now() + COOLDOWN_MS;
    }
    saveRateLimit(rl);
    checkRateLimitLock();
  }

  // Verifica bloqueio assim que a página é carregada
  checkRateLimitLock();

  /* ------------------------------------------------------------------
     8. Verificação de Registros Duplicados
     - Compara Nome, WhatsApp, Empresa, E-mail e CNPJ
     - Consulta endpoint /api/inscricoes e local storage
     ------------------------------------------------------------------ */
  async function fetchExistingInscricoes() {
    const list = [];

    // 1. Endpoint backend
    try {
      const res = await fetch('/api/inscricoes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) list.push(...data);
      }
    } catch {
      // Offline / endpoint indisponível
    }

    // 2. Chave principal de storage do projeto
    try {
      const ls1 = JSON.parse(localStorage.getItem('db_inscricoes') || '[]');
      if (Array.isArray(ls1)) list.push(...ls1);
    } catch {}

    // 3. Chave fallback de storage
    try {
      const ls2 = JSON.parse(localStorage.getItem('inscricoes') || '[]');
      if (Array.isArray(ls2)) list.push(...ls2);
    } catch {}

    // Elimina duplicatas internas pelo id
    const unique = new Map();
    list.forEach(item => {
      if (item && typeof item === 'object') {
        const id = item.id || `${item.nome}_${item.whatsapp}`;
        if (!unique.has(id)) unique.set(id, item);
      }
    });
    return Array.from(unique.values());
  }

  function findDuplicate(candidate, existing) {
    const normStr = s => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const normDigits = s => (s || '').toString().replace(/\D/g, '');

    const candNome = normStr(candidate.nome);
    const candWhats = normDigits(candidate.whatsapp);
    const candEmpresa = normStr(candidate.empresa);
    const candEmail = normStr(candidate.email);
    const candCnpj = normDigits(candidate.cnpj);

    for (const item of existing) {
      if (candNome && normStr(item.nome) === candNome) {
        return { isDuplicate: true, field: 'Nome Completo', value: candidate.nome };
      }
      if (candWhats && normDigits(item.whatsapp) === candWhats) {
        return { isDuplicate: true, field: 'Contato / WhatsApp', value: candidate.whatsapp };
      }
      if (candEmpresa && normStr(item.empresa) === candEmpresa) {
        return { isDuplicate: true, field: 'Nome da Empresa', value: candidate.empresa };
      }
      if (candEmail && normStr(item.email) === candEmail) {
        return { isDuplicate: true, field: 'E-mail', value: candidate.email };
      }
      if (candCnpj && normDigits(item.cnpj) && normDigits(item.cnpj) === candCnpj) {
        return { isDuplicate: true, field: 'CNPJ', value: candidate.cnpj };
      }
    }
    return { isDuplicate: false };
  }

  /* ------------------------------------------------------------------
     9. Submissão do Formulário
     ------------------------------------------------------------------ */
  const form = $('#inscForm');
  const overlay = $('#successOverlay');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Verifica rate limit antes de qualquer ação
    if (checkRateLimitLock()) return;

    // 2. Validação dos campos
    const isValid = validateAll();
    if (!isValid) {
      recordSubmitAttempt();
      const firstErr = $('.is-invalid');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const formData = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      data_inscricao: new Date().toISOString(),
      nome: fNome.value.trim(),
      whatsapp: fWhatsapp.value.trim(),
      email: fEmail.value.trim(),
      empresa: fEmpresa.value.trim(),
      possui_cnpj: $('input[name="possui_cnpj"]:checked').value,
      cnpj: fCnpj.value.trim() || null,
    };

    btnSubmit.classList.add('is-loading');

    try {
      // 3. Verificação de Duplicidade
      const existing = await fetchExistingInscricoes();
      const dup = findDuplicate(formData, existing);

      if (dup.isDuplicate) {
        recordSubmitAttempt();
        alertDuplicadoMsg.textContent = `Atenção: Já existe um cadastro registrado com este dado (${dup.field}). Por favor, verifique os dados informados ou aguarde o contato de nossa equipe.`;
        alertDuplicado.hidden = false;
        alertDuplicado.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // 4. Persistência dos Dados (API + LocalStorage)
      let savedOnApi = false;
      try {
        const res = await fetch('/api/inscricoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.status === 409) {
          // Servidor detectou duplicidade
          recordSubmitAttempt();
          const errData = await res.json().catch(() => ({}));
          alertDuplicadoMsg.textContent = `Atenção: Já existe um cadastro registrado com este dado (${errData.field || 'Dado cadastrado'}). Por favor, verifique os dados informados ou aguarde o contato de nossa equipe.`;
          alertDuplicado.hidden = false;
          alertDuplicado.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        if (res.ok) {
          savedOnApi = true;
        }
      } catch (errApi) {
        console.warn('API indisponível, utilizando fallback em localStorage:', errApi);
      }

      // Salva no localStorage (garante disponibilidade offline/demo)
      try {
        const key = 'db_inscricoes';
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        stored.push(formData);
        localStorage.setItem(key, JSON.stringify(stored));
        // Mantém espelho na chave secundária por compatibilidade
        localStorage.setItem('inscricoes', JSON.stringify(stored));
      } catch (errLs) {
        console.warn('Falha ao salvar no localStorage:', errLs);
      }

      // Conta como tentativa de envio bem-sucedida
      recordSubmitAttempt();

      // Limpa os campos do formulário
      form.reset();
      cnpjField.classList.remove('is-visible');
      cnpjField.hidden = true;
      hideDuplicateAlert();
      $$('.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));
      $$('.field-error', form).forEach(el => { el.textContent = ''; el.classList.remove('is-visible'); });

      // Exibe modal de confirmação
      showSuccess();

    } catch (err) {
      console.error('Erro ao processar inscrição:', err);
      alert('Ocorreu um erro inesperado ao processar sua inscrição. Por favor, tente novamente.');
    } finally {
      btnSubmit.classList.remove('is-loading');
    }
  });

  /* ------------------------------------------------------------------
     10. Modal de Sucesso
     ------------------------------------------------------------------ */
  function showSuccess() {
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
    });

    overlay.onclick = (e) => {
      if (e.target === overlay) closeSuccess();
    };

    overlay.focus();
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSuccess();
    });
  }

  function closeSuccess() {
    overlay.classList.remove('is-active');
    setTimeout(() => { overlay.hidden = true; }, 400);
  }

})();
