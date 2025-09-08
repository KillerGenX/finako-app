"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const BaseProductSchema = z.object({
    name: z.string().min(3, { message: "Nama produk harus diisi." }),
    selling_price: z.coerce.number().min(0),
    cost_price: z.coerce.number().min(0).optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    track_stock: z.boolean(), // Expect a true boolean
    category_id: z.string().nullable().optional(),
    brand_id: z.string().nullable().optional(),
    tax_rate_ids: z.array(z.string().uuid()).optional(),
});

const ImageSchema = z.object({
    image_url: z.any()
        .refine(file => file?.size <= MAX_FILE_SIZE, `Max 5MB.`)
        .refine(file => ACCEPTED_IMAGE_TYPES.includes(file?.type), "Hanya .jpg, .png, .webp."),
});

export type FormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
};

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

async function updateProductTaxes(supabase: any, productId: string, taxRateIds: string[]) {
    await supabase.from('product_tax_rates').delete().eq('product_id', productId);
    if (taxRateIds.length > 0) {
        const newTaxLinks = taxRateIds.map(taxId => ({ product_id: productId, tax_rate_id: taxId }));
        await supabase.from('product_tax_rates').insert(newTaxLinks);
    }
}

function processFormData(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const imageFile = rawData.image_url as File;
    
    // Convert checkbox value to boolean before validation
    const processedData = {
        ...rawData,
        track_stock: rawData.track_stock === 'on',
        tax_rate_ids: formData.getAll('tax_rate_ids'),
    };

    return { processedData, imageFile };
}

export async function createProduct(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { processedData, imageFile } = processFormData(formData);
        
        const validationSchema = BaseProductSchema.extend(imageFile && imageFile.size > 0 ? { image_url: ImageSchema.shape.image_url } : {});
        const validatedFields = validationSchema.safeParse(processedData);

        if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        
        let { name, selling_price, cost_price, sku, description, track_stock, category_id, brand_id, tax_rate_ids } = validatedFields.data;

        if (!sku || sku.trim() === '') sku = generateSku(name);
        
        const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);

        const { data: product, error: productError } = await supabase.from('products').insert({ 
            organization_id, name, description, product_type: 'SINGLE',
            category_id: category_id === 'null' ? null : category_id,
            brand_id: brand_id === 'null' ? null : brand_id,
            image_url: newImageUrl,
        }).select('id').single();

        if (productError) throw new Error(`Error saat menyimpan produk: ${productError.message}`);
        
        if(tax_rate_ids) await updateProductTaxes(supabase, product.id, tax_rate_ids);

        const { error: variantError } = await supabase.from('product_variants').insert({
            organization_id, product_id: product.id, name, selling_price,
            cost_price: cost_price || 0, sku, track_stock,
            inventory_tracking_method: track_stock ? 'by_quantity' : 'none',
        });
        
        if (variantError) {
            await supabase.from('products').delete().eq('id', product.id);
            if (variantError.code === '23505') return { message: `Error: SKU '${sku}' sudah ada.`, errors: { sku: ["SKU ini sudah digunakan."] } };
            throw new Error(`Error saat menyimpan varian: ${variantError.message}`);
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    
    revalidatePath('/dashboard/products');
    redirect('/dashboard/products');
}

export async function updateProduct(prevState: FormState, formData: FormData): Promise<FormState> {
    const variantId = formData.get('variant_id') as string;
    if (!variantId) return { message: "Error: ID Varian tidak ditemukan.", errors: {} };
    
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { processedData, imageFile } = processFormData(formData);

        const validationSchema = BaseProductSchema.extend(imageFile && imageFile.size > 0 ? { image_url: ImageSchema.shape.image_url } : {});
        const validatedFields = validationSchema.safeParse(processedData);

        if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        
        let { name, selling_price, cost_price, sku, description, track_stock, category_id, brand_id, tax_rate_ids } = validatedFields.data;
        if (!sku || sku.trim() === '') sku = generateSku(name);

        const { data: variant, error: fetchError } = await supabase.from('product_variants').select('product_id, product:products!inner(id, image_url)').eq('id', variantId).single();
        if (fetchError || !variant || !variant.product) throw new Error("Varian produk tidak ditemukan.");
        const { id: productId, image_url: oldImageUrl } = variant.product;

        const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);
        
        await updateProductTaxes(supabase, productId, tax_rate_ids || []);

        const { error: productError } = await supabase.from('products').update({ 
            name, description,
            category_id: category_id === 'null' ? null : category_id,
            brand_id: brand_id === 'null' ? null : brand_id,
            image_url: newImageUrl === null ? oldImageUrl : newImageUrl,
        }).eq('id', productId);
            
        if (productError) throw new Error(`Error saat memperbarui produk: ${productError.message}`);

        if (newImageUrl && oldImageUrl) {
            const oldImageName = oldImageUrl.split('/').pop();
            if(oldImageName) await supabase.storage.from('product_images').remove([`${organization_id}/${oldImageName}`]);
        }
        
        const { error: variantError } = await supabase.from('product_variants').update({ name, selling_price, cost_price: cost_price || 0, sku, track_stock, inventory_tracking_method: track_stock ? 'by_quantity' : 'none' }).eq('id', variantId);
        
        if (variantError) {
             if (variantError.code === '23505') return { message: `Error: SKU '${sku}' sudah ada.`, errors: { sku: ["SKU ini sudah digunakan."] } };
            throw new Error(`Error saat memperbarui varian: ${variantError.message}`);
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    revalidatePath('/dashboard/products');
    redirect('/dashboard/products');
}

export async function deleteProduct(formData: FormData): Promise<{ message: string }> {
    const variantId = formData.get('variant_id') as string;
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data: variant, error: fetchError } = await supabase.from('product_variants').select('product_id, product:products(image_url)').eq('id', variantId).eq('organization_id', organization_id).single();
        if (fetchError || !variant) throw new Error("Produk tidak ditemukan.");
        
        const { error: deleteError } = await supabase.from('products').delete().eq('id', variant.product_id);
        if (deleteError) throw new Error(`Gagal menghapus produk: ${deleteError.message}`);

        if (variant.product?.image_url) {
            const oldImageName = variant.product.image_url.split('/').pop();
            if(oldImageName) await supabase.storage.from('product_images').remove([`${organization_id}/${oldImageName}`]);
        }
    } catch (e: any) {
        console.error(e);
        return { message: e.message };
    }
    revalidatePath('/dashboard/products');
    return { message: "Produk berhasil dihapus." };
}
