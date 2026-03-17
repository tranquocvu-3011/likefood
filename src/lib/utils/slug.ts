/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

export function generateSlug(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Normalize specialized characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
}
