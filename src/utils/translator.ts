import { useState, useEffect } from 'react';

// Character sets for generating codes
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIALS = '@&#$%*+=?/~-';
const ALL_CHARS = LETTERS + DIGITS + SPECIALS;

// Helper to generate a random integer between min and max (inclusive)
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate a random code ensuring at least one of each type
const generateCode = (): string => {
  const length = randomInt(5, 12);
  let codeChars: string[] = [];
  
  // Ensure at least one of each type
  codeChars.push(LETTERS[randomInt(0, LETTERS.length - 1)]);
  codeChars.push(DIGITS[randomInt(0, DIGITS.length - 1)]);
  codeChars.push(SPECIALS[randomInt(0, SPECIALS.length - 1)]);
  
  // Fill the rest randomly
  for (let i = 3; i < length; i++) {
    codeChars.push(ALL_CHARS[randomInt(0, ALL_CHARS.length - 1)]);
  }
  
  // Shuffle the characters
  for (let i = codeChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [codeChars[i], codeChars[j]] = [codeChars[j], codeChars[i]];
  }
  
  return codeChars.join('');
};

// Type for the dictionary
type Dictionary = Record<string, string>;

export class TranslatorService {
  private dictionary: Dictionary;
  private listeners: (() => void)[] = [];

  constructor() {
    // Load dictionary from local storage if available
    const saved = localStorage.getItem('name_lang_dictionary');
    this.dictionary = saved ? JSON.parse(saved) : {};
  }

  private save() {
    localStorage.setItem('name_lang_dictionary', JSON.stringify(this.dictionary));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Translate Russian/Text to "Name" language
  toName(text: string): string {
    // Regex to match words (Russian, English, digits mixed with letters)
    // We treat anything that looks like a word as a token to be translated
    // Punctuation and spaces are preserved
    const result = text.replace(/([a-zA-Zа-яА-ЯёЁ0-9]+)/g, (match) => {
      const code = generateCode();
      // Store the mapping: Code -> Original Word
      this.dictionary[code] = match;
      return code;
    });
    this.save();
    return result;
  }

  // Translate "Name" language back to original text
  toRussian(text: string): string {
    // We need to tokenize by potential codes. 
    // Since codes can contain special chars, we need to be careful.
    // However, the prompt implies we just reverse the process.
    // We can try to match known codes from our dictionary first?
    // Or just tokenize by spaces/punctuation and check if the token exists in dictionary.
    
    // A simpler approach for "Name" -> Russian is to look for valid codes in the string.
    // But codes might contain punctuation-like characters. 
    // Let's assume tokens are separated by whitespace or standard punctuation that ISN'T part of the code.
    // Actually, the prompt says "Punctuation is preserved".
    // And codes contain: @, &, #, $, %, *, +, =, ?, /, ~, -
    // Standard punctuation like . , ! : ; " ' ( ) [ ] { } are likely NOT part of the code unless specified.
    // The allowed special chars are specific.
    
    // Let's construct a regex for allowed code characters.
    const codeRegex = /[A-Za-z0-9@&#$%*+=?/~-]+/g;
    
    return text.replace(codeRegex, (match) => {
      if (this.dictionary[match]) {
        return this.dictionary[match];
      }
      return match; // Return as is if not found (unknown code)
    });
  }

  // Clear memory
  clear() {
    this.dictionary = {};
    this.save();
  }
}

export const translator = new TranslatorService();
