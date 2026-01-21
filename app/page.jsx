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
  const [isCompressing, setIsCompressing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      setCompressedFile(null);
    }
  };

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

    setIsCompressing(true);

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
          setTimeout(() => {
            setCompressedFile(blob);
            setCompressedSize(blob.size);
            setIsCompressing(false);
            setShowConfetti(true);
            
            const newCount = compressionCount + 1;
            setCompressionCount(newCount);
            localStorage.setItem('compressionCount', newCount.toString());

            setTimeout(() => setShowConfetti(false), 3000);
          }, 1000);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '✨', '🌟', '⭐', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center transform hover:scale-110 hover:rotate-6 transition-all duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ImageCompress Pro
                </h1>
                <p className="text-sm text-gray-500 mt-1">Compressez en un éclair ⚡</p>
              </div>
            </div>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="group px-6 py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1"
            >
              <span className="flex items-center gap-2">
                <span className="animate-bounce inline-block">⭐</span>
                Passer Premium
              </span>
            </button>
          </div>

          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-5 flex justify-between items-center shadow-inner">
            <div className="transform hover:scale-105 transition-transform">
              <p className="text-sm text-gray-600 font-medium">Compressions aujourd'hui</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {compressionCount} / {MAX_FREE_COMPRESSIONS}
              </p>
            </div>
            <div className="text-right transform hover:scale-105 transition-transform">
              <p className="text-sm text-gray-600 font-medium">Restantes</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {MAX_FREE_COMPRESSIONS - compressionCount}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-3 ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-dashed border-gray-300 hover:border-blue-400'} rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer group hover:shadow-lg`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer block">
                <div className="text-gray-600">
                  <div className="relative inline-block">
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors transform group-hover:scale-110 group-hover:-rotate-6 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl animate-bounce">📂</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                    {isDragging ? '📂 Déposez votre image ici !' : '🖱️ Cliquez ou glissez une image'}
                  </p>
                  <p className="text-sm text-gray-500 mt-3 font-medium">PNG, JPG, JPEG jusqu'à 10MB</p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-100 transform hover:scale-102 transition-all duration-300 shadow-md">
                <p className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  📸 Fichier sélectionné:
                </p>
                <p className="text-gray-600 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">Taille: <span className="font-bold">{formatSize(originalSize)}</span></p>
              </div>
            )}

            {selectedFile && (
              <button
                onClick={compressImage}
                disabled={compressionCount >= MAX_FREE_COMPRESSIONS || isCompressing}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg transform hover:scale-105 ${
                  compressionCount >= MAX_FREE_COMPRESSIONS 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed' 
                    : isCompressing
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl'
                }`}
              >
                {compressionCount >= MAX_FREE_COMPRESSIONS 
                  ? '🔒 Limite atteinte - Passez Premium' 
                  : isCompressing 
                  ? '⚡ Compression en cours...'
                  : '⚡ Compresser l\'image maintenant !'}
              </button>
            )}

            {compressedFile && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-xl animate-fadeIn">
                <p className="font-bold text-green-700 mb-4 flex items-center gap-2 text-lg">
                  <span className="text-2xl animate-bounce">✅</span> 
                  Compression réussie !
                </p>
                <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
                  <div className="text-center transform hover:scale-110 transition-transform">
                    <p className="text-sm text-gray-600 font-medium">Taille originale</p>
                    <p className="text-2xl font-bold text-gray-800">{formatSize(originalSize)}</p>
                  </div>
                  <div className="text-3xl animate-pulse">→</div>
                  <div className="text-center transform hover:scale-110 transition-transform">
                    <p className="text-sm text-gray-600 font-medium">Taille compressée</p>
                    <p className="text-2xl font-bold text-green-600">{formatSize(compressedSize)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-5 shadow-inner">
                  <p className="text-center text-xl">
                    <span className="font-bold text-green-600 text-2xl animate-pulse">
                      {Math.round((1 - compressedSize / originalSize) * 100)}% de réduction 🎉
                    </span>
                  </p>
                </div>
                <button
                  onClick={downloadCompressed}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  📥 Télécharger l'image compressée
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp border-2 border-yellow-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl transform hover:scale-110 hover:rotate-12 transition-all duration-300">
                <span className="text-4xl animate-bounce">⭐</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Passez Premium
              </h2>
              <p className="text-gray-600 font-medium">Débloquez toutes les fonctionnalités</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { icon: '🚀', text: 'Compressions illimitées' },
                { icon: '💎', text: 'Meilleure qualité de compression' },
                { icon: '📦', text: 'Téléchargement ZIP' },
                { icon: '⚡', text: 'Support prioritaire' }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="text-center mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
              <p className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1">
                5€<span className="text-xl text-gray-500">/mois</span>
              </p>
              <p className="text-sm text-gray-600 font-medium">Annulable à tout moment</p>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl mb-3 disabled:opacity-50 transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? '⏳ Chargement...' : '💳 Souscrire maintenant'}
            </button>

            <button
              onClick={() => setShowPremiumModal(false)}
              className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium hover:bg-gray-100 rounded-xl"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}