'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressionCount, setCompressionCount] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const MAX_FREE_COMPRESSIONS = 5;

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('compressionDate');
    const savedCount = parseInt(localStorage.getItem('compressionCount') || '0');

    if (savedDate !== today) {
      localStorage.setItem('compressionDate', today);
      localStorage.setItem('compressionCount', '0');
      setCompressionCount(0);
    } else {
      setCompressionCount(savedCount);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      setCompressedFile(null);
    }
  };

  const compressImage = async () => {
    if (compressionCount >= MAX_FREE_COMPRESSIONS) {
      setShowPremiumModal(true);
      return;
    }

    if (!selectedFile) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxWidth = 1920;
      const maxHeight = 1080;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          setCompressedFile(blob);
          setCompressedSize(blob.size);
          
          const newCount = compressionCount + 1;
          setCompressionCount(newCount);
          localStorage.setItem('compressionCount', newCount.toString());
        },
        'image/jpeg',
        0.7
      );
    };

    img.src = URL.createObjectURL(selectedFile);
  };

  const downloadCompressed = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${selectedFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
    a.click();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au système de paiement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">ImageCompress Pro</h1>
            </div>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md"
            >
              ⭐ Passer Premium
            </button>
          </div>

          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Compressions aujourd'hui (gratuit)</p>
              <p className="text-2xl font-bold text-blue-600">{compressionCount} / {MAX_FREE_COMPRESSIONS}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Restantes (gratuit)</p>
              <p className="text-2xl font-bold text-indigo-600">{MAX_FREE_COMPRESSIONS - compressionCount}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-semibold">Cliquez pour sélectionner une image</p>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG jusqu'à 10MB</p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="font-semibold text-gray-700 mb-2">Fichier sélectionné:</p>
                <p className="text-gray-600">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">Taille: {formatSize(originalSize)}</p>
              </div>
            )}

            {selectedFile && (
              <button
                onClick={compressImage}
                disabled={compressionCount >= MAX_FREE_COMPRESSIONS}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {compressionCount >= MAX_FREE_COMPRESSIONS ? '🔒 Limite atteinte - Passez Premium' : '⚡ Compresser l\'image'}
              </button>
            )}

            {compressedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="font-semibold text-green-700 mb-3">✅ Compression réussie!</p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Taille originale</p>
                    <p className="text-xl font-bold text-gray-800">{formatSize(originalSize)}</p>
                  </div>
                  <div className="text-2xl">→</div>
                  <div>
                    <p className="text-sm text-gray-600">Taille compressée</p>
                    <p className="text-xl font-bold text-green-600">{formatSize(compressedSize)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 mb-4">
                  <p className="text-center text-lg">
                    <span className="font-bold text-green-600">
                      {Math.round((1 - compressedSize / originalSize) * 100)}% de réduction
                    </span>
                  </p>
                </div>
                <button
                  onClick={downloadCompressed}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  📥 Télécharger l'image compressée
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Passez Premium</h2>
              <p className="text-gray-600">Débloquez toutes les fonctionnalités</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Compressions illimitées</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Meilleure qualité de compression</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Téléchargement ZIP</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Support prioritaire</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-gray-800 mb-1">5€<span className="text-lg text-gray-500">/mois</span></p>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg mb-3 disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Souscrire maintenant'}
            </button>

            <button
              onClick={() => setShowPremiumModal(false)}
              className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
