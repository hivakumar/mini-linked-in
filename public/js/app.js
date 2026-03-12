// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const feedContainer = document.getElementById('feedContainer');
    
    // Post Modal Elements
    const createPostModal = document.getElementById('createPostModal');
    const createPostModalInner = document.getElementById('createPostModalInner');
    const btnTriggerPostModal = document.getElementById('btnTriggerPostModal');
    const btnClosePostModal = document.getElementById('btnClosePostModal');
    
    // Post Form Elements
    const postContent = document.getElementById('postContent');
    const postImageUpload = document.getElementById('postImageUpload');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    const btnSubmitPost = document.getElementById('btnSubmitPost');
    const btnEnhanceCaption = document.getElementById('btnEnhanceCaption');
    
    // Modal User Info
    const modalAvatar = document.getElementById('modalAvatar');
    const modalUserName = document.getElementById('modalUserName');
    const postBoxAvatar = document.getElementById('postBoxAvatar');

    let selectedImageFile = null;

    // --- Modal Logic ---
    const openPostModal = () => {
        if (!window.currentUserDB) return showToast('Please log in first', 'error');
        
        createPostModal.classList.remove('hidden');
        createPostModal.classList.add('flex');
        
        // Setup user info in modal
        modalAvatar.src = window.currentUserDB.profilePicture || 'https://via.placeholder.com/48';
        modalUserName.textContent = window.currentUserDB.name;
        
        // Animate in
        requestAnimationFrame(() => {
            createPostModalInner.classList.remove('scale-95', 'opacity-0');
            createPostModalInner.classList.add('scale-100', 'opacity-100');
            postContent.focus();
        });
    };

    const closePostModal = () => {
        createPostModalInner.classList.remove('scale-100', 'opacity-100');
        createPostModalInner.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            createPostModal.classList.add('hidden');
            createPostModal.classList.remove('flex');
            // reset form
            postContent.value = '';
            selectedImageFile = null;
            postImageUpload.value = '';
            imagePreviewContainer.classList.add('hidden');
            imagePreview.src = '';
            updateSubmitButtonState();
        }, 200);
    };

    if(btnTriggerPostModal) btnTriggerPostModal.addEventListener('click', openPostModal);
    if(btnClosePostModal) btnClosePostModal.addEventListener('click', closePostModal);

    // --- Post Form Logic ---
    const updateSubmitButtonState = () => {
        const hasText = postContent.value.trim().length > 0;
        const hasImage = selectedImageFile !== null;
        btnSubmitPost.disabled = !(hasText || hasImage);
    };

    postContent.addEventListener('input', updateSubmitButtonState);

    postImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
        updateSubmitButtonState();
    });

    btnRemoveImage.addEventListener('click', () => {
        selectedImageFile = null;
        postImageUpload.value = '';
        imagePreviewContainer.classList.add('hidden');
        imagePreview.src = '';
        updateSubmitButtonState();
    });

    // --- AI Enhance Caption ---
    btnEnhanceCaption.addEventListener('click', async () => {
        const currentText = postContent.value.trim();
        if(!currentText) {
            return showToast('Please write a draft first to enhance it!', 'warning');
        }

        const originalHTML = btnEnhanceCaption.innerHTML;
        btnEnhanceCaption.innerHTML = '<i class="fas fa-spinner fa-spin text-purple-500"></i> Enhancing...';
        btnEnhanceCaption.disabled = true;

        try {
            const result = await window.api.enhanceCaption(currentText);
            postContent.value = result.enhancedCaption;
            showToast('Caption enhanced successfully!', 'success');
            updateSubmitButtonState();
        } catch (error) {
            showToast('Failed to enhance caption', 'error');
        } finally {
            btnEnhanceCaption.innerHTML = originalHTML;
            btnEnhanceCaption.disabled = false;
        }
    });

    // --- Submit Post ---
    btnSubmitPost.addEventListener('click', async () => {
        const content = postContent.value.trim();
        
        const originalText = btnSubmitPost.textContent;
        btnSubmitPost.textContent = 'Posting...';
        btnSubmitPost.disabled = true;

        const formData = new FormData();
        formData.append('content', content);
        if (selectedImageFile) {
            formData.append('image', selectedImageFile);
        }

        try {
            const res = await window.api.createPost(formData);
            closePostModal();
            showToast('Post created successfully!', 'success');
            
            // Re-fetch feed to show new post
            loadFeed();

            // Show Skill Match Notification if exists
            if (res.matchNotification) {
                Swal.fire({
                    icon: 'info',
                    title: 'Skill Match Found! 🤝',
                    text: res.matchNotification,
                    confirmButtonColor: '#0a66c2',
                    confirmButtonText: 'View Network'
                });
            }

        } catch (error) {
            showToast(error.message, 'error');
            btnSubmitPost.textContent = originalText;
            btnSubmitPost.disabled = false;
        }
    });

    // --- Feed Logic ---
    const loadFeed = async () => {
        if(!feedContainer) return;
        
        try {
            const posts = await window.api.getFeed();
            renderFeed(posts);
        } catch (error) {
            feedContainer.innerHTML = '<p class="text-center text-red-500 py-10">Failed to load feed.</p>';
        }
    };

    const renderFeed = (posts) => {
        feedContainer.innerHTML = ''; // clear loading

        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="bg-surface rounded-lg shadow p-8 text-center border">
                    <img src="https://static.licdn.com/aero-v1/sc/h/c5f32dox01qmb0a03p7s479lq" class="mx-auto h-32 mb-4 opacity-50" alt="empty">
                    <h3 class="text-xl font-semibold text-gray-800">Your feed is empty</h3>
                    <p class="text-gray-500 mt-2">Start connecting with people or create a post to see updates here.</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'bg-surface rounded-lg shadow border border-gray-200 overflow-hidden';
            
            const isLikedByMe = window.currentUserDB ? post.likes.includes(window.currentUserDB._id) : false;
            
            // Format Date
            const dateObj = new Date(post.createdAt);
            const timeAgo = Math.floor((new Date() - dateObj) / (1000 * 60 * 60 * 24)) === 0 
                ? 'Today' : dateObj.toLocaleDateString();

            // Format Skills tag if extracted
            let skillTagsHtml = '';
            if (post.skillsMentioned && post.skillsMentioned.length > 0) {
                 skillTagsHtml = `
                    <div class="px-4 py-2 bg-blue-50 border-y border-blue-100 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-yellow-500"></i>
                        <span class="text-xs text-blue-800 font-semibold">Skills detected:</span>
                        <div class="flex gap-1 flex-wrap">
                            ${post.skillsMentioned.map(s => `<span class="text-xs bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full">${s}</span>`).join('')}
                        </div>
                    </div>
                `;
            }

            postEl.innerHTML = `
                <div class="p-4 flex gap-3 pb-2">
                    <img src="${post.userId?.profilePicture || 'https://via.placeholder.com/48'}" class="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-100">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-900 leading-tight hover:text-linkedin hover:underline cursor-pointer">${post.userId?.name || 'Unknown'}</h4>
                        <p class="text-xs text-gray-500">Member</p>
                        <p class="text-xs text-gray-400 mt-0.5" title="${dateObj.toLocaleString()}">${timeAgo} • <i class="fas fa-globe-americas w-3"></i></p>
                    </div>
                    <button class="text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                
                <div class="px-4 pb-3">
                    <p class="text-sm text-gray-800 whitespace-pre-line leading-relaxed">${escapeHtml(post.content)}</p>
                </div>

                ${post.imageUrl ? `<img src="${post.imageUrl}" class="w-full max-h-96 object-cover border-y">` : ''}
                
                ${post.resumeUrl ? `
                    <div class="px-4 py-3 bg-gray-50 border-y flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-file-pdf text-red-500 text-xl"></i>
                            <div>
                                <p class="text-sm font-bold text-gray-800">Resume Attached</p>
                                <p class="text-xs text-gray-500">PDF Document</p>
                            </div>
                        </div>
                        <a href="${post.resumeUrl}" target="_blank" class="px-4 py-1.5 border border-linkedin text-linkedin rounded-full text-sm font-semibold hover:bg-blue-50 transition">
                            View Resume
                        </a>
                    </div>
                ` : ''}

                ${skillTagsHtml}

                <div class="px-4 py-2 flex justify-between items-center text-xs text-gray-500 border-b">
                    <div class="flex items-center gap-1">
                        <img src="https://static.licdn.com/aero-v1/sc/h/8ekq8gho1ruaf8i7f86vd1rz9" alt="like" class="w-4 h-4">
                        <span id="like-count-${post._id}">${post.likes.length}</span>
                    </div>
                    <div>
                        <span class="hover:text-linkedin hover:underline cursor-pointer">${post.comments.length} comments</span>
                    </div>
                </div>

                <div class="flex px-2 py-1">
                    <button class="like-btn flex-1 flex items-center justify-center gap-2 py-3 rounded hover:bg-gray-100 text-sm font-semibold transition ${isLikedByMe ? 'text-linkedin' : 'text-gray-600'}" data-id="${post._id}">
                        <i class="fa${isLikedByMe ? 's' : 'r'} fa-thumbs-up fa-lg transform ${isLikedByMe ? '-scale-y-100' : ''}"></i> Like
                    </button>
                    <button class="comment-trigger flex-1 flex items-center justify-center gap-2 py-3 rounded hover:bg-gray-100 text-gray-600 text-sm font-semibold transition">
                        <i class="far fa-comment-dots fa-lg text-gray-500"></i> Comment
                    </button>
                     <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded hover:bg-gray-100 text-gray-600 text-sm font-semibold transition hidden sm:flex">
                        <i class="fas fa-retweet fa-lg text-gray-500"></i> Repost
                    </button>
                    <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded hover:bg-gray-100 text-gray-600 text-sm font-semibold transition">
                        <i class="fas fa-paper-plane fa-lg text-gray-500 -mt-1"></i> Send
                    </button>
                </div>
            `;

            // Setup Like behavior
            const likeBtn = postEl.querySelector('.like-btn');
            likeBtn.addEventListener('click', async () => {
                if(!window.currentUserDB) return showToast('Please log in to like posts', 'info');
                try {
                    const res = await window.api.likePost(post._id);
                    const countSpan = document.getElementById(`like-count-${post._id}`);
                    countSpan.textContent = res.likes.length;
                    
                    const icon = likeBtn.querySelector('i');
                    if(res.likes.includes(window.currentUserDB._id)) {
                        likeBtn.classList.replace('text-gray-600', 'text-linkedin');
                        icon.classList.replace('far', 'fas');
                    } else {
                        likeBtn.classList.replace('text-linkedin', 'text-gray-600');
                        icon.classList.replace('fas', 'far');
                    }
                } catch (e) {
                    showToast('Failed to toggle like', 'error');
                }
            });

            feedContainer.appendChild(postEl);
        });
    };

    // Helper to escape HTML tags in strings to prevent XSS
    function escapeHtml(unsafe) {
        if(!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    const showToast = (msg, type='info') => {
        Swal.fire({
            icon: type,
            title: msg,
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    };

    // --- Networking Widget ---
    const loadNetworkSuggestions = async () => {
        const networkContainer = document.getElementById('networkWidgetContainer');
        const networkList = document.getElementById('networkSuggestionsList');
        if(!networkContainer || !networkList) return;

        try {
            const suggestions = await window.api.getNetworkSuggestions();
            if(suggestions.length > 0) {
                networkContainer.classList.remove('hidden');
                networkList.innerHTML = suggestions.map(user => `
                    <div class="flex items-center gap-3">
                        <img src="${user.profilePicture || 'https://via.placeholder.com/48'}" class="w-12 h-12 rounded-full object-cover">
                        <div class="flex-1 overflow-hidden">
                            <p class="text-sm font-bold text-gray-900 truncate">${user.name}</p>
                            <p class="text-xs text-gray-500 truncate">${user.companyName || user.bio || 'Member'}</p>
                            <button class="connect-btn mt-1 text-sm font-semibold text-gray-600 border border-gray-500 rounded-full px-4 py-1 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-900 transition flex items-center justify-center gap-1 w-full" data-id="${user._id}">
                                <i class="fas fa-user-plus"></i> Connect
                            </button>
                        </div>
                    </div>
                `).join('');

                // Attach connect logic
                networkList.querySelectorAll('.connect-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        if (!window.currentUserDB) {
                             return showToast('Please log in to connect', 'info');
                        }

                        const targetId = e.currentTarget.getAttribute('data-id');
                        const originalHtml = e.currentTarget.innerHTML;
                        e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        e.currentTarget.disabled = true;

                        try {
                            await window.api.connectUser(targetId);
                            e.currentTarget.innerHTML = '<i class="fas fa-check text-green-600"></i> Connected';
                            e.currentTarget.classList.replace('text-gray-600', 'text-green-600');
                            e.currentTarget.classList.replace('border-gray-500', 'border-green-600');
                            showToast('Connection established!', 'success');
                            
                            // Immediately reload network to refresh the list
                            setTimeout(loadNetworkSuggestions, 2000);
                        } catch (err) {
                            showToast('Failed to connect', 'error');
                            e.currentTarget.innerHTML = originalHtml;
                            e.currentTarget.disabled = false;
                        }
                    });
                });
            } else {
                networkContainer.classList.add('hidden');
            }
        } catch(error) {
            console.error('Failed to load network suggestions', error);
        }
    };

    // Listen for auth readiness
    window.addEventListener('auth-ready', () => {
        loadFeed();
        loadNetworkSuggestions();
        
        // Update little avatar next to "Start a post"
        if(window.currentUserDB && postBoxAvatar) {
            postBoxAvatar.src = window.currentUserDB.profilePicture || 'https://via.placeholder.com/48';
        }
    });

});
