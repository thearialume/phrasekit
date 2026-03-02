# phrasekit ✨

**Human-friendly passphrases for privacy-first authentication.**

A lightweight, zero-dependency TypeScript library for generating and managing secure word-based keys. Inspired by Mullvad VPN, but made more human.

[![npm version](https://img.shields.io/npm/v/phrasekit)](https://www.npmjs.com/package/phrasekit)
[![npm downloads](https://img.shields.io/npm/dt/phrasekit)](https://www.npmjs.com/package/phrasekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/phrasekit)

## 💡 The Philosophy

I loved the privacy of **Mullvad VPN** and found their anonymous account system absolutely great! But for some reason, the idea of using a static 16-digit number didn't sound quite right and convenient in my head. So I decided to build **phrasekit** around few simple ideas:

- **Words are better than numbers:** They are easier to read, remember, and type, especially with autocomplete.
- **Passphrase is a secret, not an identity:** Unlike Mullvad's static account IDs, here a passphrase is more like a "password without a username". It generates a unique Hash ID for your database, but you can allow users to rotate or reset their phrases if needed.
- **Privacy by design:** No emails, phone numbers or names. Just words.

## 📦 Installation

```bash
npm install phrasekit
# or
pnpm add phrasekit
# or
bun add phrasekit
```

## 🚀 Quick Start

```typescript
import { phrasekit } from "phrasekit";

// 1. Generate a new 6-word secret
const phrase = phrasekit.generate(6);
console.log(phrase.toString()); // "glider confirm armhole swoop lacing lemon"

// 2. Get a unique ID for your database (server-side only)
const phraseHash = await phrase.hash({
    algorithm: "scrypt",
    salt: "your-app-salt",
});

// 3. Authenticate user input
// Use .suggest() for your UI autocomplete
const search = "app";
const suggestions = phrasekit.suggest(search); // ['apple', 'apply', 'appoint', ...]

try {
    const userPhrase = phrasekit.from(
        "glider confirm armhole swoop lacing lemon",
    );
    const userPhraseHash = await userPhrase.hash({
        algorithm: "scrypt",
        salt: "your-app-salt",
    });

    if (phraseHash === userPhraseHash) {
        // Access granted!
    }
} catch (e) {
    // Throws if words are not in the EFF dictionary or input is empty
}
```

## 🌈 API Reference

```typescript
// Toolkit itself
// The library exports a pre-instantiated `phrasekit` instance,
// but you can also import the class to use a custom wordlist.
class PhraseKit {
    constructor(customList?: string[]); // Can be created with a custom wordList if needed

    generate(count?: number): Phrase; // Generates a cryptographically secure Phrase object. Defaults to 6 words.

    from(input: string | string[], separator?: string): Phrase; // Creates a Phrase object from user input. Normalizes casing and spaces. Throws if words are invalid.

    suggest(prefix: string, limit?: number): string[]; // Returns words from the EFF dictionary starting with the prefix. Ready and perfect for UI autocomplete.

    validate(phrase: string | string[], separator?: string): boolean; // Quickly checks if the input is a valid phrase without throwing errors.
}

// Result returned by toolkit
class Phrase {
    readonly words: string[];

    get entropy(): number; // Calculation of bits of randomness (e.g., ~77.5 for 6 words).

    toString(): string;       // Returns the phrase joined by spaces.
    toJSON(): string[];       // Returns same output as this.words.
    join(separator: string):  // Returns the phrase with a custom separator (e.g., "-").
        string;

    hash(options: HashOptions): Promise; // Server-side only. Returns a hex-encoded hash. See below.
}

// Hashing options
type HashOptions =
    | { algorithm: "scrypt"; salt: string; cost?: number }  // cost = N param, default 16384
    | { algorithm: "hmac-sha256"; salt: string };
```

## 🔐 Hashing

`phrase.hash()` is a **server-side only** method. Calling it in a browser environment will throw an error. This is by design — keeping the browser bundle lightweight and zero-dependency.

```typescript
// ✅ scrypt (recommended — memory-hard, slow to brute-force)
const hash = await phrase.hash({
    algorithm: "scrypt",
    salt: "your-app-salt",
    cost: 16384, // optional, default is 16384 (N param)
});

// ✅ HMAC-SHA256 (faster, good for low-latency lookups)
const hash = await phrase.hash({
    algorithm: "hmac-sha256",
    salt: "your-app-salt",
});

// ❌ Throws in the browser
await phrase.hash({ algorithm: "scrypt", salt: "..." });
// Error: [PhraseKit] Hashing is disabled in the browser...
```

## 🤔 Wait, why not BIP39?

BIP39 is the standard for crypto wallets and I won't lie, it's what I wanted to use from the start! But I found it too rigid for simple account authentication:

1. **Better Wordlist:** BIP39 uses 2,048 words. **phrasekit** uses the [**EFF Large Wordlist**](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt) with 7,776 words. This means 6 words in phrasekit (~77 bits) provide significantly more entropy than 6 words in BIP39 (~66 bits).
2. **No Checksum Baggage:** BIP39 requires a specific checksum, which makes it impossible to just "pick" or "rotate" words freely. **phrasekit** is built for flexibility.
3. **Human-Centric:** EFF words were specifically designed to be easy to read and type, reducing errors when your users are logging in.
4. **Zero Dependencies:** Most BIP39 libraries pull in heavy crypto-dependencies. **phrasekit** is tiny and uses native Web Crypto API.

> A passphrase here isn't a seed phrase — it's a secret key. Lose it, generate a new one, and rotate your Hash ID. Simple.

## 📊 Let’s talk math (the fun kind)

You might wonder: _"Wait, isn't 6 words too few? Crypto wallets use 12!"_  
Here is how **phrasekit** stacks up against other methods when we talk about entropy (the "guessability" of your secret):

| Method                     | Combination pool | Entropy        | Best for           |
| :------------------------- | :--------------- | :------------- | :----------------- |
| **Mullvad ID** (16 digits) | $10^{16}$        | ~53 bits       | Online Auth        |
| **phrasekit** (6 words)    | $7,776^6$        | **~77.5 bits** | **The Sweet Spot** |
| **BIP39** (12 words)       | $2,048^{12}$     | ~128 bits      | Cold Storage       |

#### The "Online" Reality Check

The reason 12 words (BIP39) exist is to protect against **offline attacks**, where a hacker has your file and tries billions of keys per second on a massive GPU rig.

But **phrasekit** is for **online authentication**. Your server has rate limiting (hopefully!). Even if a hacker could try 100 phrases per second (which is a lot!), it would take them **more than a couple of hundred trillion years** to brute-force a 77-bit secret.

**The bottom line:** I chose 6 words because they are roughly **22,000,000 times more secure** than a standard 16-digit ID, while remaining short enough to type on a mobile keyboard without losing your mind. It’s the perfect balance between "impossible to guess" and "human-friendly".

And if you are _really_ paranoid, you can just call `phrasekit.generate(12)` and get 155 bits of entropy. That's more than some of hardware wallets.

## 💖 Inspirations and Thanks to

This project wouldn't exist without the amazing work of others:

- **[Mullvad VPN](https://mullvad.net/):** For proving that anonymous, ID-based authentication is not just possible, but actually great for privacy-focused apps. They were the spark that started this idea.
- **[Electronic Frontier Foundation (EFF)](https://www.eff.org/):** For their incredible research and the [Large Wordlist](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases). They did the heavy lifting of making secrets human-readable.
- **[Emil Bayes](https://github.com/emilbayes):** Thanks to his `eff-diceware-passphrase` library. It was the first place where I discovered the EFF wordlist and realized how cool word-based keys could be.

## 📄 License

MIT © 2026 by [Aria Lume](https://github.com/thearialume) <thearialume@gmail.com>
