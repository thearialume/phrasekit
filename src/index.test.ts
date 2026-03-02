import { expect, test, describe } from "bun:test";
import { phrasekit } from "./index";

describe("PhraseKit Core", () => {
    test("should generate the correct number of words", () => {
        const phrase = phrasekit.generate(12);
        expect(phrase.words).toHaveLength(12);
    });

    test("should calculate entropy correctly", () => {
        const phrase = phrasekit.generate(6);
        expect(phrase.entropy).toBeGreaterThan(77);
        expect(phrase.entropy).toBeLessThan(78);
    });

    test("should suggest words based on prefix", () => {
        const suggestions = phrasekit.suggest("abd");
        expect(suggestions).toContain("abdomen");
        expect(suggestions).toContain("abdominal");
    });

    test("should normalize input correctly", () => {
        const input = "  ApPle  SWoOP ";
        const phrase = phrasekit.from(input);
        expect(phrase.toString()).toBe("apple swoop");
    });

    test("should validate valid and invalid phrases", () => {
        expect(phrasekit.validate("glider confirm armhole")).toBe(true);
        expect(phrasekit.validate("not-in-dictionary-word")).toBe(false);
    });
});

describe("Phrase Hashing (Server-side)", () => {
    test("should compute scrypt hash", async () => {
        const phrase = phrasekit.generate(3);
        const hash = await phrase.hash({
            algorithm: "scrypt",
            salt: "test-salt",
        });
        expect(hash).toBeDefined();
        expect(typeof hash).toBe("string");
    });

    test("should compute hmac-sha256 hash", async () => {
        const phrase = phrasekit.generate(3);
        const hash = await phrase.hash({
            algorithm: "hmac-sha256",
            salt: "secret-key",
        });
        expect(hash).toHaveLength(64);
    });

    test("should be deterministic", async () => {
        const p1 = phrasekit.from("glider confirm armhole");
        const p2 = phrasekit.from("glider confirm armhole");

        const h1 = await p1.hash({ algorithm: "hmac-sha256", salt: "key" });
        const h2 = await p2.hash({ algorithm: "hmac-sha256", salt: "key" });

        expect(h1).toBe(h2);
    });
});

describe("Phrase Utilities", () => {
    test("toJSON() should return the words array", () => {
        const phrase = phrasekit.generate(3);
        expect(phrase.toJSON()).toEqual(phrase.words);
    });

    test("join() should use custom separators", () => {
        const phrase = phrasekit.from("apple swoop lemon");
        expect(phrase.join("-")).toBe("apple-swoop-lemon");
        expect(phrase.join("")).toBe("appleswooplemon");
    });
});

describe("Error Handling", () => {
    test("should throw error for invalid word count", () => {
        expect(() => phrasekit.generate(0)).toThrow(
            "Count must be a positive number",
        );
        expect(() => phrasekit.generate(-5)).toThrow();
    });

    test("should throw error for empty input in .from()", () => {
        expect(() => phrasekit.from("")).toThrow("Input is empty");
    });

    test("should throw error for unsupported algorithm", async () => {
        const phrase = phrasekit.generate(3);
        expect(
            phrase.hash({ algorithm: "invalid" as any, salt: "test" }),
        ).rejects.toThrow("Unsupported algorithm");
    });

    test("should prevent hashing in browser environments", async () => {
        const phrase = phrasekit.generate(3);

        global.window = {} as any;
        global.document = {} as any;

        try {
            await phrase.hash({ algorithm: "scrypt", salt: "test" });
        } catch (e: any) {
            expect(e.message).toContain("Hashing is disabled in the browser");
        } finally {
            // @ts-ignore
            delete global.window;
            // @ts-ignore
            delete global.document;
        }
    });
});
