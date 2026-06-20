document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseNotes = [];
    let selectedUpdate = null;
    let originalTweetText = "";
    
    let activeFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const lastUpdatedSpan = document.getElementById('last-updated');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const typeFiltersContainer = document.getElementById('type-filters');
    
    const notesTimeline = document.getElementById('notes-timeline');
    const notesLoading = document.getElementById('notes-loading');
    const notesError = document.getElementById('notes-error');
    const notesEmpty = document.getElementById('notes-empty');
    const errorMessage = document.getElementById('error-message');
    const btnRetry = document.getElementById('btn-retry');

    const composerEmpty = document.getElementById('composer-empty');
    const composerActive = document.getElementById('composer-active');
    const composerSourceDate = document.getElementById('composer-source-date');
    const composerSourceLink = document.getElementById('composer-source-link');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const tweetCharCount = document.getElementById('tweet-char-count');
    const btnResetTweet = document.getElementById('btn-reset-tweet');
    const tweetPreviewText = document.getElementById('tweet-preview-text');
    const btnShareTweet = document.getElementById('btn-share-tweet');
    const composerBadge = document.querySelector('.composer-badge');
    const sharingSection = document.querySelector('.sharing-section');

    // Add close button for mobile drawer dynamically
    const sharingHeader = document.querySelector('.sharing-header');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close-drawer-js';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        display: none;
        padding: 0 5px;
    `;
    sharingHeader.appendChild(closeBtn);

    // Style for JavaScript elements
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-close-drawer-js:hover {
            color: var(--text-primary);
        }
        @media (max-width: 1100px) {
            .btn-close-drawer-js {
                display: block !important;
            }
            .sharing-header {
                justify-content: space-between;
            }
        }
    `;
    document.head.appendChild(style);

    closeBtn.addEventListener('click', () => {
        sharingSection.classList.remove('drawer-open');
    });

    // ==========================================================================
    // Fetch Data from Backend API
    // ==========================================================================
    async function fetchReleaseNotes(forceRefresh = false) {
        setLoadingState(true);
        try {
            const response = await fetch(`/api/notes?refresh=${forceRefresh}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch release notes: ${response.statusText}`);
            }
            const data = await response.json();
            releaseNotes = data.notes;
            
            // Format last fetched time
            const lastFetched = new Date(data.last_fetched);
            lastUpdatedSpan.textContent = `Last updated: ${lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
            
            setLoadingState(false);
            renderNotes();
        } catch (error) {
            console.error(error);
            setLoadingState(false, error.message);
        }
    }

    function setLoadingState(isLoading, errorMsg = null) {
        if (isLoading) {
            notesLoading.classList.remove('hidden');
            notesTimeline.classList.add('hidden');
            notesError.classList.add('hidden');
            notesEmpty.classList.add('hidden');
            btnRefresh.classList.add('loading');
            btnRefresh.disabled = true;
        } else {
            notesLoading.classList.add('hidden');
            btnRefresh.classList.remove('loading');
            btnRefresh.disabled = false;
            
            if (errorMsg) {
                notesError.classList.remove('hidden');
                errorMessage.textContent = errorMsg;
                notesTimeline.classList.add('hidden');
            } else {
                notesError.classList.add('hidden');
                notesTimeline.classList.remove('hidden');
            }
        }
    }

    // ==========================================================================
    // Render Timeline & Cards
    // ==========================================================================
    function renderNotes() {
        notesTimeline.innerHTML = '';
        let matchCount = 0;

        releaseNotes.forEach(group => {
            // Filter the updates in this date group
            const filteredUpdates = group.updates.filter(update => {
                // Type Filter
                const matchesType = activeFilter === 'all' || update.type.toLowerCase() === activeFilter;
                
                // Search Query Filter
                const query = searchQuery.trim().toLowerCase();
                const matchesSearch = !query || 
                    update.type.toLowerCase().includes(query) || 
                    update.text.toLowerCase().includes(query) || 
                    group.date.toLowerCase().includes(query);
                    
                return matchesType && matchesSearch;
            });

            if (filteredUpdates.length > 0) {
                matchCount += filteredUpdates.length;

                // Create date group element
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';
                
                // Dot indicator
                const indicator = document.createElement('div');
                indicator.className = 'date-indicator';
                dateGroup.appendChild(indicator);

                // Date Header
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                
                const title = document.createElement('h3');
                title.textContent = group.date;
                dateHeader.appendChild(title);

                if (group.link) {
                    const docLink = document.createElement('a');
                    docLink.className = 'date-notes-link';
                    docLink.href = group.link;
                    docLink.target = '_blank';
                    docLink.innerHTML = `
                        Official Notes
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    `;
                    dateHeader.appendChild(docLink);
                }
                dateGroup.appendChild(dateHeader);

                // Add Update Cards
                filteredUpdates.forEach(update => {
                    const card = document.createElement('article');
                    card.className = 'update-card';
                    card.id = update.id;
                    
                    // Highlight if currently selected
                    if (selectedUpdate && selectedUpdate.id === update.id) {
                        card.classList.add('selected');
                    }

                    // Card Header
                    const cardHeader = document.createElement('div');
                    cardHeader.className = 'card-header';

                    // Tag Badge
                    const badge = document.createElement('span');
                    const normalizedType = update.type.toLowerCase();
                    const badgeClass = ['feature', 'announcement', 'issue', 'deprecation', 'update'].includes(normalizedType)
                        ? normalizedType
                        : 'update';
                    badge.className = `type-badge ${badgeClass}`;
                    badge.textContent = update.type;
                    cardHeader.appendChild(badge);

                    // Selection / Tweet button
                    const selectBtn = document.createElement('button');
                    selectBtn.className = 'btn-select-update';
                    
                    const isSelected = selectedUpdate && selectedUpdate.id === update.id;
                    selectBtn.innerHTML = isSelected 
                        ? `Selected <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                        : `Select & Tweet <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>`;
                    
                    selectBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Avoid triggering card click if we click the button
                        selectUpdate(update, group);
                    });
                    
                    cardHeader.appendChild(selectBtn);
                    card.appendChild(cardHeader);

                    // Card Content
                    const cardContent = document.createElement('div');
                    cardContent.className = 'card-content';
                    cardContent.innerHTML = update.html;
                    card.appendChild(cardContent);

                    // Make whole card clickable for selection
                    card.addEventListener('click', () => {
                        selectUpdate(update, group);
                    });

                    dateGroup.appendChild(card);
                });

                notesTimeline.appendChild(dateGroup);
            }
        });

        // Toggle Empty state
        if (matchCount === 0) {
            notesEmpty.classList.remove('hidden');
            notesTimeline.classList.add('hidden');
        } else {
            notesEmpty.classList.add('hidden');
            notesTimeline.classList.remove('hidden');
        }
    }

    // ==========================================================================
    // Update Selection and Tweet Builder
    // ==========================================================================
    function selectUpdate(update, group) {
        // Toggle selected state visually on cards
        document.querySelectorAll('.update-card').forEach(c => {
            c.classList.remove('selected');
            const btn = c.querySelector('.btn-select-update');
            if (btn) {
                btn.innerHTML = `Select & Tweet <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>`;
            }
        });

        // If clicking the already selected card, we keep it selected (or we could unselect, but standard select behavior is better)
        selectedUpdate = update;
        const selectedCard = document.getElementById(update.id);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const btn = selectedCard.querySelector('.btn-select-update');
            if (btn) {
                btn.innerHTML = `Selected <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            }
        }

        // Setup Composer fields
        composerEmpty.classList.add('hidden');
        composerActive.classList.remove('hidden');
        composerBadge.textContent = "Drafting Share";
        
        composerSourceDate.textContent = group.date;
        composerSourceLink.href = group.link || "https://docs.cloud.google.com/bigquery/docs/release-notes";
        
        // Generate formatted default text
        originalTweetText = generateDefaultTweet(update, group);
        tweetTextarea.value = originalTweetText;
        
        // Update counts and previews
        handleTextareaInput();
        
        // Slide drawer up on mobile/tablet viewports
        if (window.innerWidth <= 1100) {
            sharingSection.classList.add('drawer-open');
        }
    }

    function generateDefaultTweet(update, group) {
        const dateStr = group.date;
        const typeStr = update.type;
        const details = update.text;
        const link = group.link || "https://docs.cloud.google.com/bigquery/docs/release-notes";

        // Tag format
        const hashtag = "#BigQuery";
        const prefix = `Google Cloud ${hashtag} Update (${dateStr}): [${typeStr}] `;
        
        // In X/Twitter, a link counts as exactly 23 characters regardless of length
        const linkLength = 23;
        const spacerLength = 1; // space before link
        
        // Maximum allowed characters for the main details
        const maxDetailsLength = 280 - prefix.length - spacerLength - linkLength;
        
        let trimmedDetails = details;
        if (details.length > maxDetailsLength) {
            // Truncate details to fit with ellipsis
            trimmedDetails = details.substring(0, maxDetailsLength - 3).trim() + "...";
        }
        
        return `${prefix}${trimmedDetails} ${link}`;
    }

    // Smart Character Counter (matches Twitter/X intent formatting)
    function calculateTwitterLength(text) {
        // Twitter url length is 23 characters.
        const urlRegex = /https?:\/\/[^\s]+/g;
        let length = text.length;
        
        // Find all URLs and calculate their length
        const urls = text.match(urlRegex) || [];
        urls.forEach(url => {
            // Subtract actual url length, add 23
            length = length - url.length + 23;
        });
        
        return length;
    }

    function handleTextareaInput() {
        const text = tweetTextarea.value;
        const length = calculateTwitterLength(text);
        
        tweetCharCount.textContent = length;
        
        // Color coding character count
        if (length > 280) {
            tweetCharCount.className = 'danger';
            btnShareTweet.disabled = true;
        } else if (length > 250) {
            tweetCharCount.className = 'warning';
            btnShareTweet.disabled = false;
        } else {
            tweetCharCount.className = '';
            btnShareTweet.disabled = text.trim().length === 0;
        }

        // Render Twitter Preview content (making links clickable visually, etc.)
        renderTweetPreview(text);
    }

    function renderTweetPreview(text) {
        if (!text.trim()) {
            tweetPreviewText.innerHTML = '<span style="color: #71767b">Compose your tweet text above...</span>';
            return;
        }

        // Match links and format them
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let formattedText = escapeHtml(text);
        
        formattedText = formattedText.replace(urlRegex, (url) => {
            return `<span style="color: var(--twitter-color)">${url}</span>`;
        });

        // Match hashtags and format them
        const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
        formattedText = formattedText.replace(hashtagRegex, (hashtag) => {
            return `<span style="color: var(--twitter-color)">${hashtag}</span>`;
        });

        tweetPreviewText.innerHTML = formattedText;
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // ==========================================================================
    // Event Listeners & Interaction Handles
    // ==========================================================================
    
    // Refresh Button Click
    btnRefresh.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Retry Button Click
    btnRetry.addEventListener('click', () => {
        fetchReleaseNotes(false);
    });

    // Textarea editing
    tweetTextarea.addEventListener('input', handleTextareaInput);

    // Reset button
    btnResetTweet.addEventListener('click', () => {
        tweetTextarea.value = originalTweetText;
        handleTextareaInput();
    });

    // Share on Twitter Intent
    btnShareTweet.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.trim() && calculateTwitterLength(text) <= 280) {
            const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(tweetUrl, '_blank', 'noopener,noreferrer');
        }
    });

    // Filter Chips Selection
    typeFiltersContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        // Toggle Active styles
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        // Set state & render
        activeFilter = chip.dataset.type;
        renderNotes();
    });

    // Search input handling
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        
        // Show/hide clear search button
        if (searchQuery.trim().length > 0) {
            searchClear.style.display = 'block';
        } else {
            searchClear.style.display = 'none';
        }
        
        renderNotes();
    });

    // Search clear button
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        renderNotes();
        searchInput.focus();
    });

    // Kickoff application loading
    fetchReleaseNotes(false);
});
