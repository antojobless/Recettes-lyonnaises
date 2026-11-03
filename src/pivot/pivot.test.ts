import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { commandesMontant, layout, table } from '../data/datasets';
import { SheetModel } from '../engine/engine';
import { computePivot, samePivot } from './pivot';
import { buildXlsx } from './xlsx';

const ds = table(
  [{ name: 'Région' }, { name: 'Produit' }, { name: 'Montant' }],
  [
    ['Nord', 'A', 10],
    ['Sud', 'A', 5],
    ['Nord', 'B', 7],
    ['Nord', 'A', 3],
  ],
);

describe('TCD', () => {
  it('somme par ligne avec total général', () => {
    const p = computePivot(ds, { rows: ['Région'], cols: [], values: [{ field: 'Montant', agg: 'sum' }], filters: [] });
    expect(p.rowKeys).toEqual([['Nord'], ['Sud']]);
    expect(p.body).toEqual([[20], [5], [25]]);
  });
  it('lignes × colonnes, nombre, moyenne, filtre', () => {
    const p = computePivot(ds, { rows: ['Région'], cols: ['Produit'], values: [{ field: 'Montant', agg: 'count' }], filters: [] });
    expect(p.body).toEqual([[2, 1, 3], [1, null, 1], [3, 1, 4]]);
    const f = computePivot(ds, { rows: ['Produit'], cols: [], values: [{ field: 'Montant', agg: 'avg' }], filters: [{ field: 'Région', values: ['Nord'] }] });
    expect(f.body).toEqual([[6.5], [7], [20 / 3]]);
  });
  it('comparaison indépendante de l’ordre des valeurs', () => {
    const a = computePivot(ds, { rows: ['Région'], cols: [], values: [{ field: 'Montant', agg: 'sum' }], filters: [] });
    const b = computePivot(ds, { rows: ['Région'], cols: [], values: [{ field: 'Montant', agg: 'count' }], filters: [] });
    expect(samePivot(a, a)).toBe(true);
    expect(samePivot(a, b)).toBe(false);
  });
});

describe('export .xlsx', () => {
  it('garde les formules (en anglais) et les valeurs', async () => {
    const m = new SheetModel('fr', { A1: 'Prix', A2: 10, A3: 2.5, B1: '15/03/2025', B2: '=SOMME(A2:A3)', B3: '=SI(A2>5;"oui";"non")' });
    const buf = await buildXlsx([{ name: 'Feuil1', model: m }, { name: 'Données', setup: layout(commandesMontant(10, 1)) }]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.getWorksheet('Feuil1')!;
    expect(ws.getCell('B2').value).toMatchObject({ formula: 'SUM(A2:A3)', result: 12.5 });
    expect(ws.getCell('B3').value).toMatchObject({ formula: 'IF(A2>5,"oui","non")' });
    expect(ws.getCell('A3').value).toBe(2.5);
    expect(ws.getCell('B1').value).toBeInstanceOf(Date);
    const d = wb.getWorksheet('Données')!;
    expect(d.getCell('A1').value).toBe('N° commande');
    expect(d.rowCount).toBe(11);
  });
});
