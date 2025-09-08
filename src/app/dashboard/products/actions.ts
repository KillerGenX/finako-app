"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const ProductSchema = z.object({
    name: z.string().min(3, { message: "Nama produk harus diisi (minimal 3 karakter)." }),
    selling_price: z.coerce.number().min(0, { message: "Harga jual harus angka positif." }),
    sku: z.string().optional(),
    description: z.string().optional(),
    track_stock: z.boolean(),
});

export type FormState = {
    message: string;
    errors?: {
        name?: string[];
        selling_price?: string[];
        sku?: string[];
        description?: string[];
        track_stock?: string[];
    };
};

async function getSupabaseAndOrgId() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Pengguna tidak terautentikasi.");
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) throw new Error("Organisasi tidak ditemukan.");
    return { supabase, organization_id: member.organization_id };
}

// Function to generate a unique SKU
function generateSku(productName: string): string {
    const prefix = productName.substring(0, 3).toUpperCase();
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number
    return `${prefix}-${randomNumber}`;
}

export async function createProduct(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const { supabase, organization_id } = await getSupabaseAndOrgId();

        const validatedFields = ProductSchema.safeParse({
            name: formData.get('name'),
            selling_price: formData.get('selling_price'),
            sku: formData.get('sku'),
            description: formData.get('description'),
            track_stock: formData.get('track_stock') === 'on',
        });

        if (!validatedFields.success) {
            return {
                message: "Validasi gagal. Mohon periksa kembali isian Anda.",
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }
        
        let { name, selling_price, sku, description, track_stock } = validatedFields.data;

        // --- SKU GENERATION LOGIC ---
        if (!sku || sku.trim() === '') {
            sku = generateSku(name);
            // Optional: You could add a loop here to check for SKU uniqueness in the DB, 
            // but the chance of collision is low for this implementation.
        }
        
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({ organization_id, name, description, product_type: 'SINGLE' })
            .select('id').single();

        if (productError) throw new Error(`Error saat menyimpan produk: ${productError.message}`);

        const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
                organization_id,
                product_id: product.id,
                name,
                selling_price,
                sku, // Use the potentially generated SKU
                track_stock,
                inventory_tracking_method: track_stock ? 'by_quantity' : 'none',
            });
        
        if (variantError) {
            await supabase.from('products').delete().eq('id', product.id);
            // Handle potential unique constraint violation for SKU
            if (variantError.code === '23505') { // Postgres unique violation code
                 return { message: `Error: SKU '${sku}' sudah ada. Harap gunakan SKU lain atau biarkan kosong untuk generate otomatis.`, errors: { sku: ["SKU ini sudah digunakan."] } };
            }
            throw new Error(`Error saat menyimpan varian produk: ${variantError.message}`);
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
        
        const validatedFields = ProductSchema.safeParse({
            name: formData.get('name'),
            selling_price: formData.get('selling_price'),
            sku: formData.get('sku'),
            description: formData.get('description'),
            track_stock: formData.get('track_stock') === 'on',
        });

        if (!validatedFields.success) {
            return { message: "Validasi gagal.", errors: validatedFields.error.flatten().fieldErrors, };
        }
        
        let { name, selling_price, sku, description, track_stock } = validatedFields.data;

        // --- SKU GENERATION LOGIC (FOR UPDATE) ---
        if (!sku || sku.trim() === '') {
            sku = generateSku(name);
        }

        const { data: variant, error: fetchError } = await supabase
            .from('product_variants')
            .select('product_id')
            .eq('id', variantId)
            .eq('organization_id', organization_id)
            .single();

        if (fetchError || !variant) throw new Error("Varian produk tidak ditemukan.");
        
        const { error: productError } = await supabase
            .from('products')
            .update({ name, description })
            .eq('id', variant.product_id);
            
        if (productError) throw new Error(`Error saat memperbarui produk: ${productError.message}`);

        const { error: variantError } = await supabase
            .from('product_variants')
            .update({ name, selling_price, sku, track_stock, inventory_tracking_method: track_stock ? 'by_quantity' : 'none' })
            .eq('id', variantId);
        
        if (variantError) {
            if (variantError.code === '23505') {
                 return { message: `Error: SKU '${sku}' sudah ada.`, errors: { sku: ["SKU ini sudah digunakan."] } };
            }
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
        const { data: variant, error: fetchError } = await supabase
            .from('product_variants')
            .select('product_id')
            .eq('id', variantId)
            .eq('organization_id', organization_id)
            .single();
        if (fetchError || !variant) throw new Error("Produk tidak ditemukan.");
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', variant.product_id);
        if (deleteError) throw new Error(`Gagal menghapus produk: ${deleteError.message}`);
    } catch (e: any) {
        console.error(e);
        return { message: e.message };
    }
    revalidatePath('/dashboard/products');
    return { message: "Produk berhasil dihapus." };
}
