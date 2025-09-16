"use client";

import { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { Search, X, PlusCircle, MinusCircle, Trash2, CreditCard, ShoppingCart, Loader2, Tag } from 'lucide-react';
import Image from 'next/image';
import { createTransaction, getProductsForOutlet } from './actions';
import { PaymentModal } from './PaymentModal';
import { DiscountModal } from './DiscountModal';
import { TransactionSuccessModal } from './TransactionSuccessModal';
import { CustomerSelector } from './CustomerSelector'; // Import CustomerSelector

// ========= TIPE DATA =========
type Tax = { id: string; name: string; rate: number; is_inclusive: boolean; };
type Product = { id: string; name: string; selling_price: number; image_url: string | null; track_stock: boolean; stock_on_hand: number; category_id: string | null; taxes: Tax[] | null; };
type Outlet = { id: string; name: string; };
type Category = { id: string; name: string; };
type Customer = { id: string; name: string; phone_number?: string; }; // Tambahkan tipe Customer

type Discount = { type: 'percentage' | 'fixed'; value: number; };
type CartItem = {
    id: string;
    name: string;
    selling_price: number;
    quantity: number;
    taxes: Tax[] | null;
    discount: Discount;
};

// ========= KOMPONEN UTAMA =========
export function POSClient({ outlets, categories, userName }: { outlets: Outlet[], categories: Category[], userName: string }) {
    // --- STATE MANAGEMENT ---
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [transactionDiscount, setTransactionDiscount] = useState<Discount>({ type: 'fixed', value: 0 });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // State untuk pelanggan

    // Filter & UI States
    const [selectedOutlet, setSelectedOutlet] = useState<string>(outlets[0]?.id || '');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [discountModalState, setDiscountModalState] = useState<{ isOpen: boolean; item?: CartItem; isTransactionDiscount?: boolean }>({ isOpen: false });
    const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null);

    // Loading States
    const [isProductLoading, startProductTransition] = useTransition();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        if (selectedOutlet) {
            startProductTransition(async () => {
                const fetchedProducts = await getProductsForOutlet(selectedOutlet);
                setProducts(fetchedProducts || []);
            });
        }
    }, [selectedOutlet]);

    useEffect(() => {
        if (cart.length === 0 && transactionDiscount.value > 0) {
            setTransactionDiscount({ type: 'fixed', value: 0 });
        }
    }, [cart, transactionDiscount.value]);

    // --- FILTER PRODUK ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const categoryMatch = selectedCategory === 'all' || p.category_id === selectedCategory;
            const searchMatch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [products, selectedCategory, searchTerm]);

    // --- KALKULASI TOTAL KERANJANG ---
    const { subtotal, totalTax, grandTotal, totalDiscount } = useMemo(() => {
        // ... (logika kalkulasi tidak berubah)
        let preDiscountSubtotal = 0;
        let finalTax = 0;
        let finalDiscount = 0;

        cart.forEach(item => {
            let original_base_price = item.selling_price;
            const inclusiveTax = item.taxes?.find(t => t.is_inclusive);
            if (inclusiveTax) {
                original_base_price = item.selling_price / (1 + inclusiveTax.rate / 100);
            }
            preDiscountSubtotal += original_base_price * item.quantity;

            let itemDiscountAmount = 0;
            if (item.discount.type === 'fixed') {
                itemDiscountAmount = item.discount.value;
            } else {
                itemDiscountAmount = (original_base_price * item.quantity) * (item.discount.value / 100);
            }
            finalDiscount += itemDiscountAmount;

            const priceAfterItemDiscount = (original_base_price * item.quantity) - itemDiscountAmount;
            
            let itemTaxAmount = 0;
            if (item.taxes) {
                item.taxes.forEach(tax => {
                    itemTaxAmount += priceAfterItemDiscount * (tax.rate / 100);
                });
            }
            finalTax += itemTaxAmount;
        });

        const subtotalAfterItemDiscounts = preDiscountSubtotal - finalDiscount;
        let transactionDiscountAmount = 0;
        if (transactionDiscount.type === 'fixed') {
            transactionDiscountAmount = transactionDiscount.value;
        } else {
            transactionDiscountAmount = subtotalAfterItemDiscounts * (transactionDiscount.value / 100);
        }
        
        const discountRatio = subtotalAfterItemDiscounts > 0 ? transactionDiscountAmount / subtotalAfterItemDiscounts : 0;
        finalTax = finalTax * (1 - discountRatio);
        finalDiscount += transactionDiscountAmount;

        const finalSubtotal = preDiscountSubtotal;
        const finalGrandTotal = (preDiscountSubtotal - finalDiscount) + finalTax;

        return { subtotal: finalSubtotal, totalTax: finalTax, grandTotal: finalGrandTotal, totalDiscount: finalDiscount };
    }, [cart, transactionDiscount]);

    // --- HANDLER FUNCTIONS ---
    const handleAddToCart = useCallback((product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, {
                id: product.id, name: product.name, selling_price: product.selling_price,
                quantity: 1, taxes: product.taxes, discount: { type: 'fixed', value: 0 }
            }];
        });
    }, []);

    const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) return prevCart.filter(item => item.id !== productId);
            return prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
        });
    }, []);

    const handleApplyDiscount = (discount: Discount) => {
        if (discountModalState.isTransactionDiscount) {
            setTransactionDiscount(discount);
        } else if (discountModalState.item) {
            setCart(cart.map(item => item.id === discountModalState.item!.id ? { ...item, discount } : item));
        }
    };

    const handleConfirmPayment = async () => {
        setIsCheckoutLoading(true);
        // ... (logika mapping cartData tidak berubah)
        const cartData = cart.map(item => {
            let original_base_price = item.selling_price;
            if (item.taxes?.find(t => t.is_inclusive)) {
                original_base_price = item.selling_price / (1 + item.taxes.find(t => t.is_inclusive)!.rate / 100);
            }
            let itemDiscountAmount = item.discount.type === 'fixed' ? item.discount.value : (original_base_price * item.quantity) * (item.discount.value / 100);
            const priceAfterItemDiscount = (original_base_price * item.quantity) - itemDiscountAmount;
            
            let itemTaxAmount = 0;
            if (item.taxes) {
                item.taxes.forEach(tax => {
                    itemTaxAmount += priceAfterItemDiscount * (tax.rate / 100);
                });
            }
            return {
                variant_id: item.id, quantity: item.quantity, unit_price: original_base_price,
                tax_amount: itemTaxAmount, discount_amount: itemDiscountAmount
            }
        });
        
        let transactionDiscountAmount = transactionDiscount.type === 'fixed' ? transactionDiscount.value : (subtotal - totalDiscount + transactionDiscount.value) * (transactionDiscount.value / 100);

        try {
            // Modifikasi: Kirim customerId ke createTransaction
            const result = await createTransaction(cartData, selectedOutlet, transactionDiscountAmount, selectedCustomer?.id || null);
             if (result.success && result.transaction_id) {
                setCart([]);
                setTransactionDiscount({ type: 'fixed', value: 0 });
                setSelectedCustomer(null); // Reset pelanggan setelah transaksi berhasil
                setIsPaymentModalOpen(false);
                setCompletedTransactionId(result.transaction_id);
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
            {/* --- MODALS --- */}
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSubmit={handleConfirmPayment} grandTotal={grandTotal} />
            <DiscountModal isOpen={discountModalState.isOpen} onClose={() => setDiscountModalState({ isOpen: false })} onApply={handleApplyDiscount}
                itemName={discountModalState.item?.name} basePrice={discountModalState.isTransactionDiscount ? subtotal : (discountModalState.item?.selling_price || 0) * (discountModalState.item?.quantity || 0) }
            />
            {completedTransactionId && (
                <TransactionSuccessModal 
                    transactionId={completedTransactionId} 
                    onClose={() => setCompletedTransactionId(null)} 
                />
            )}

            <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4 font-sans">
                {/* Product Grid */}
                 <div className="flex-grow flex flex-col bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-800 p-4">
                     {/* ... (UI Filter dan Product List tidak berubah) */}
                      {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                         <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full p-2 border rounded-md bg-transparent" disabled={outlets.length === 0}>
                            {outlets.length > 0 ? outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>) : <option>Tidak ada outlet</option>}
                        </select>
                         <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 border rounded-md bg-transparent" disabled={categories.length === 0}>
                            <option value="all">Semua Kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text_gray-400" />
                            <input type="text" placeholder="Cari produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            {searchTerm && <X onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 cursor-pointer" />}
                        </div>
                    </div>
                     {/* Product List */}
                    <div className="flex-grow overflow-y-auto pr-2 relative">
                        {isProductLoading && <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex justify-center items-center z-10"><Loader2 className="h-8 w-8 animate-spin text-teal-500"/></div>}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => handleAddToCart(product)} className="border rounded-lg p-3 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800">
                                    <Image src={product.image_url || '/Finako JPG.jpg'} alt={product.name} width={120} height={120} className="w-full h-28 object-cover rounded-md mb-2" onError={(e) => { e.currentTarget.src = '/Finako JPG.jpg'; }}/>
                                    <h3 className="font-semibold text-sm text-center flex-grow">{product.name}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.selling_price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart Sidebar */}
                <div className="w-full md:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800/50 rounded-lg border dark:border-gray-800 p-4">
                    <div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold">Keranjang</h2><span className="text-sm text-gray-500">Kasir: {userName}</span></div>
                    
                    {/* Integrasi CustomerSelector */}
                    <div className="mb-4">
                        <CustomerSelector selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} />
                    </div>

                    {/* Cart Items */}
                    <div className="flex-grow overflow-y-auto border-t border-b dark:border-gray-700 py-2">
                        {cart.length === 0 ? <div className="text-center text-gray-500 my-10"><ShoppingCart className="mx-auto h-12 w-12 text-gray-400"/><p>Keranjang masih kosong</p></div>
                        : cart.map(item => (
                            <div key={item.id} className="py-2">
                                {/* ... (UI item keranjang tidak berubah) */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.quantity} x {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.selling_price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setDiscountModalState({ isOpen: true, item })} title="Beri diskon" className="p-1 text-gray-500 hover:text-teal-600"><Tag className="h-5 w-5"/></button>
                                        <MinusCircle onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="h-5 w-5 cursor-pointer text-red-500"/>
                                        <span className="w-5 text-center">{item.quantity}</span>
                                        <PlusCircle onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="h-5 w-5 cursor-pointer text-green-500"/>
                                        <Trash2 onClick={() => handleUpdateQuantity(item.id, 0)} className="h-5 w-5 cursor-pointer text-gray-400 hover:text-red-600 ml-2"/>
                                    </div>
                                </div>
                                {item.discount.value > 0 && <p className="text-xs text-red-500">Diskon: {item.discount.type === 'fixed' ? new Intl.NumberFormat('id-ID').format(item.discount.value) : `${item.discount.value}%`}</p>}
                            </div>
                        ))}
                    </div>
                    {/* Cart Summary */}
                    <div className="mt-auto pt-4">
                        {/* ... (UI ringkasan keranjang tidak berubah) */}
                        <div className="space-y-1 text-sm mb-4">
                            <div className="flex justify-between"><p>Subtotal</p><p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal)}</p></div>
                             <div className="flex justify-between items-center text-red-600">
                                <button onClick={() => setDiscountModalState({ isOpen: true, isTransactionDiscount: true })} className="flex items-center gap-1 hover:underline">
                                    <Tag className="h-4 w-4"/>
                                    Diskon
                                </button>
                                <p>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalDiscount)}</p>
                            </div>
                            <div className="flex justify-between"><p>Pajak</p><p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalTax)}</p></div>
                            <div className="border-t dark:border-gray-700 my-1"></div>
                            <div className="flex justify-between font-bold text-base"><p>Total</p><p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}</p></div>
                        </div>
                        <button onClick={() => setIsPaymentModalOpen(true)} disabled={cart.length === 0 || isCheckoutLoading || isProductLoading || !selectedOutlet} className="w-full flex items-center justify-center bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <CreditCard className="mr-2"/>{isCheckoutLoading ? 'Memproses...' : 'Bayar'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
