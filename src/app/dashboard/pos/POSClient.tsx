"use client";

import { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { Search, X, PlusCircle, MinusCircle, Trash2, CreditCard, ShoppingCart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createTransaction, getProductsForOutlet } from './actions';
import { PaymentModal } from './PaymentModal';

// ========= TIPE DATA =========
type Tax = {
    id: string;
    name: string;
    rate: number;
    is_inclusive: boolean;
};

type Product = {
    id: string; // variant_id
    name: string;
    selling_price: number;
    image_url: string | null;
    track_stock: boolean;
    stock_on_hand: number;
    category_id: string | null;
    taxes: Tax[] | null;
};

type Outlet = { id: string; name: string; };
type Category = { id: string; name: string; };

type CartItem = {
    id: string;
    name: string;
    // selling_price is the final price from DB, inclusive or exclusive of tax
    selling_price: number;
    quantity: number;
    taxes: Tax[] | null;
};


// ========= KOMPONEN UTAMA =========
export function POSClient({ outlets, categories, userName }: {
    outlets: Outlet[],
    categories: Category[],
    userName: string
}) {
    // --- STATE MANAGEMENT ---
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Filter & UI States
    const [selectedOutlet, setSelectedOutlet] = useState<string>(outlets[0]?.id || '');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Loading States
    const [isProductLoading, startProductTransition] = useTransition();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

    // --- DATA FETCHING & SIDE EFFECTS ---
    useEffect(() => {
        if (selectedOutlet) {
            startProductTransition(async () => {
                const fetchedProducts = await getProductsForOutlet(selectedOutlet);
                setProducts(fetchedProducts || []);
            });
        }
    }, [selectedOutlet]);

    // --- MEMOIZED CALCULATIONS & FILTERING ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const categoryMatch = selectedCategory === 'all' || p.category_id === selectedCategory;
            const searchMatch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [products, selectedCategory, searchTerm]);

    const { subtotal, totalTax, grandTotal } = useMemo(() => {
        let calculatedSubtotal = 0;
        let calculatedTotalTax = 0;

        cart.forEach(item => {
            // 1. Determine the base price (price before any tax)
            let base_price = item.selling_price;
            const inclusiveTax = item.taxes?.find(t => t.is_inclusive);
            if (inclusiveTax) {
                // If tax is inclusive, the selling_price contains tax. We must extract the base price.
                base_price = item.selling_price / (1 + inclusiveTax.rate / 100);
            }
            
            // The subtotal for the item is its base price * quantity
            const itemSubtotal = base_price * item.quantity;
            calculatedSubtotal += itemSubtotal;

            // 2. Calculate the total tax for the item
            let itemTotalTax = 0;
            if (item.taxes) {
                item.taxes.forEach(tax => {
                    if (tax.is_inclusive) {
                        // The tax amount is the difference between the selling price and the base price
                        const taxAmount = (item.selling_price - base_price) * item.quantity;
                        itemTotalTax += taxAmount;
                    } else {
                        // For exclusive tax, it's a percentage of the base price
                        const taxAmount = base_price * (tax.rate / 100) * item.quantity;
                        itemTotalTax += taxAmount;
                    }
                });
            }
            calculatedTotalTax += itemTotalTax;
        });

        const calculatedGrandTotal = calculatedSubtotal + calculatedTotalTax;

        return { subtotal: calculatedSubtotal, totalTax: calculatedTotalTax, grandTotal: calculatedGrandTotal };
    }, [cart]);


    // --- HANDLER FUNCTIONS (ACTIONS) ---
    const handleAddToCart = useCallback((product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, {
                id: product.id,
                name: product.name,
                selling_price: product.selling_price,
                quantity: 1,
                taxes: product.taxes
            }];
        });
    }, []);

    const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) return prevCart.filter(item => item.id !== productId);
            return prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
        });
    }, []);

    const handleOpenPaymentModal = () => {
        if (cart.length === 0 || !selectedOutlet) {
            alert("Keranjang kosong atau outlet belum dipilih.");
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        setIsCheckoutLoading(true);
        
        // **PERBAIKAN UTAMA ADA DI SINI**
        // Sekarang kita mengirim data yang dibutuhkan oleh RPC v2
        const cartData = cart.map(item => {
            // Kalkulasi ulang di sini untuk memastikan konsistensi
            let base_price = item.selling_price;
            const inclusiveTax = item.taxes?.find(t => t.is_inclusive);
            if (inclusiveTax) {
                base_price = item.selling_price / (1 + inclusiveTax.rate / 100);
            }

            let itemTotalTax = 0;
            if (item.taxes) {
                item.taxes.forEach(tax => {
                    if (tax.is_inclusive) {
                        itemTotalTax += (item.selling_price - base_price) * item.quantity;
                    } else {
                        itemTotalTax += base_price * (tax.rate / 100) * item.quantity;
                    }
                });
            }
            
            return {
                variant_id: item.id,
                quantity: item.quantity,
                unit_price: base_price,
                tax_amount: itemTotalTax // Mengirim total pajak untuk baris item ini
            }
        });

        try {
            const result = await createTransaction(cartData, selectedOutlet);
            if (result.success) {
                alert('Transaksi berhasil!');
                setCart([]);
                setIsPaymentModalOpen(false);
            } else {
                alert(`Transaksi Gagal: ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan yang tidak terduga.');
        } finally {
            setIsCheckoutLoading(false);
        }
    };


    return (
        <>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSubmit={handleConfirmPayment}
                grandTotal={grandTotal}
            />
            <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4 font-sans">
                {/* ======================= MAIN CONTENT (PRODUCT GRID) ======================= */}
                <div className="flex-grow flex flex-col bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-800 p-4">
                    {/* --- FILTERS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <select
                            value={selectedOutlet}
                            onChange={(e) => setSelectedOutlet(e.target.value)}
                            className="w-full p-2 border rounded-md bg-transparent"
                            disabled={outlets.length === 0}
                        >
                            {outlets.length > 0 ? outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>) : <option>Tidak ada outlet</option>}
                        </select>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border rounded-md bg-transparent"
                            disabled={categories.length === 0}
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            {searchTerm && <X onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 cursor-pointer" />}
                        </div>
                    </div>

                    {/* --- PRODUCT LIST --- */}
                    <div className="flex-grow overflow-y-auto pr-2 relative">
                        {isProductLoading && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex justify-center items-center z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                            </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => handleAddToCart(product)} className="border rounded-lg p-3 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800">
                                    <Image
                                        src={product.image_url || '/Finako JPG.jpg'}
                                        alt={product.name}
                                        width={120}
                                        height={120}
                                        className="w-full h-28 object-cover rounded-md mb-2"
                                        onError={(e) => { e.currentTarget.src = '/Finako JPG.jpg'; }}
                                    />
                                    <h3 className="font-semibold text-sm text-center flex-grow">{product.name}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.selling_price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ======================= RIGHT SIDEBAR (CART) ======================= */}
                <div className="w-full md:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-800 p-4">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Keranjang</h2><span className="text-sm text-gray-500">Kasir: {userName}</span></div>

                    {/* --- CART ITEMS --- */}
                    <div className="flex-grow overflow-y-auto border-t border-b dark:border-gray-700 py-2">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-500 my-10"><ShoppingCart className="mx-auto h-12 w-12 text-gray-400" /><p>Keranjang masih kosong</p></div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-gray-500">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.selling_price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MinusCircle onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="h-5 w-5 cursor-pointer text-red-500" />
                                        <span>{item.quantity}</span>
                                        <PlusCircle onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="h-5 w-5 cursor-pointer text-green-500" />
                                        <Trash2 onClick={() => handleUpdateQuantity(item.id, 0)} className="h-5 w-5 cursor-pointer text-gray-400 hover:text-red-600 ml-2" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* --- CART SUMMARY & CHECKOUT --- */}
                    <div className="mt-auto pt-4">
                        <div className="space-y-1 text-sm mb-4">
                            <div className="flex justify-between"><p>Subtotal</p><p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal)}</p></div>
                            <div className="flex justify-between"><p>Pajak</p><p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalTax)}</p></div>
                            <div className="border-t dark:border-gray-700 my-1"></div>
                            <div className="flex justify-between font-bold text-base"><p>Total</p><p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}</p></div>
                        </div>
                        <button
                            onClick={handleOpenPaymentModal}
                            disabled={cart.length === 0 || isCheckoutLoading || isProductLoading || !selectedOutlet}
                            className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <CreditCard className="mr-2" />
                            {isCheckoutLoading ? 'Memproses...' : 'Bayar'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
