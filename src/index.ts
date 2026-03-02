import { wordList } from "./wordlist";
import { Phrase } from "./phrase";

export class PhraseKit {
    private readonly words: string[];
    private readonly wordSet: Set<string>;

    constructor(customList?: string[]) {
        this.words = customList || wordList;
        this.wordSet = new Set(this.words);
    }

    /**
     * Generates a cryptographically secure passphrase
     * @param count Number of words to generate. Default is 6 (approx. 77 bits of entropy)
     * @returns {Phrase} Phrase object
     */
    public generate(count: number = 6): Phrase {
        if (count <= 0) throw new Error("Count must be a positive number");

        const randomValues = new Uint32Array(count);
        crypto.getRandomValues(randomValues);

        const result = Array.from(randomValues).map(
            (val) => this.words[val % this.words.length] as string,
        );

        return new Phrase(result, this.words.length);
    }

    /**
     * Converts raw user input into a clean array of words.
     * Removes extra spaces, converts to lowercase, handles string or array
     * @param input String or array input
     * @param separator Separator for string input
     * @returns {string[]} Words array
     */
    public normalize(
        input: string | string[],
        separator: string = " ",
    ): string[] {
        const rawTokens = Array.isArray(input) ? input : input.split(separator);
        return rawTokens
            .map((word) => word.toLowerCase().trim())
            .filter((word) => word.length > 0);
    }

    /**
     * Takes user input, normalizes it, and returns a Phrase object if valid.
     * This is the bridge between UI input and Phrase functionality
     * @param input String or array input
     * @param separator Separator for string input
     * @returns {Phrase} Phrase object
     */
    public from(input: string | string[], separator = " "): Phrase {
        const normalized = this.normalize(input, separator);

        if (normalized.length === 0) {
            throw new Error("Input is empty or contains only whitespace");
        }

        const invalidWords = normalized.filter(
            (word) => !this.wordSet.has(word),
        );
        if (invalidWords.length > 0) {
            throw new Error(
                `Invalid words not found in dictionary: ${invalidWords.join(", ")}`,
            );
        }

        return new Phrase(normalized, this.words.length);
    }

    /**
     * Validates if the given phrase or array consists of words from the dictionary. It's case-insensitive
     * @param input String or array input
     * @param separator Separator for string input
     * @returns {boolean} Boolean
     */
    public validate(
        phrase: string | string[],
        separator: string = " ",
    ): boolean {
        try {
            this.from(phrase, separator);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Provides word suggestions based on a prefix.
     * Absolutely suitable for real-time UI autocomplete
     * @param prefix The starting letters to search for
     * @param limit Maximum number of suggestions to return
     * @returns {string[]} Array of suggestions
     */
    public suggest(prefix: string, limit: number = 5): string[] {
        const cleanPrefix = prefix.toLowerCase().trim();
        if (!cleanPrefix) return [];

        const matches: string[] = [];
        for (const word of this.words) {
            if (word.startsWith(cleanPrefix)) {
                matches.push(word);
            }
            if (matches.length >= limit) break;
        }
        return matches;
    }
}

export const phrasekit = new PhraseKit();
export { Phrase, type HashOptions } from "./phrase";
export { wordList } from "./wordlist";
