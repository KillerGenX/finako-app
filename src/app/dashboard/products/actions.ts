"use server";

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// ============== Schemas ==============
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const BaseProductSchema = z.object({
    name: z.string().min(3, { message: "Nama produk/jasa harus diisi." }),
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
    reorder_point: z.coerce.number().min(0).optional(),
    reorder_quantity: z.coerce.number().min(0).optional(),
});

const ImageSchema = z.object({
    image_url: z.any()
        .refine(file => !file || file.size === 0 || file.size <= MAX_FILE_SIZE, `Max 5MB.`)
        .refine(file => !file || file.size === 0 || ACCEPTED_IMAGE_TYPES.includes(file?.type), "Hanya .jpg, .png, .webp."),
});

const AddComponentSchema = z.object({
    parent_product_id: z.string().uuid(),
    component_variant_id: z.string().uuid(),
    quantity: z.coerce.number().min(0.0001, { message: "Kuantitas harus lebih dari 0." }),
});

const UpdateComponentQuantitySchema = z.object({
    component_id: z.string().uuid(),
    quantity: z.coerce.number().min(0.0001, { message: "Kuantitas harus lebih dari 0." }),
    product_id: z.string().uuid(),
});

const RemoveComponentSchema = z.object({
    component_id: z.string().uuid(),
    product_id: z.string().uuid(),
});


export type FormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
};

async function getSupabaseAndOrgId() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} },
            },
        }
    );
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

async function handleImageUpload(supabase: any, organization_id: string, imageFile: File | undefined) {
    if (!imageFile || imageFile.size === 0) return null;
    const fileName = `${organization_id}/${Date.now()}.${imageFile.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product_images').upload(fileName, imageFile);
    if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`);
    const { data } = supabase.storage.from('product_images').getPublicUrl(fileName);
    return data.publicUrl;
}

async function updateProductTaxes(supabase: any, productId: string, taxRateIds: string[] | undefined) {
    await supabase.from('product_tax_rates').delete().eq('product_id', productId);
    if (taxRateIds && taxRateIds.length > 0) {
        const newTaxLinks = taxRateIds.map(taxId => ({ product_id: productId, tax_rate_id: taxId }));
        const { error } = await supabase.from('product_tax_rates').insert(newTaxLinks);
        if (error) throw new Error(`Gagal menyimpan pajak produk: ${error.message}`);
    }
}

// Server Actions
export async function createProductTemplate(prevState: FormState, formData: FormData): Promise<FormState> {
    const productType = formData.get('product_type') as 'SINGLE' | 'VARIANT' | 'COMPOSITE' | 'SERVICE';
    let redirectUrl: string | null = null;

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData: { [k: string]: FormDataEntryValue | null } = Object.fromEntries(formData.entries());

        if (rawData.category_id === '') rawData.category_id = null;
        if (rawData.brand_id === '') rawData.brand_id = null;

        const imageFile = rawData.image_url as File;
        const taxIds = formData.getAll('tax_rate_ids') as string[];
        
        const fullRawData = { ...rawData, image_url: imageFile, tax_rate_ids: taxIds, track_stock: rawData.track_stock === 'on' };

        const PricedSchemaWithImage = PricedProductSchema.extend({ image_url: ImageSchema.shape.image_url });
        // FIX: Corrected self-referencing typo
        const BaseSchemaWithImage = BaseProductSchema.extend({ image_url: ImageSchema.shape.image_url });
        
        if (productType === 'SINGLE' || productType === 'COMPOSITE' || productType === 'SERVICE') {
            const validatedFields = PricedSchemaWithImage.safeParse(fullRawData);
            if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
            
            let { name, description, category_id, brand_id, tax_rate_ids: validatedTaxIds, selling_price, sku: rawSku } = validatedFields.data;
            let track_stock = productType === 'SERVICE' ? false : validatedFields.data.track_stock;
            const cost_price = productType === 'SINGLE' ? validatedFields.data.cost_price : 0;
            const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);

            const { data: product, error: productError } = await supabase.from('products').insert({ 
                organization_id, name, description, product_type: productType,
                category_id: category_id ?? null,
                brand_id: brand_id ?? null,
                image_url: newImageUrl,
            }).select('id').single();

            if (productError) throw new Error(`Error saat menyimpan produk: ${productError.message}`);
            const templateId = product.id;
            await updateProductTaxes(supabase, templateId, validatedTaxIds);

            let sku = rawSku;
            if (!sku || sku.trim() === '') sku = generateSku(name);

            const { error: variantError } = await supabase.from('product_variants').insert({
                organization_id, product_id: templateId, name: name, selling_price,
                cost_price: cost_price || 0, sku, track_stock,
                inventory_tracking_method: track_stock ? 'by_quantity' : 'none',
            });

            if (variantError) {
                await supabase.from('products').delete().eq('id', templateId);
                if (variantError.code === '23505') return { message: `Error: SKU '${sku}' sudah ada.`, errors: { sku: ["SKU ini sudah digunakan."] } };
                throw new Error(`Gagal menyimpan varian produk: ${variantError.message}`);
            }
            
            if (productType === 'SINGLE' || productType === 'SERVICE') {
                redirectUrl = '/dashboard/products';
            } else { // COMPOSITE
                redirectUrl = `/dashboard/products/templates/${templateId}`;
            }
        } else { // VARIANT
            const validatedFields = BaseSchemaWithImage.safeParse(fullRawData);
            if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
            
            const { name, description, category_id, brand_id, tax_rate_ids: validatedTaxIds } = validatedFields.data;
            const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);

            const { data: product, error: productError } = await supabase.from('products').insert({ 
                organization_id, name, description, product_type: productType,
                category_id: category_id ?? null,
                brand_id: brand_id ?? null,
                image_url: newImageUrl,
            }).select('id').single();

            if (productError) throw new Error(`Error saat menyimpan produk: ${productError.message}`);
            const templateId = product.id;
            await updateProductTaxes(supabase, templateId, validatedTaxIds);
            
            redirectUrl = `/dashboard/products/templates/${templateId}`;
        }
    } catch (e: any) {
        return { message: e.message, errors: {} };
    }

    revalidatePath('/dashboard/products');
    if (redirectUrl) {
        redirect(redirectUrl);
    }

    return { message: 'success' };
}

export async function searchProductsForComponent(query: string) {
    if (query.length < 2) return [];
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data, error } = await supabase.rpc('get_products_with_stock', { p_organization_id: organization_id });
        if (error) throw new Error('Gagal mencari produk: ' + error.message);

        const lowercasedQuery = query.toLowerCase();
        const results = data
            .filter((p: any) => p.product_type === 'SINGLE' || p.product_type === 'VARIANT')
            .filter((p: any) => p.name.toLowerCase().includes(lowercasedQuery) || (p.sku && p.sku.toLowerCase().includes(lowercasedQuery)))
            .slice(0, 10);

        return results.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku, image_url: p.image_url }));
    } catch (e: any) {
        console.error("Server Action Error:", e.message);
        return [];
    }
}

export async function addComponentToComposite(prevState: FormState, formData: FormData): Promise<FormState> {
    const parentProductId = formData.get('parent_product_id') as string;
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData = Object.fromEntries(formData.entries());
        const validatedFields = AddComponentSchema.safeParse(rawData);

        if (!validatedFields.success) return { message: "Data tidak valid.", errors: validatedFields.error.flatten().fieldErrors };

        const { component_variant_id, quantity } = validatedFields.data;
        
        const { data: parentVariant, error: parentVariantError } = await supabase.from('product_variants').select('id').eq('product_id', parentProductId).eq('organization_id', organization_id).single();
        if (parentVariantError || !parentVariant) throw new Error("Varian produk komposit tidak ditemukan.");
        
        if (parentVariant.id === component_variant_id) return { message: "Tidak bisa menambahkan produk sebagai komponennya sendiri.", errors: {} };

        const { data: uom, error: uomError } = await supabase.from('units_of_measure').select('id').eq('organization_id', organization_id).ilike('name', 'Unit').single();
        if (uomError) {
             const { data: uomPcs, error: uomPcsError } = await supabase.from('units_of_measure').select('id').eq('organization_id', organization_id).ilike('name', 'Pcs').single();
             if(uomPcsError || !uomPcs) throw new Error("Satuan unit 'Unit' atau 'Pcs' tidak ditemukan.");
             return await saveComponent(supabase, organization_id, parentVariant.id, component_variant_id, quantity, uomPcs.id, parentProductId);
        }

        return await saveComponent(supabase, organization_id, parentVariant.id, component_variant_id, quantity, uom.id, parentProductId);

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
}

async function saveComponent(supabase: any, orgId: string, parentVarId: string, compVarId: string, qty: number, uomId: string, parentProdId: string) {
    const { data: existing } = await supabase.from('product_composites').select('id, quantity').eq('parent_variant_id', parentVarId).eq('component_variant_id', compVarId).single();
    
    if (existing) {
        const newQuantity = (existing.quantity || 0) + qty;
        const { error: updateError } = await supabase.from('product_composites').update({ quantity: newQuantity }).eq('id', existing.id);
        if (updateError) throw new Error(`Gagal memperbarui kuantitas: ${updateError.message}`);
    } else {
        const { error: insertError } = await supabase.from('product_composites').insert({
            organization_id: orgId, 
            parent_variant_id: parentVarId, 
            component_variant_id: compVarId, 
            quantity: qty,
            unit_of_measure_id: uomId,
        });
        if (insertError) throw new Error(`Gagal menambahkan komponen: ${insertError.message}`);
    }
    revalidatePath(`/dashboard/products/templates/${parentProdId}`);
    return { message: "success" };
}

export async function updateComponentQuantity(formData: FormData) {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData = Object.fromEntries(formData.entries());
        const validatedFields = UpdateComponentQuantitySchema.safeParse(rawData);

        if (!validatedFields.success) {
            console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
            return;
        }

        const { component_id, quantity, product_id } = validatedFields.data;

        const { error } = await supabase
            .from('product_composites')
            .update({ quantity })
            .eq('id', component_id)
            .eq('organization_id', organization_id); 

        if (error) throw new Error(`Gagal memperbarui kuantitas: ${error.message}`);
        revalidatePath(`/dashboard/products/templates/${product_id}`);
    } catch(e: any) {
        console.error(e.message);
    }
}

export async function removeComponentFromComposite(formData: FormData) {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData = Object.fromEntries(formData.entries());
        const validatedFields = RemoveComponentSchema.safeParse(rawData);

        if (!validatedFields.success) {
            console.error("Validation failed:", validatedFields.error.flatten().fieldErrors);
            return;
        }

        const { component_id, product_id } = validatedFields.data;

        const { error } = await supabase
            .from('product_composites')
            .delete()
            .eq('id', component_id)
            .eq('organization_id', organization_id);

        if (error) {
            throw new Error(`Gagal menghapus komponen: ${error.message}`);
        }

        revalidatePath(`/dashboard/products/templates/${product_id}`);

    } catch(e: any) {
        console.error(e.message);
    }
}


export async function updateProductTemplate(prevState: FormState, formData: FormData): Promise<FormState> {
    const productId = formData.get('product_id') as string;
    if (!productId) return { message: "ID Produk tidak ditemukan.", errors: {} };

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const rawData: { [k: string]: FormDataEntryValue | null } = Object.fromEntries(formData.entries());

        if (rawData.category_id === 'null' || rawData.category_id === '') rawData.category_id = null;
        if (rawData.brand_id === 'null' || rawData.brand_id === '') rawData.brand_id = null;

        const imageFile = rawData.image_url as File;
        const taxIds = formData.getAll('tax_rate_ids') as string[];
        
        const validationSchema = BaseProductSchema.omit({product_type: true}).extend({ image_url: ImageSchema.shape.image_url });
        const validatedFields = validationSchema.safeParse({ ...rawData, image_url: imageFile, tax_rate_ids: taxIds });

        if (!validatedFields.success) return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        
        const { name, description, category_id, brand_id, tax_rate_ids: validatedTaxIds } = validatedFields.data;
        const { data: existingProduct } = await supabase.from('products').select('image_url').eq('id', productId).single();
        const newImageUrl = await handleImageUpload(supabase, organization_id, imageFile);

        const { error: productError } = await supabase.from('products').update({
            name, description,
            category_id: category_id ?? null,
            brand_id: brand_id ?? null,
            image_url: newImageUrl === null ? existingProduct?.image_url : newImageUrl,
        }).eq('id', productId);

        if (productError) throw new Error(`Error saat memperbarui produk: ${productError.message}`);

        if (newImageUrl && existingProduct?.image_url) {
            const oldImageName = existingProduct.image_url.split('/').pop();
            if (oldImageName) await supabase.storage.from('product_images').remove([`${organization_id}/${oldImageName}`]);
        }
        await updateProductTaxes(supabase, productId, validatedTaxIds);

    } catch (e: any) {
        return { message: e.message, errors: {} };
    }
    revalidatePath(`/dashboard/products/templates/${productId}`);
    return { message: "success" };
}

export async function addOrUpdateVariant(prevState: FormState, formData: FormData): Promise<FormState> {
    const productId = formData.get('product_id') as string;
    try {
        const supabaseAndOrg = await getSupabaseAndOrgId();
        if(!supabaseAndOrg) {
            throw new Error("Gagal mendapatkan info otorisasi.");
        }
        const { supabase, organization_id } = supabaseAndOrg;

        const rawData = { 
            ...Object.fromEntries(formData.entries()), 
            track_stock: formData.get('track_stock') === 'on' 
        };
        const validatedFields = VariantSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors };
        }

        let { 
            variant_id, name, selling_price, cost_price, sku, track_stock,
            reorder_point, reorder_quantity 
        } = validatedFields.data;
        
        if (!sku || sku.trim() === '') {
            const { data: product } = await supabase.from('products').select('name').eq('id', productId).single();
            sku = generateSku(`${product?.name}-${name}`);
        }

        const variantData = {
            organization_id, 
            product_id: productId, 
            name, 
            selling_price,
            cost_price: cost_price || 0, 
            sku, 
            track_stock,
            inventory_tracking_method: track_stock ? 'by_quantity' as const : 'none' as const,
            reorder_point: track_stock ? (reorder_point || 0) : 0,
            reorder_quantity: track_stock ? (reorder_quantity || 0) : 0,
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


// (Fungsi delete tidak berubah)
export async function deleteProductTemplate(formData: FormData): Promise<void> {
    const productId = formData.get('product_id') as string;
    if (!productId) throw new Error("ID Produk tidak ditemukan.");

    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data: product } = await supabase.from('products').select('image_url').eq('id', productId).eq('organization_id', organization_id).single();
        if (!product) throw new Error("Produk tidak ditemukan atau Anda tidak memiliki izin.");

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

export async function deleteVariant(formData: FormData): Promise<void> {
    const variantId = formData.get('variant_id') as string;
    if (!variantId) {
        console.error("Delete variant failed: variant_id not found.");
        return;
    }

    let productId = '';
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();
        const { data: variant, error: fetchError } = await supabase.from('product_variants').select('product_id, products(image_url)').eq('id', variantId).eq('organization_id', organization_id).single();

        if (fetchError || !variant) throw new Error("Varian tidak ditemukan.");
        
        productId = variant.product_id;
        const { count } = await supabase.from('product_variants').select('*', { count: 'exact' }).eq('product_id', productId);

        if (count === 1) {
            const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
            if (deleteError) throw new Error(`Gagal menghapus produk: ${deleteError.message}`);
            
            const productsData = variant.products;
            const imageUrl = Array.isArray(productsData) && productsData.length > 0 ? productsData[0]?.image_url : null;

            if (imageUrl) {
                const oldImageName = imageUrl.split('/').pop();
                if (oldImageName) await supabase.storage.from('product_images').remove([`${organization_id}/${oldImageName}`]);
            }
        } else {
            const { error: deleteError } = await supabase.from('product_variants').delete().eq('id', variantId);
            if (deleteError) throw new Error(`Gagal menghapus varian: ${deleteError.message}`);
        }
    } catch (e: any) {
        console.error(e);
    }
    
    if (productId) revalidatePath(`/dashboard/products/templates/${productId}`);
    revalidatePath('/dashboard/products');
}
