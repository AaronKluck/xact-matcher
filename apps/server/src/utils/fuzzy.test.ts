import { fuzzyVisualScore } from "./fuzzy";

describe('fuzzy', () => {
    it('identical', () => {
        expect(fuzzyVisualScore('HELLO', 'HELLO')).toEqual(1);
        expect(fuzzyVisualScore('hello', 'hello')).toEqual(1);
        expect(fuzzyVisualScore('camelCase', 'camelCase')).toEqual(1);
        expect(fuzzyVisualScore('d3L74', 'd3L74')).toEqual(1);
    });

    it('case-insensitive', () => {
        // Any matches that are 100% case-wrong but otherwise perfect matches
        // will get a 0.9 score.
        expect(fuzzyVisualScore('HELLO', 'hello')).toEqual(.9);
        expect(fuzzyVisualScore('ABCDEFGHIJKLMNOP', 'abcdefghijklmnop')).toEqual(.9);
        expect(fuzzyVisualScore('camelCase', 'CAMELcASE')).toEqual(.9);

        // The numbers are exact, so they bump up the score more
        expect(fuzzyVisualScore('d3L74', 'D3l74')).toBeGreaterThan(.9);
    });

    it('levenshteiny-things', () => {
        expect(fuzzyVisualScore('pick', 'pickle')).toBeGreaterThan(.5);
        expect(fuzzyVisualScore('I PACKED', 'IPAD')).toBeGreaterThan(.4);
    });

    it('just-plain-wrong', () => {
        expect(fuzzyVisualScore('ABC', 'DEF')).toEqual(0);
        expect(fuzzyVisualScore('ABC', 'DEF')).toEqual(0);
    });

    it('visually-similar', () => {
        expect(fuzzyVisualScore('BIG', '816')).toBeGreaterThan(.5);
        expect(fuzzyVisualScore('$17', 'SIT')).toBeGreaterThan(.5);
    });


    it('relative-scores', () => {
        const perfect = fuzzyVisualScore('HELLO', 'HELLO');
        const wrongCase = fuzzyVisualScore('HELLO', 'HELLo');
        const visualChar = fuzzyVisualScore('HELLO', 'HELL0');
        const missingChar = fuzzyVisualScore('HELLO', 'HELO')
        const wrongCaseAndMissingChar = fuzzyVisualScore('HELLO', 'HELo')
        const visualAndMissingChar = fuzzyVisualScore('HELLO', 'HEL0');
        const allThree = fuzzyVisualScore('HELLO', 'hEL0');
        expect(perfect).toBeGreaterThan(wrongCase);
        expect(wrongCase).toBeGreaterThan(visualChar);
        expect(visualChar).toBeGreaterThan(missingChar);
        expect(missingChar).toBeGreaterThan(wrongCaseAndMissingChar);
        expect(wrongCaseAndMissingChar).toBeGreaterThan(visualAndMissingChar);
        expect(visualAndMissingChar).toBeGreaterThan(allThree);
    });
});