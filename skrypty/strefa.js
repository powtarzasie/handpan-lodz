/* Strefa członków Handpan Łódź.
   Treść strony jest zaszyfrowana AES-GCM (klucz z hasła przez PBKDF2, wzorzec StatiCrypt).
   W źródle strony ani w tym pliku nie ma jawnych linków — bez hasła nie da się ich odczytać.
   Po poprawnym haśle klucz (nie hasło!) zapisujemy w localStorage, żeby nie wpisywać go
   przy każdej wizycie. „Wyloguj” usuwa klucz. */
(() => {
  'use strict';

  const KLUCZ_LS = 'handpan-lodz-strefa-klucz';
  const dane = window.DANE_STREFY;
  const $ = (s) => document.querySelector(s);

  const panel = $('#panel-hasla');
  const formularz = $('#formularz-hasla');
  const poleHasla = $('#haslo');
  const blad = $('#blad-hasla');
  const oprawa = $('#tresc-strefy-oprawa');
  const cel = $('#tresc-strefy');
  const wyloguj = $('#wyloguj');

  if (!dane || !formularz || !window.crypto?.subtle) {
    if (blad) blad.textContent = 'Twoja przeglądarka nie obsługuje odszyfrowania tej strony (wymagany bezpieczny kontekst HTTPS).';
    return;
  }

  const b64naBajty = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bajtyNaB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

  const wyprowadzKlucz = async (haslo) => {
    const material = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(haslo), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64naBajty(dane.sol), iterations: dane.iteracje, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );
  };

  const odszyfruj = async (klucz) => {
    const czysty = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64naBajty(dane.iv) }, klucz, b64naBajty(dane.dane)
    );
    return new TextDecoder().decode(czysty);
  };

  const pokazTresc = (html) => {
    cel.innerHTML = html;
    panel.classList.add('ukryte');
    oprawa.classList.remove('ukryte');
  };

  const zapamietaj = async (klucz) => {
    try {
      const surowy = await crypto.subtle.exportKey('raw', klucz);
      localStorage.setItem(KLUCZ_LS, bajtyNaB64(surowy));
    } catch { /* tryb prywatny — trudno, hasło trzeba będzie wpisać ponownie */ }
  };

  // automatyczne odblokowanie, jeśli klucz jest zapamiętany
  (async () => {
    const zapisany = localStorage.getItem(KLUCZ_LS);
    if (!zapisany) return;
    try {
      const klucz = await crypto.subtle.importKey(
        'raw', b64naBajty(zapisany), { name: 'AES-GCM' }, false, ['decrypt']
      );
      pokazTresc(await odszyfruj(klucz));
    } catch {
      localStorage.removeItem(KLUCZ_LS);
    }
  })();

  formularz.addEventListener('submit', async (e) => {
    e.preventDefault();
    blad.textContent = '';
    const haslo = poleHasla.value;
    if (!haslo) { blad.textContent = 'Wpisz hasło.'; return; }
    formularz.querySelector('button').disabled = true;
    try {
      const klucz = await wyprowadzKlucz(haslo);
      const html = await odszyfruj(klucz);
      await zapamietaj(klucz);
      pokazTresc(html);
    } catch {
      blad.textContent = 'Nieprawidłowe hasło. Spróbuj jeszcze raz.';
      poleHasla.select();
    } finally {
      formularz.querySelector('button').disabled = false;
    }
  });

  wyloguj?.addEventListener('click', () => {
    localStorage.removeItem(KLUCZ_LS);
    oprawa.classList.add('ukryte');
    panel.classList.remove('ukryte');
    poleHasla.value = '';
    poleHasla.focus();
  });
})();
