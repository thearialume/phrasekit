export type HashOptions =
    | { algorithm: "scrypt"; salt: string; cost?: number }
    | { algorithm: "hmac-sha256"; salt: string };

export class Phrase {
    constructor(
        public readonly words: string[],
        private readonly dictionarySize: number,
    ) {}

    toString(): string {
        return this.words.join(" ");
    }

    toJSON(): string[] {
        return this.words;
    }

    join(separator: string): string {
        return this.words.join(separator);
    }

    get entropy(): number {
        const bitsPerWord = Math.log2(this.dictionarySize);
        return Math.round(bitsPerWord * this.words.length * 100) / 100;
    }

    /**
     * Generate hash using Node.js native crypto module.
     * This method is disabled in browser environments
     */
    async hash(options: HashOptions): Promise<string> {
        // Prevent hashing logic from running in the browser
        if (typeof window !== "undefined" || typeof document !== "undefined") {
            throw new Error(
                "[PhraseKit] Hashing is disabled in the browser to maintain a zero-dependency, lightweight footprint. Use server-side hashing for security.",
            );
        }

        // Use Function constructor to prevent bundlers from statically analyzing the import
        const dynamicImport = new Function(
            "specifier",
            "return import(specifier)",
        );
        const crypto = await dynamicImport("node:crypto");

        switch (options.algorithm) {
            case "scrypt":
                return new Promise((resolve, reject) => {
                    crypto.scrypt(
                        this.toString(),
                        options.salt,
                        64,
                        {
                            N: options.cost || 16384,
                            r: 8,
                            p: 5,
                        },
                        (err: Error | null, derivedKey: Buffer) => {
                            if (err) reject(err);
                            resolve(derivedKey.toString("hex"));
                        },
                    );
                });
            case "hmac-sha256":
                return crypto
                    .createHmac("sha256", options.salt)
                    .update(this.toString())
                    .digest("hex");

            default:
                throw new Error("Unsupported algorithm");
        }
    }
}
