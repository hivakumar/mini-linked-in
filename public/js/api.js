// Formats an API request with the Firebase Auth token
const apiFetch = async (endpoint, options = {}) => {
    try {
        const user = window.auth ? window.auth.currentUser : null;
        let token = null;
        
        if (user) {
            token = await user.getIdToken();
        }

        const headers = {
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // If not sending FormData (like image uploads), assume JSON
        if (!(options.body instanceof FormData)) {
             headers['Content-Type'] = headers['Content-Type'] || 'application/json';
             if (options.body && typeof options.body === 'object') {
                 options.body = JSON.stringify(options.body);
             }
        }

        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Request Failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

window.api = {
    // Auth Routes
    syncProfile: () => apiFetch('/auth/sync', { method: 'POST' }),
    getProfile: () => apiFetch('/auth/profile'),
    updateProfile: (data) => apiFetch('/auth/profile', { method: 'PUT', body: data }),
    getUser: (id) => apiFetch(`/auth/users/${id}`),

    // Post Routes
    getFeed: () => apiFetch('/posts'),
    createPost: (formData) => {
         // Custom handling since it's FormData
         return apiFetch('/posts', {
             method: 'POST',
             body: formData
         });
    },
    likePost: (postId) => apiFetch(`/posts/${postId}/like`, { method: 'PUT' }),
    addComment: (postId, content) => apiFetch(`/posts/${postId}/comment`, { method: 'POST', body: { content } }),

    // Network Routes
    getNetworkSuggestions: () => apiFetch('/network/suggestions'),
    connectUser: (id) => apiFetch(`/network/connect/${id}`, { method: 'POST' }),

    // AI Routes
    enhanceBio: (bio) => apiFetch('/ai/enhance-bio', { method: 'POST', body: { bio } }),
    enhanceCaption: (caption) => apiFetch('/ai/enhance-caption', { method: 'POST', body: { caption } }),
};
