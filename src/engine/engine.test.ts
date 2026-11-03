import { describe, expect, it } from 'vitest';
import { SheetModel } from './engine';
import { findRefs, shiftFormula, toggleAbsoluteAt, translateFormula } from './formula';

describe('moteur en français', () => {
  const s = new SheetModel('fr', { A1: 5, A2: 7, A3: 12, B1: 'Nord', B2: 'Sud', B3: 'Est' });
  it('=SOMME(A1:A3)', () => {
    s.setAt('C1', '=SOMME(A1:A3)');
    expect(s.valueAt('C1')).toBe(24);
  });
  it('=SI(A1>10;"oui";"non")', () => {
    s.setAt('C2', '=SI(A1>10;"oui";"non")');
    expect(s.valueAt('C2')).toBe('non');
    s.setAt('C3', '=SI(A3>10;"oui";"non")');
    expect(s.valueAt('C3')).toBe('oui');
  });
  it('virgule décimale et FAUX', () => {
    s.setAt('D1', '=A1*0,5');
    expect(s.valueAt('D1')).toBe(2.5);
    s.setAt('D2', '=RECHERCHEV("Sud";B1:B3;1;FAUX)');
    expect(s.valueAt('D2')).toBe('Sud');
  });
  it('MOYENNE.SI.ENS et CONCAT (fonctions ajoutées)', () => {
    s.setAt('E1', '=MOYENNE.SI.ENS(A1:A3;B1:B3;"<>Nord")');
    expect(s.valueAt('E1')).toBe(9.5);
    s.setAt('E2', '=MOYENNE.SI.ENS(A1:A3;B1:B3;"Ouest")');
    expect(s.info(0, 4).display).toBe('9,5');
    expect(s.info(1, 4).display).toBe('#DIV/0!');
    s.setAt('E3', '=CONCAT(B1:B3;"!")');
    expect(s.valueAt('E3')).toBe('NordSudEst!');
  });
  it('erreurs affichées en français avec explication', () => {
    s.setAt('F1', '=SOM(A1:A3)');
    const i = s.info(0, 5);
    expect(i.display).toBe('#NOM?');
    expect(i.error?.explanation).toContain('SOM');
  });
  it('bascule en anglais', () => {
    const t = new SheetModel('fr', { A1: 2, B1: '=SI(A1>1;SOMME(A1;0,5);FAUX)' });
    t.setLang('en');
    expect(t.getRaw(0, 1)).toBe('=IF(A1>1,SUM(A1,0.5),FALSE)');
    expect(t.valueAt('B1')).toBe(2.5);
  });
});

describe('références', () => {
  it('rotation F4 : A1 → $A$1 → A$1 → $A1 → A1', () => {
    let f = '=B2*C1';
    const seq: string[] = [];
    for (let i = 0; i < 4; i++) {
      f = toggleAbsoluteAt(f, f.length, 'fr').text;
      seq.push(f);
    }
    expect(seq).toEqual(['=B2*$C$1', '=B2*C$1', '=B2*$C1', '=B2*C1']);
  });
  it('recopie vers le bas', () => {
    expect(shiftFormula('=B2*$C$1+C$1+$D2', 3, 0, 'fr')).toBe('=B5*$C$1+C$1+$D5');
    expect(shiftFormula('=A1', -1, 0, 'fr')).toBe('=#REF!');
  });
  it('plages trouvées', () => {
    const r = findRefs('=SOMME.SI(A2:A10;"Nord";$C$2:$C$10)', 'fr');
    expect(r).toHaveLength(2);
    expect(r[1].to.row).toBe(9);
  });
  it('traduction', () => {
    expect(translateFormula('=SUMIFS(D2:D9,B2:B9,"Nord, Est",C2:C9,">1.5")', 'en', 'fr')).toBe('=SOMME.SI.ENS(D2:D9;B2:B9;"Nord, Est";C2:C9;">1.5")');
  });
});
