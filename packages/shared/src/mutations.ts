// Visual similarity map for character substitutions
const visualMap: Record<string, string[]> = {
    '0': ['O', 'Q'],
    '1': ['I', 'l'],
    '2': ['Z'],
    '3': ['E'],
    '4': ['A'],
    '5': ['S'],
    '6': ['G'],
    '7': ['T'],
    '8': ['B'],
    '9': ['g'],
    'O': ['0', 'Q'],
    'B': ['8'],
    'Z': ['2'],
    'G': ['6'],
    'T': ['7'],
    'I': ['1', 'l'],
    'S': ['5', '$'],
    'A': ['@', '4'],
    '@': ['A'],
    '$': ['S'],
};

/**
 * Mutates a string by randomly substituting, dropping, or adding characters
 * based on visual similarity and a variation rate.
 */
export function mutateString(str: string, variationRate = 0.15): string {
    const chars = str.split('');
    const mutated: string[] = [];

    for (const char of chars) {
        if (Math.random() < variationRate) {
            const action = Math.random() < 0.33 ? 'substitute' : Math.random() < 0.5 ? 'drop' : 'add';
            if (action === 'substitute' && visualMap[char]) {
                mutated.push(visualMap[char][Math.floor(Math.random() * visualMap[char].length)]);
            } else if (action === 'drop') {
                continue; // skip character
            } else if (action === 'add') {
                mutated.push(char);
                // Add a random letter
                const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                mutated.push(Math.random() < 0.5 ? randomChar.toLowerCase() : randomChar);
            } else {
                mutated.push(char);
            }
        } else {
            mutated.push(char);
        }
    }

    return mutated.join('');
}

/**
 * Mutates a price by randomly modifying digits while maintaining a valid number format.
 */
export function mutatePrice(price: number, variationRate = 0.2): number {
    const str = price.toFixed(2); // "123.45"
    const chars = str.split('');
    const mutated: string[] = [];

    for (const char of chars) {
        if (Math.random() < variationRate) {
            const action = Math.random() < 0.33 ? 'drop' : Math.random() < 0.5 ? 'add' : 'substitute';

            if (action === 'drop') {
                continue;
            } else if (action === 'add') {
                mutated.push(char);
                mutated.push(Math.floor(Math.random() * 10).toString());
            } else if (action === 'substitute' && /\d/.test(char)) {
                mutated.push(Math.floor(Math.random() * 10).toString());
            } else {
                mutated.push(char);
            }
        } else {
            mutated.push(char);
        }
    }

    const mutatedStr = mutated.join('');
    const parsed = parseFloat(mutatedStr);
    return isNaN(parsed) ? price : parsed;
} 