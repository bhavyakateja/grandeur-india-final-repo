import type { Context } from "hono";
import * as productService from "./service";
import {
    createProductSchema,
    updateProductSchema,
    productQuerySchema,
} from "./schema";

export async function create(c: Context) {
    const body = await c.req.json();

    const data =
        createProductSchema.parse(
            body,
        );

    const product =
        await productService.create(
            data,
        );

    return c.json(
        product,
        201,
    );
}

/**
 * --------------------------------------------------------------------------
 * Storefront catalogue
 * --------------------------------------------------------------------------
 *
 * Returns the complete ACTIVE catalogue.
 *
 * The storefront performs search, filtering, sorting and pagination
 * entirely on the client.
 */
export async function getCatalogue(
    c: Context,
) {
    const products =
        await productService.getCatalogue();

    return c.json({
        items: products,
    });
}

/**
 * --------------------------------------------------------------------------
 * Homepage featured products
 * --------------------------------------------------------------------------
 *
 * Returns up to 6 dynamically selected products using the backend's
 * bestseller / new-arrival selection logic.
 */
export async function getFeatured(
    c: Context,
) {
    const products =
        await productService.getFeaturedProducts();

    return c.json({
        items: products,
    });
}

export async function getAll(c: Context) {
    const query =
        productQuerySchema.parse(
            c.req.query(),
        );

    const products =
        await productService.getAll(
            query,
        );

    return c.json(products);
}

export async function getById(c: Context) {
    const id =
        c.req.param("id")!;

    const product =
        await productService.getById(
            id,
        );

    return c.json(product);
}

export async function update(c: Context) {
    const id =
        c.req.param("id")!;

    const body =
        await c.req.json();

    const data =
        updateProductSchema.parse(
            body,
        );

    const product =
        await productService.update(
            id,
            data,
        );

    return c.json(product);
}

export async function remove(c: Context) {
    const id =
        c.req.param("id")!;

    await productService.remove(
        id,
    );

    return c.json({
        success: true,
        message:
            "Product deleted successfully",
    });
}

export { default as productRouter } from "./routes";