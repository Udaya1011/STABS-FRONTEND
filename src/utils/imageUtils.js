const getImageUrl = (url) => {
    if (!url) return null;
    
    // If it's already a full URL (Cloudinary, external), return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // If it's a relative upload path, prepend the backend URL
    // In production, we use the Render backend. In development, we use empty string (to leverage Vite proxy)
    const backendUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://rvscas-backend.onrender.com' : '');
    
    // Remove leading slash if present to avoid double slashes
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    return `${backendUrl}/${cleanUrl}`;
};

export default getImageUrl;
