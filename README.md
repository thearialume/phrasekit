# phrasekit ✨

**Human-friendly passphrases for privacy-first authentication.**

A lightweight, zero-dependency TypeScript library for generating and managing secure word-based keys. Inspired by Mullvad VPN, but made more human.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Size](https://img.shields.io/bundlephobia/minzip/phrasekit)

## 💡 The Philosophy

I loved the privacy of **Mullvad VPN**, but I always thought typing 16-digit numbers is quite uncomfortable. **phrasekit** is built on a few simple ideas:

- **Words are better than numbers:** They are easier to read, remember, and type, especially with autocomplete.
- **Passphrase is a secret, not an identity:** Unlike Mullvad's static account IDs, here a passphrase is more like a "password without a username". It generates a unique Hash ID for your database, but you can allow users to rotate or reset their phrases if needed.
- **Privacy by design:** No emails, phone numbers or names. Just words.

## 🚀 Quick Start

```typescript
import { phrasekit } from "phrasekit";

// 1. Generate a new 6-word secret
const phrase = phrasekit.generate(6);
console.log(phrase.toString()); // "glider confirm armhole swoop lacing lemon"

// 2. Get a unique ID for your database (salted)
const accountId = await phrase.hash("your-app-salt");

// 3. Authenticate user input
try {
    const userPhrase = phrasekit.from(
        "glider confirm armhole swoop lacing lemon",
    );
    const loginId = await userPhrase.hash("your-app-salt");

    if (loginId === accountId) {
        // Access granted!
    }
} catch (e) {
    // Throws if words are not in the EFF dictionary or input is empty
}
```

## 🌈 API Reference

### `phrasekit` (The Toolkit)

- **`generate(count?: number): Phrase`**
  Generates a cryptographically secure `Phrase` object. Defaults to 6 words.
- **`from(input: string | string[]): Phrase`**
  Creates a `Phrase` object from user input. Normalizes casing and spaces. Throws if words are invalid.
- **`suggest(prefix: string, limit?: number): string[]`**
  Returns words from the EFF dictionary starting with the prefix. Perfect for UI autocomplete.
- **`validate(input: string | string[]): boolean`**
  Quickly checks if the input is a valid phrase without throwing errors.

### `Phrase` (The Result)

- **`words: string[]`** — The raw array of words.
- **`entropy: number`** — Calculation of bits of randomness (e.g., ~77.5 for 6 words).
- **`toString()`** — Returns the phrase joined by spaces.
- **`join(separator: string)`** — Returns the phrase with a custom separator (e.g., `-`).
- **`hash(salt?: string): Promise<string>`** — Returns a SHA-256 hex-encoded hash.

## 🤔 Wait, why not BIP39?

BIP39 is the standard for crypto wallets, but it's often too rigid for simple account authentication:

1. **Better Wordlist:** BIP39 uses 2,048 words. **phrasekit** uses the **EFF Large Wordlist** with 7,776 words. This means 6 words in phrasekit (~77 bits) provide significantly more entropy than 6 words in BIP39 (~66 bits).
2. **No Checksum Baggage:** BIP39 requires a specific checksum, which makes it impossible to just "pick" or "rotate" words freely. **phrasekit** is built for flexibility.
3. **Human-Centric:** EFF words were specifically designed to be easy to read and type, reducing errors when your users are logging in.
4. **Zero Dependencies:** Most BIP39 libraries pull in heavy crypto-dependencies. **phrasekit** is tiny and uses native Web Crypto API.

> A passphrase here isn't a seed phrase — it's a secret key. Lose it, generate a new one, and rotate your Hash ID. Simple.

## 📄 License

MIT © 2026 by Aria Lume <thearialume@gmail.com>
