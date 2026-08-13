import * as repository from "./repository";

import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { cache, CacheKeys } from "../redis";
import { logger } from "../logger";
import { inventoryOperationsTotal, inventoryUnitsTotal } from "../metrics";

export async function validateStock(
    productId: string,
    quantity: number
) {
    const product = await repository.findProduct(
        productId
    );

    if (!product) {
        throw new NotFoundException(
            "Product not found."
        );
    }

    if (product.stock < quantity) {
        return {
            available: false,
            availableQuantity: product.stock,
        };
    }

    return {
        available: true,
        availableQuantity: product.stock,
    };
}

export async function reserveStock(
    productId: string,
    quantity: number
) {
    try {

        const product = await repository.reserveStock(
            productId,
            quantity
        );
        await Promise.all([cache.remove(CacheKeys.product(productId)), cache.clearPattern("products:*")]);
        inventoryOperationsTotal.inc({ operation: "reserve", result: "success" });
        inventoryUnitsTotal.inc({ operation: "reserve" }, quantity);
        logger.info({ productId, quantity }, "Stock Reserved");
        return product;

    } catch {
        inventoryOperationsTotal.inc({ operation: "reserve", result: "rejected" });

        throw new BadRequestException(
            "Insufficient stock."
        );

    }
}

export async function releaseStock(
    productId: string,
    quantity: number
) {
    const product = await repository.incrementStock(
        productId,
        quantity
    );
    await Promise.all([cache.remove(CacheKeys.product(productId)), cache.clearPattern("products:*")]);
    inventoryOperationsTotal.inc({ operation: "release", result: "success" });
    inventoryUnitsTotal.inc({ operation: "release" }, quantity);
    logger.info({ productId, quantity }, "Stock Released");
    return product;
}

export async function setStock(
    productId: string,
    quantity: number
) {
    if (quantity < 0) {
        throw new BadRequestException(
            "Stock cannot be negative."
        );
    }

    const product = await repository.updateStock(
        productId,
        quantity
    );
    await Promise.all([cache.remove(CacheKeys.product(productId)), cache.clearPattern("products:*")]);
    inventoryOperationsTotal.inc({ operation: "set", result: "success" });
    return product;
}
