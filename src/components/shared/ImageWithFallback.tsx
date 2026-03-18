"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

import { useState, useEffect } from "react";
import NextImage, { ImageProps } from "next/image";

const FALLBACK_SRC = "/placeholder.svg";

type ImageWithFallbackProps = Omit<ImageProps, "src"> & {
    src?: string | null;
    fallbackSrc?: string;
};

/**
 * Drop-in replacement for next/image that gracefully falls back to a
 * placeholder when the original image is missing or fails to load.
 */
export default function ImageWithFallback({
    src,
    fallbackSrc = FALLBACK_SRC,
    alt,
    ...props
}: ImageWithFallbackProps) {
    const resolved = src || fallbackSrc;
    const [imgSrc, setImgSrc] = useState<string>(resolved);
    const [errored, setErrored] = useState(false);

    // Sync imgSrc when the src prop changes (e.g. carousel slide change)
    useEffect(() => {
        const next = src || fallbackSrc;
        setImgSrc(next);
        setErrored(false);
    }, [src, fallbackSrc]);

    return (
        <NextImage
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => {
                if (!errored) {
                    setErrored(true);
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}
