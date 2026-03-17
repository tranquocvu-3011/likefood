/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { PrismaClient } from "../generated/client";


const prismaClientSingleton = () => {
    return new PrismaClient();
};

/* eslint-disable no-var */
declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}
/* eslint-enable no-var */

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
