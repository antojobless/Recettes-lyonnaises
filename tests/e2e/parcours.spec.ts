import { expect, Page, test } from '@playwright/test';

const cell = (p: Page, a: string) => p.locator(`[data-addr="${a}"]`);
const mastery = async (p: Page, label: string) => {
  const row = p.locator('.mastery-row', { hasText: label });
  return Number((await row.locator('.mastery-pct').innerText()).replace(/\D/g, ''));
};

test('parcours complet : ouvrir, faire un exercice, le réussir, voir la progression bouger', async ({ page }) => {
  // 1. Ouvrir l'appli : premier écran = comment savoir si Excel est en français
  await page.goto('./');
  await expect(page.getByTestId('onboarding')).toContainText('=SOM');
  await page.getByTestId('lang-fr').click();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  expect(await mastery(page, 'SOMME (SUM)')).toBe(0);
  await expect(page.getByTestId('streak')).toContainText('0');

  // 2. Parcours → module 0 : leçon, exemple résolu, premier exercice
  await page.getByTestId('nav-parcours').click();
  await page.getByTestId('module-0').click();
  for (let i = 0; i < 4; i++) await page.getByTestId('lesson-next').click();
  await page.getByTestId('lesson-done').click();
  await expect(page.getByTestId('worked')).toBeVisible();
  await page.getByTestId('tab-exercices').click();
  await page.getByTestId('ex-link-m0-1').click();
  await cell(page, 'G4').click();
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ko')).toContainText('inversé');
  await cell(page, 'D7').click();
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ok')).toBeVisible();

  // 3. Un exercice de formule (module 3) : valeur tapée refusée, puis formule acceptée
  await page.goto('./#/ex/m3-1');
  await cell(page, 'J1').click();
  await page.keyboard.type('137780');
  await page.keyboard.press('Enter');
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ko')).toContainText('à la main');
  await cell(page, 'J1').click();
  await page.keyboard.type('=SOMME(');
  // un clic sur une cellule insère sa référence, comme dans Excel
  await cell(page, 'D2').click();
  await expect(page.getByTestId('cell-editor')).toHaveValue('=SOMME(D2');
  await page.keyboard.type(':D151)');
  await page.keyboard.press('Enter');
  await cell(page, 'J1').click();
  await expect(page.getByTestId('formula-bar')).toHaveValue('=SOMME(D2:D151)');
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ok')).toBeVisible();

  // 4. La progression a bougé sur le tableau de bord
  await page.getByTestId('nav-home').click();
  expect(await mastery(page, 'SOMME (SUM)')).toBeGreaterThan(0);
  expect(await mastery(page, 'Interface et saisie')).toBeGreaterThan(0);
  await expect(page.getByTestId('streak')).toContainText('1');

  // 5. Elle survit au rechargement (localStorage)
  await page.reload();
  expect(await mastery(page, 'SOMME (SUM)')).toBeGreaterThan(0);

  // 6. Bascule en anglais : les formules sont traduites
  await page.getByTestId('toggle-en').click();
  await page.goto('./#/ex/m3-2');
  await cell(page, 'J2').click();
  await page.keyboard.type('=AVERAGE(D2:D151)');
  await page.keyboard.press('Enter');
  await page.getByTestId('toggle-fr').click();
  await cell(page, 'J2').click();
  await expect(page.getByTestId('formula-bar')).toHaveValue('=MOYENNE(D2:D151)');
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ok')).toBeVisible();
});

test('recopie et $ : le piège du taux fixe', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('lang-fr').click();
  await page.goto('./#/ex/m2-2');
  await cell(page, 'C2').click();
  await page.keyboard.type('=B2*G1');
  await page.keyboard.press('Enter');
  await cell(page, 'C2').click();
  await page.getByTestId('fill-handle').dblclick();
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ko')).toContainText('$');
  await cell(page, 'C2').dblclick();
  await page.keyboard.press('F4');
  await expect(page.getByTestId('cell-editor')).toHaveValue('=B2*$G$1');
  await page.keyboard.press('Enter');
  await cell(page, 'C2').click();
  await page.getByTestId('fill-handle').dblclick();
  await cell(page, 'C11').click();
  await expect(page.getByTestId('formula-bar')).toHaveValue('=B11*$G$1');
  await page.getByTestId('check-btn').click();
  await expect(page.getByTestId('result-ok')).toBeVisible();
});

test('export puis import de la progression', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('lang-fr').click();
  await page.goto('./#/ex/m0-1');
  await cell(page, 'D7').click();
  await page.getByTestId('check-btn').click();
  await page.goto('./#/reglages');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-progress').click()]);
  const path = await dl.path();
  // on efface tout, puis on réimporte
  page.once('dialog', (d) => d.accept());
  await page.getByText('Tout effacer').click();
  await expect(page.getByText('0 exercice réussi')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByTestId('import-file').setInputFiles(path!);
  await expect(page.getByTestId('import-msg')).toContainText('1 exercice réussi,');
});
