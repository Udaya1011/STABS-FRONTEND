const getImageUrl = (url) => {
    if (!url) return null;
    
    // If it's already a full URL (Cloudinary, external), return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Unified logic with axiosConfig.js for consistent backend targeting
    const isProd = import.meta.env.PROD || window.location.hostname.includes('onrender.com');
    const prodURL = 'https://rvscas-backend.onrender.com';
    const envURL = import.meta.env.VITE_API_URL;
    const isEnvLocal = envURL && (envURL.includes('localhost') || envURL.includes('127.0.0.1'));
    
    // If we're on Render, we MUST use the Render backend. 
    // In dev, we use empty string to leverage the Vite proxy.
    const backendUrl = (isProd && isEnvLocal) ? prodURL : (envURL || (isProd ? prodURL : ''));
    
    // Remove leading slash if present to avoid double slashes when joining with backendUrl
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // For local dev with proxy, we want just /uploads/filename
    if (!backendUrl) return `/${cleanUrl}`;
    
    return `${backendUrl}/${cleanUrl}`;
};

export default getImageUrl;
