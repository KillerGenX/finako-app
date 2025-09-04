"use client";

import { useState, useTransition, useRef } from 'react';
import { uploadProof } from './actions';
import { Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

export default function PaymentOptions({ invoice }: { invoice: any }) {
    const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'manual'>('manual');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [isPending, startTransition] = useTransition();
    const [formMessage, setFormMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [progressText, setProgressText] = useState('');
    
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE_MB = 5;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Validasi Ukuran File
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFormMessage({ type: 'error', text: `Ukuran file tidak boleh melebihi ${MAX_FILE_SIZE_MB} MB.` });
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset input file
            }
            return;
        }

        setFormMessage(null);
        setProofFile(file);
        setFileName(file.name);
    };

    const handleUploadProof = () => {
        if (!proofFile) {
            setFormMessage({ type: 'error', text: 'Silakan pilih file bukti pembayaran.' });
            return;
        }
        setFormMessage(null);

        startTransition(async () => {
            try {
                // 2. Kompresi Gambar
                setProgressText('Mengompres gambar...');
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    fileType: 'image/jpeg',
                };
                const compressedFile = await imageCompression(proofFile, options);

                // 3. Upload File yang Sudah Dikompres
                setProgressText('Mengunggah file...');
                const formData = new FormData();
                formData.append('invoiceId', invoice.id);
                formData.append('proof', compressedFile, `${fileName.split('.')[0]}.jpg`);

                const result = await uploadProof(formData);

                if (result.error) {
                    setFormMessage({ type: 'error', text: result.error });
                }
                if (result.success) {
                    setFormMessage({ type: 'success', text: result.message! });
                    router.refresh(); 
                }
            } catch (error) {
                setFormMessage({ type: 'error', text: 'Terjadi kesalahan saat kompresi gambar.' });
            } finally {
                setProgressText('');
            }
        });
    };

    if (invoice.status === 'awaiting_confirmation') {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold mt-4">Terima Kasih!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Bukti pembayaran Anda telah kami terima. Tim kami akan segera melakukan verifikasi dalam 1x24 jam.
                </p>
            </div>
        );
    }
    
    // ... (Tampilan status 'paid' tetap sama)

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b"><h2 className="text-xl font-semibold">Pilih Metode Pembayaran</h2></div>
            <div className="p-6">
                <div className="flex gap-4 mb-6">
                    <button onClick={() => setPaymentMethod('manual')} className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${paymentMethod === 'manual' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'}`}>Transfer Manual</button>
                    <button disabled className="flex-1 p-4 rounded-lg border-2 text-left transition-colors border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50">Payment Gateway (Segera)</button>
                </div>

                {paymentMethod === 'manual' && (
                    <div>
                        <h3 className="font-semibold mb-2">Instruksi Transfer Manual</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Silakan transfer sejumlah total tagihan ke rekening berikut dan unggah bukti pembayaran Anda.</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2 text-sm">
                            <p><strong>Bank:</strong> Bank Central Asia (BCA)</p>
                            <p><strong>No. Rekening:</strong> 1234567890</p>
                            <p><strong>Atas Nama:</strong> PT Finako Indonesia</p>
                        </div>
                        
                        <div className="mt-6">
                            <label htmlFor="proof-upload" className="block text-sm font-medium mb-2">Unggah Bukti Pembayaran</label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="proof-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Klik untuk mengunggah</span></p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{fileName || 'PNG, JPG or PDF'}</p>
                                    </div>
                                    <input ref={fileInputRef} id="proof-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
                                </label>
                            </div>
                            {/* ▼▼▼ KETERANGAN BARU ▼▼▼ */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maksimal ukuran file: {MAX_FILE_SIZE_MB} MB.</p>
                        </div>
                        
                        {formMessage && (<div className={`mt-4 text-sm ${formMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{formMessage.text}</div>)}

                        <button
                            onClick={handleUploadProof}
                            disabled={isPending || !proofFile}
                            className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    <span>{progressText || 'Memproses...'}</span>
                                </>
                            ) : 'Konfirmasi Pembayaran'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
