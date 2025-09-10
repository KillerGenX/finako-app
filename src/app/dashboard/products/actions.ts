"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Schemas... (existing schemas are unchanged)
const BaseProductSchema = z.object({
    name: z.string().min(3, { message: "Nama produk harus diisi." }),
    description: z.string().optional(),
    category_id: z.string().uuid().nullable().optional(),
    brand_id: z.string().uuid().nullable().optional(),
    tax_rate_ids: z.array(z.string().uuid()).optional(),
    product_type: z.enum(['SINGLE', 'VARIANT', 'COMPOSITE', 'SERVICE']),
});

const PricedProductSchema = BaseProductSchema.extend({
    selling_price: z.coerce.number().min(0, { message: "Harga jual harus diisi." }),
    cost_price: z.coerce.number().min(0).optional(),
    sku: z.string().optional(),
    track_stock: z.boolean(),
});

const VariantSchema = z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional(),
    name: z.string().min(1, { message: "Nama varian harus diisi." }),
    selling_price: z.coerce.number().min(0, { message: "Harga jual harus diisi." }),
    cost_price: z.coerce.number().min(0).optional(),
    sku: z.string().optional(),
    track_stock: z.boolean(),
});

const ImageSchema = z.object({
    image_url: z.any()
        .refine(file => !file || file.size === 0 || file.size <= MAX_FILE_SIZE, `Max 5MB.`)
        .refine(file => !file || file.size === 0 || ACCEPTED_IMAGE_TYPES.includes(file?.type), "Hanya .jpg, .png, .webp."),
});


export type FormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
};

// Helper functions... (existing helpers are unchanged)
async function getSupabaseAndOrgId() {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name: string) => cookieStore.get(name)?.value, set: (name: string, value: string, options) => cookieStore.set({ name, value, ...options }), remove: (name: string, options) => cookieStore.set({ name, value: '', ...options }), }, });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organisasi tidak ditemukan.");
    return { supabase, organization_id: member.organization_id };
}

function generateSku(productName: string): string {
    const prefix = productName.substring(0, 3).toUpperCase();
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNumber}`;
}

async function handleImageUpload(supabase: any, organization_id: string, imageFile: File) {
    if (!imageFile || imageFile.size === 0) return null;
    const fileName = `${organization_id}/${Date.now()}.${imageFile.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product_images').upload(fileName, imageFile);
    if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`);
    return supabase.storage.from('product_images').getPublicUrl(fileName).data.publicUrl;
}

async function updateProductTaxes(supabase: any, productId: string, taxRateIds: string[] | undefined) {
    await supabase.from('product_tax_rates').delete().eq('product_id', productId);
    if (taxRateIds && taxRateIds.length > 0) {
        const newTaxLinks = taxRateIds.map(taxId => ({ product_id: productId, tax_rate_id: taxId }));
        const { error } = await supabase.from('product_tax_rates').insert(newTaxLinks);
        if (error) throw new Error(`Gagal menyimpan pajak produk: ${error.message}`);
    }
}

// createProductTemplate... (existing function is unchanged)
export async function createProductTemplate(prevState: FormState, formData: FormData): Promise<FormState> {
    let templateId: string | null = null;
    const productType = formData.get('product_type') as 'SINGLE' | 'VARIANT' | 'COMPOSITE';

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData = Object.fromEntries(formData.entries());
        
        if (rawData.category_id === '') rawData.category_id = null;
        if (rawData.brand_id === '') rawData.brand_id = null;
        
        const imageFile = rawData.image_url as File;
        const taxIds = formData.getAll('tax_rate_ids') as string[];
        
        const fullRawData = { 
            ...rawData, 
            image_url: imageFile, 
            tax_rate_ids: taxIds,
            track_stock: rawData.track_stock === 'on'
        };

        const validationSchema = (productType === 'SINGLE' || productType === 'COMPOSITE')
            ? PricedProductSchema.extend({ image_url: ImageSchema.shape.image_url })
            : BaseProductSchema.extend({ image_url: ImageSchema.shape.image_url });

        const validatedFields = validationSchema.safeParse(fullRawData);

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }
        
        const { name, description, category_id, brand_id, tax_rate_ids } = validatedFields.data;
        const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);

        const { data: product, error: productError } = await supabase.from('products').insert({ 
            organization_id, 
            name, 
            description, 
            product_type: productType,
            category_id,
            brand_id,
            image_url: newImageUrl,
        }).select('id').single();

        if (productError) throw new Error(`Error saat menyimpan produk: ${productError.message}`);
        
        templateId = product.id;
        await updateProductTaxes(supabase, templateId, tax_rate_ids);

        if ((productType === 'SINGLE' || productType === 'COMPOSITE') && 'selling_price' in validatedFields.data) {
            const { selling_price, sku: rawSku, track_stock } = validatedFields.data;
            const cost_price = productType === 'SINGLE' ? validatedFields.data.cost_price : 0;
            
            let sku = rawSku;
            if (!sku || sku.trim() === '') {
                sku = generateSku(name);
            }

            const { error: variantError } = await supabase.from('product_variants').insert({
                organization_id,
                product_id: templateId,
                name: name,
                selling_price,
                cost_price: cost_price || 0,
                sku,
                track_stock,
                inventory_tracking_method: track_stock ? 'by_quantity' as const : 'none' as const,
            });

            if (variantError) {
                await supabase.from('products').delete().eq('id', templateId);
                if (variantError.code === '23505') return { message: `Error: SKU '${sku}' sudah ada.`, errors: { sku: ["SKU ini sudah digunakan."] } };
                throw new Error(`Gagal menyimpan varian produk: ${variantError.message}`);
            }
        }

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    if (productType === 'SINGLE') {
        revalidatePath('/dashboard/products');
        redirect('/dashboard/products');
    } else {
        redirect(`/dashboard/products/templates/${templateId}`);
    }
}


// ============== NEW COMPOSITE ACTIONS ==============

export async function searchProductsForComponent(query: string) {
    if (!query) return [];
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        
        // Use the existing RPC function which is perfect for this
        const { data, error } = await supabase
            .rpc('get_products_with_stock', { p_organization_id: organization_id });

        if (error) {
            throw new Error('Gagal mencari produk: ' + error.message);
        }

        // Filter in-memory based on the query. This is efficient for a reasonable number of products.
        // We search by name (case-insensitive) and SKU.
        const lowercasedQuery = query.toLowerCase();
        const results = data.filter(p => 
            p.name.toLowerCase().includes(lowercasedQuery) || 
            (p.sku && p.sku.toLowerCase().includes(lowercasedQuery))
        )
        // We only want to add SINGLE or VARIANT products as components
        .filter(p => p.product_type === 'SINGLE' || p.product_type === 'VARIANT')
        .slice(0, 10); // Limit results to avoid overwhelming the UI

        return results.map(p => ({
            id: p.id, // This is the variant_id, which is what we need to link
            name: p.name,
            sku: p.sku,
            image_url: p.image_url
        }));

    } catch (e: any) {
        console.error("Server Action Error:", e.message);
        // In a real app, you might want a more robust error handling/logging mechanism
        return [];
    }
}


// ... (rest of the existing functions: updateProductTemplate, addOrUpdateVariant, etc.)
export async function updateProductTemplate(prevState: FormState, formData: FormData): Promise<FormState> {
    const productId = formData.get('product_id') as string;
    if (!productId) return { message: "ID Produk tidak ditemukan.", errors: {} };
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData = Object.fromEntries(formData.entries());

        if (rawData.category_id === 'null' || rawData.category_id === '') rawData.category_id = null;
        if (rawData.brand_id === 'null' || rawData.brand_id === '') rawData.brand_id = null;

        const imageFile = rawData.image_url as File;
        const taxIds = formData.getAll('tax_rate_ids') as string[];
        const validationSchema = BaseProductSchema.omit({product_type: true}).extend({ image_url: ImageSchema.shape.image_url });
        const validatedFields = validationSchema.safeParse({ ...rawData, image_url: imageFile, tax_rate_ids: taxIds });
        if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        
        const { name, description, category_id, brand_id, tax_rate_ids } = validatedFields.data;
        const { data: existingProduct } = await supabase.from('products').select('image_url').eq('id', productId).single();
        const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);

        const { error: productError } = await supabase.from('products').update({
            name, description,
            category_id,
            brand_id,
            image_url: newImageUrl === null ? existingProduct?.image_url : newImageUrl,
        }).eq('id', productId);
        if (productError) throw new Error(`Error saat memperbarui produk: ${productError.message}`);

        if (newImageUrl && existingProduct?.image_url) {
            const oldImageName = existingProduct.image_url.split('/').pop();
            if(oldImageName) await supabase.storage.from('product_images').remove([`${organization_id}/${oldImageName}`]);
        }

        await updateProductTaxes(supabase, productId, tax_rate_ids);
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    revalidatePath(`/dashboard/products/templates/${productId}`);
    return { message: "success" };
}

export async function addOrUpdateVariant(prevState: FormState, formData: FormData): Promise<FormState> {
    const productId = formData.get('product_id') as string;
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData = { ...Object.fromEntries(formData.entries()), track_stock: formData.get('track_stock') === 'on' };
        const validatedFields = VariantSchema.safeParse(rawData);
        if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };

        let { variant_id, name, selling_price, cost_price, sku, track_stock } = validatedFields.data;
        if (!sku || sku.trim() === '') {
            const { data: product } = await supabase.from('products').select('name').eq('id', productId).single();
            sku = generateSku(`${product?.name}-${name}`);
        }

        const variantData = {
            organization_id, product_id: productId, name, selling_price,
            cost_price: cost_price || 0, sku, track_stock,
            inventory_tracking_method: track_stock ? 'by_quantity' as const : 'none' as const,
        };

        if (variant_id) {
            const { error } = await supabase.from('product_variants').update(variantData).eq('id', variant_id);
            if (error) throw new Error(`Gagal memperbarui varian: ${error.message}`);
        } else {
            const { error } = await supabase.from('product_variants').insert(variantData);
            if (error) {
                if (error.code === '23505') return { message: `Error: SKU '${sku}' sudah ada.`, errors: { sku: ["SKU ini sudah digunakan."] } };
                throw new Error(`Gagal menambah varian: ${error.message}`);
            }
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    revalidatePath(`/dashboard/products/templates/${productId}`);
    return { message: "success" };
}

export async function deleteProductTemplate(formData: FormData): Promise<void> {
    const productId = formData.get('product_id') as string;
    if (!productId) throw new Error("ID Produk tidak ditemukan.");

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data: product, error } = await supabase.from('products')
            .select('image_url')
            .eq('id', productId)
            .eq('organization_id', organization_id)
            .single();

        if (error || !product) throw new Error("Produk tidak ditemukan atau Anda tidak memiliki izin.");
        
        const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
        if (deleteError) throw new Error(`Gagal menghapus produk: ${deleteError.message}`);

        if (product.image_url) {
            const imageName = product.image_url.split('/').pop();
            if (imageName) await supabase.storage.from('product_images').remove([`${organization_id}/${imageName}`]);
        }
    } catch (e: any) {
        console.error(e.message);
    }

    revalidatePath('/dashboard/products');
    redirect('/dashboard/products');
}

export async function deleteVariant(formData: FormData): Promise<{ message: string }> {
    const variantId = formData.get('variant_id') as string;
    let productId = '';
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data: variant, error: fetchError } = await supabase.from('product_variants').select('product_id, product:products(image_url)').eq('id', variantId).eq('organization_id', organization_id).single();
        if (fetchError || !variant) throw new Error("Produok tidak ditemukan.");
        
        productId = variant.product_id;
        const { count } = await supabase.from('product_variants').select('*', { count: 'exact' }).eq('product_id', productId);

        if (count === 1) {
            const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
            if (deleteError) throw new Error(`Gagal menghapus produk: ${deleteError.message}`);
            if (variant.product?.image_url) {
                const oldImageName = variant.product.image_url.split('/').pop();
                if(oldImageName) await supabase.storage.from('product_images').remove([`${organization_id}/${oldImageName}`]);
            }
        } else {
            const { error: deleteError } = await supabase.from('product_variants').delete().eq('id', variantId);
            if (deleteError) throw new Error(`Gagal menghapus varian: ${deleteError.message}`);
        }
    } catch (e: any) {
        console.error(e);
        return { message: e.message };
    }
    
    if(productId) revalidatePath(`/dashboard/products/templates/${productId}`);
    revalidatePath('/dashboard/products');
    return { message: "Item berhasil dihapus." };
}
