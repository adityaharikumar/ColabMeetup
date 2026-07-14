import { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, Maximize2, X } from 'lucide-react';
import api from '../api';

export default function Gallery({ ideaId, isParticipant, initialImages = [] }: { ideaId: string, isParticipant: boolean, initialImages?: string[] }) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Limit is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await api.post(`/ideas/${ideaId}/gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages(response.data.galleryImages);
    } catch (error) {
      console.error(error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    // Assuming backend runs on port 5000 in dev
    return `http://localhost:5000${url}`;
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-md font-bold font-outfit text-white">Collaboration Gallery</h3>
          <p className="text-xs text-slate-400 mt-1">Share photos, screenshots, and memories of your meetup.</p>
        </div>
        
        {isParticipant && (
          <div>
            <input 
              type="file" 
              id="gallery-upload" 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label 
              htmlFor="gallery-upload"
              className={`flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </label>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-darkBorder rounded-2xl bg-slate-950/20 text-center shadow-inner">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-darkBorder shadow-lg">
            <ImageIcon className="w-8 h-8 text-slate-500" />
          </div>
          <h4 className="text-white font-bold mb-1">No photos yet</h4>
          <p className="text-sm text-slate-400 max-w-sm">Be the first to share a moment from this collaboration! Upload screenshots of what you built or pictures of your team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-darkBorder bg-slate-950 shadow-md"
              onClick={() => setSelectedImage(getFullUrl(img))}
            >
              <img 
                src={getFullUrl(img)} 
                alt={`Gallery image ${idx + 1}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-colors border border-slate-700 hover:border-slate-500 z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Enlarged gallery view" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
}
