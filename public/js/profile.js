// public/js/profile.js

document.addEventListener('DOMContentLoaded', () => {

    // Profile UI Elements
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileHeadline = document.getElementById('profileHeadline');
    const profileBio = document.getElementById('profileBio');
    const skillsContainer = document.getElementById('skillsContainer');
    const noSkillsMessage = document.getElementById('noSkillsMessage');

    // Bio Edit Elements
    const btnEditBioMode = document.getElementById('btnEditBioMode');
    const bioViewMode = document.getElementById('bioViewMode');
    const bioEditMode = document.getElementById('bioEditMode');
    const editBioText = document.getElementById('editBioText');
    const btnEnhanceBio = document.getElementById('btnEnhanceBio');
    const btnCancelBio = document.getElementById('btnCancelBio');
    const btnSaveBio = document.getElementById('btnSaveBio');

    // Skills Edit Elements
    const btnEditSkillsMode = document.getElementById('btnEditSkillsMode');
    const skillsViewMode = document.getElementById('skillsViewMode');
    const skillsEditMode = document.getElementById('skillsEditMode');
    const editSkillsInput = document.getElementById('editSkillsInput');
    const btnCancelSkills = document.getElementById('btnCancelSkills');
    const btnSaveSkills = document.getElementById('btnSaveSkills');

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

    // Load Profile Data
    const loadProfile = async () => {
        try {
            const user = await window.api.getProfile();
            
            // Populate UI
            profileAvatar.src = user.profilePicture || 'https://via.placeholder.com/150';
            profileName.textContent = user.name;
            
            // Derive a headline from skills if exists
            if (user.skills && user.skills.length > 0) {
                profileHeadline.textContent = `${user.skills[0]} Professional`;
            } else {
                profileHeadline.textContent = 'Enthusiastic Learner';
            }

            profileBio.textContent = user.bio || 'No bio provided yet. Add one to stand out!';
            editBioText.value = user.bio || '';
            
            const editResumeUrl = document.getElementById('editResumeUrl');
            if (editResumeUrl) editResumeUrl.value = user.resumeUrl || '';
            
            const resumeBadge = document.getElementById('resumeBadgeContainer');
            const btnViewResume = document.getElementById('btnViewResume');
            if (user.resumeUrl && resumeBadge && btnViewResume) {
                resumeBadge.classList.remove('hidden');
                btnViewResume.href = user.resumeUrl;
            }

            renderSkills(user.skills || []);
            editSkillsInput.value = (user.skills || []).join(', ');

        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Failed to load profile data', 'error');
        }
    };

    const renderSkills = (skills) => {
        skillsContainer.innerHTML = '';
        if (skills.length === 0) {
            noSkillsMessage.classList.remove('hidden');
        } else {
            noSkillsMessage.classList.add('hidden');
            skills.forEach(skill => {
                const el = document.createElement('span');
                el.className = 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-semibold py-1.5 px-4 rounded-full transition cursor-default shadow-sm';
                el.textContent = skill;
                skillsContainer.appendChild(el);
            });
        }
    };

    // --- Bio Edit Toggle ---
    btnEditBioMode.addEventListener('click', () => {
        bioViewMode.classList.add('hidden');
        bioEditMode.classList.remove('hidden');
    });

    btnCancelBio.addEventListener('click', () => {
        bioViewMode.classList.remove('hidden');
        bioEditMode.classList.add('hidden');
        editBioText.value = profileBio.textContent !== 'No bio provided yet. Add one to stand out!' ? profileBio.textContent : '';
    });

    // --- AI Bio Enhance ---
    btnEnhanceBio.addEventListener('click', async () => {
        const currentBio = editBioText.value.trim();
        if(!currentBio) {
            return showToast('Please write a rough draft of your bio first!', 'warning');
        }

        const originalHTML = btnEnhanceBio.innerHTML;
        btnEnhanceBio.innerHTML = '<i class="fas fa-spinner fa-spin text-purple-500"></i> Enhancing...';
        btnEnhanceBio.disabled = true;

        try {
            const result = await window.api.enhanceBio(currentBio);
            editBioText.value = result.enhancedBio;
            showToast('Bio enhanced successfully!', 'success');
        } catch(e) {
            showToast('Failed to enhance bio', 'error');
        } finally {
            btnEnhanceBio.innerHTML = originalHTML;
            btnEnhanceBio.disabled = false;
        }
    });

    // --- Save Bio & Resume ---
    btnSaveBio.addEventListener('click', async () => {
        const newBio = editBioText.value.trim();
        const newResume = document.getElementById('editResumeUrl').value.trim();
        
        const originalText = btnSaveBio.textContent;
        btnSaveBio.textContent = 'Saving...';
        btnSaveBio.disabled = true;

        try {
            const updatedUser = await window.api.updateProfile({ 
                bio: newBio,
                resumeUrl: newResume
            });
            
            profileBio.textContent = updatedUser.bio || 'No bio provided yet. Add one to stand out!';
            
            // Handle Resume Badge
            const resumeBadge = document.getElementById('resumeBadgeContainer');
            const btnViewResume = document.getElementById('btnViewResume');
            if (updatedUser.resumeUrl) {
                resumeBadge.classList.remove('hidden');
                btnViewResume.href = updatedUser.resumeUrl;
            } else {
                resumeBadge.classList.add('hidden');
            }
            
            // Switch back to view mode
            bioViewMode.classList.remove('hidden');
            bioEditMode.classList.add('hidden');
            showToast('Profile updated', 'success');
        } catch(e) {
            showToast('Failed to save profile', 'error');
        } finally {
            btnSaveBio.textContent = originalText;
            btnSaveBio.disabled = false;
        }
    });

    // --- Skills Edit Toggle ---
    btnEditSkillsMode.addEventListener('click', () => {
        skillsViewMode.classList.add('hidden');
        skillsEditMode.classList.remove('hidden');
    });

    btnCancelSkills.addEventListener('click', () => {
        skillsViewMode.classList.remove('hidden');
        skillsEditMode.classList.add('hidden');
        // Reset input to current DB state is handled on loadProfile, 
        // but skipping manual reversion here for simplicity unless fully reloading
    });

    // --- Save Skills ---
    btnSaveSkills.addEventListener('click', async () => {
        const skillsString = editSkillsInput.value;
        // The backend handles splitting by comma
        const originalText = btnSaveSkills.textContent;
        btnSaveSkills.textContent = 'Saving...';
        btnSaveSkills.disabled = true;

        try {
            const updatedUser = await window.api.updateProfile({ skills: skillsString });
            renderSkills(updatedUser.skills || []);
            
            // Switch back to view mode
            skillsViewMode.classList.remove('hidden');
            skillsEditMode.classList.add('hidden');
            showToast('Skills updated', 'success');
        } catch(e) {
            showToast('Failed to save skills', 'error');
        } finally {
             btnSaveSkills.textContent = originalText;
             btnSaveSkills.disabled = false;
        }
    });

    // Wait for auth to be ready
    window.addEventListener('auth-ready', () => {
        if (window.currentUserDB) {
            loadProfile();
        } else {
            // Redirect to home if not logged in
            window.location.href = '/';
        }
    });

});
