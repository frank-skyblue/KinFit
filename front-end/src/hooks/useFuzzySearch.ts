import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { doubleMetaphone } from 'double-metaphone';

interface UseFuzzySearchOptions<T> {
    items: T[];
    keys: (keyof T | string)[];
    searchTerm: string;
    threshold?: number;
}

/** Resolve a top-level key on an object, returning an array of string values */
const resolveKey = (obj: unknown, key: string): string[] => {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'string') return [val];
    if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
    return [];
};

/**
 * Greedy prefix-per-word matcher.
 * Consumes as many leading characters of each word as possible from `term`.
 * e.g. "bp" → bench press, "benpr" → bench press, "legr" → leg raise
 */
const matchesPrefixes = (text: string, term: string): boolean => {
    const words = text.toLowerCase().split(/\s+/);
    const search = term.toLowerCase();
    let ci = 0;
    for (const word of words) {
        if (ci >= search.length) break;
        let wi = 0;
        while (wi < word.length && ci < search.length && word[wi] === search[ci]) {
            wi++;
            ci++;
        }
    }
    return ci === search.length;
};

/** Get both metaphone codes for a word (primary + secondary) */
const phoneCodes = (word: string): string[] => {
    const [primary, secondary] = doubleMetaphone(word);
    const codes = [primary];
    if (secondary && secondary !== primary) codes.push(secondary);
    return codes;
};

/**
 * Phonetic matcher — checks if each search word has a phonetic match
 * against at least one word in the text.
 * e.g. "skwat" matches "squat", "bysep kurl" matches "bicep curl"
 */
const matchesPhonetic = (text: string, term: string): boolean => {
    const textWords = text.toLowerCase().split(/\s+/).filter(Boolean);
    const searchWords = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (searchWords.length === 0) return false;

    // Pre-compute phonetic codes for text words
    const textCodes = textWords.map((w) => phoneCodes(w));

    // Every search word must phonetically match at least one text word
    return searchWords.every((sw) => {
        const swCodes = phoneCodes(sw);
        return textCodes.some((twCodes) =>
            swCodes.some((sc) => twCodes.some((tc) => sc === tc))
        );
    });
};

const useFuzzySearch = <T>({ items, keys, searchTerm, threshold = 0.35 }: UseFuzzySearchOptions<T>): T[] => {
    const fuse = useMemo(
        () => new Fuse(items, { keys: keys as string[], threshold, ignoreLocation: true, includeScore: true }),
        [items, keys, threshold]
    );

    const term = searchTerm.trim();
    if (!term) return items;

    // 1. Fuse fuzzy results (typo tolerance)
    const fuseResults = fuse.search(term).map((r) => r.item);
    const seen = new Set<T>(fuseResults);

    // 2. Prefix-per-word results (e.g. "bp" → bench press)
    const prefixResults: T[] = [];
    for (const item of items) {
        if (seen.has(item)) continue;
        const matched = keys.some((key) =>
            resolveKey(item, key as string).some((val) => matchesPrefixes(val, term))
        );
        if (matched) {
            prefixResults.push(item);
            seen.add(item);
        }
    }

    // 3. Phonetic results (e.g. "skwat" → squat, "bysep" → bicep)
    const phoneticResults: T[] = [];
    for (const item of items) {
        if (seen.has(item)) continue;
        const matched = keys.some((key) =>
            resolveKey(item, key as string).some((val) => matchesPhonetic(val, term))
        );
        if (matched) {
            phoneticResults.push(item);
            seen.add(item);
        }
    }

    // Ranked: fuse (best relevance) → prefix → phonetic
    return [...fuseResults, ...prefixResults, ...phoneticResults];
};

export default useFuzzySearch;
