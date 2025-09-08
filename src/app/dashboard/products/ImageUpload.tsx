"use client";

import { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

export function ImageUpload({ existingImageUrl, error }: { existingImageUrl?: string | null; error?: string[] }) {
    const [preview, setPreview] = useState<string | null>(existingImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (event: React.MouseEvent) => {
        event.preventDefault();
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-1">Foto Produk</label>
            <div className={`relative flex justify-center items-center w-full h-48 border-2 ${error ? 'border-red-500' : 'border-dashed'} rounded-lg`}>
                {preview ? (
                    <>
                        <img src={preview} alt="Pratinjau Produk" className="h-full w-full object-contain rounded-lg" />
                        <button 
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-700 hover:bg-gray-100"
                            title="Hapus gambar"
                        >
                            <X size={18} />
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <UploadCloud size={40} className="mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                            Seret & lepas gambar, atau <button type="button" onClick={() => fileInputRef.current?.click()} className="font-medium text-teal-600 hover:underline">klik untuk memilih</button>
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP hingga 5MB</p>
                    </div>
                )}
                <input 
                    ref={fileInputRef}
                    type="file" 
                    name="image_url" 
                    id="image_url"
                    accept="image/png, image/jpeg, image/webp" 
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={handleFileChange}
                />
            </div>
             {error && <p className="mt-1 text-xs text-red-500">{error.join(', ')}</p>}
        </div>
    );
}
