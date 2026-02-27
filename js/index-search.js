(function () {
    function normalizeText(text) {
        return (text || '').toLowerCase().trim();
    }

    function collapseWhitespace(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function setupIndexSearch(config) {
        if (!config) {
            return;
        }

        const searchInput = config.searchInput;
        const navCards = Array.from(config.navCards || []);
        const quickLinkItems = Array.from(config.quickLinkItems || []);
        const globalSearchResults = config.globalSearchResults;
        const searchStatus = config.searchStatus;
        const searchResultsList = config.searchResultsList;
        const homeResetTrigger = config.homeResetTrigger;
        const guideMetadata = Array.from(config.guideMetadata || []);
        const searchResultLimit = typeof config.searchResultLimit === 'number' ? config.searchResultLimit : 8;
        const searchDebounceMs = typeof config.searchDebounceMs === 'number' ? config.searchDebounceMs : 150;

        if (!searchInput || !globalSearchResults || !searchStatus || !searchResultsList) {
            return;
        }

        const fallbackPageIndex = guideMetadata.map((entry) => {
            const content = collapseWhitespace(entry.fallbackKeywords || '');
            return {
                url: entry.url,
                title: entry.title,
                content,
                searchText: normalizeText(entry.title + ' ' + content)
            };
        });

        let pageIndex = [];
        let isLoadingIndex = false;
        let inputDebounceTimer = null;

        const setSearchStatus = (text) => {
            searchStatus.textContent = text;
        };

        const createSnippet = (content, query) => {
            const collapsedContent = collapseWhitespace(content);
            const normalizedContent = normalizeText(collapsedContent);
            const foundIndex = normalizedContent.indexOf(query);

            if (foundIndex === -1) {
                return collapsedContent.slice(0, 120) + (collapsedContent.length > 120 ? '…' : '');
            }

            const start = Math.max(0, foundIndex - 45);
            const end = Math.min(collapsedContent.length, foundIndex + query.length + 65);
            const rawSnippet = collapsedContent.slice(start, end);

            return (start > 0 ? '…' : '') + rawSnippet + (end < collapsedContent.length ? '…' : '');
        };

        const filterTopPageByQuery = (query) => {
            const normalizedQuery = normalizeText(query);

            navCards.forEach((card) => {
                const cardText = normalizeText(card.textContent);
                card.style.display = cardText.includes(normalizedQuery) ? '' : 'none';
            });

            quickLinkItems.forEach((item) => {
                const itemText = normalizeText(item.textContent);
                item.style.display = itemText.includes(normalizedQuery) ? '' : 'none';
            });
        };

        const hideGlobalResults = () => {
            globalSearchResults.hidden = true;
            searchResultsList.innerHTML = '';
            setSearchStatus('');
        };

        const resetToInitialView = () => {
            if (inputDebounceTimer) {
                clearTimeout(inputDebounceTimer);
            }
            searchInput.value = '';
            filterTopPageByQuery('');
            hideGlobalResults();
        };

        const renderGlobalResults = (query) => {
            const normalizedQuery = normalizeText(query);

            if (!normalizedQuery) {
                hideGlobalResults();
                return;
            }

            globalSearchResults.hidden = false;
            searchResultsList.innerHTML = '';

            if (pageIndex.length === 0) {
                setSearchStatus('検索インデックスを準備中です。数秒後に再度お試しください。');
                return;
            }

            const matches = pageIndex
                .filter((entry) => entry.searchText.includes(normalizedQuery))
                .slice(0, searchResultLimit);

            if (matches.length === 0) {
                setSearchStatus('該当するページは見つかりませんでした。');
                return;
            }

            const loadingSuffix = isLoadingIndex ? '（読み込み中のため結果は変わる場合があります）' : '';
            setSearchStatus(matches.length + '件の候補ページ（部分一致・最大' + searchResultLimit + '件）' + loadingSuffix);

            matches.forEach((match) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                const snippet = document.createElement('p');

                link.href = match.url;
                link.textContent = match.title;

                snippet.className = 'result-snippet';
                snippet.textContent = createSnippet(match.content, normalizedQuery);

                listItem.appendChild(link);
                listItem.appendChild(snippet);
                searchResultsList.appendChild(listItem);
            });
        };

        const buildSearchIndex = async () => {
            isLoadingIndex = true;
            pageIndex = fallbackPageIndex;

            const parser = new DOMParser();
            const contentSelector = 'h1, h2, h3, h4, p, li, summary, td, th';

            const loadedPages = await Promise.all(
                guideMetadata.map(async (meta) => {
                    try {
                        const response = await fetch(meta.url);

                        if (!response.ok) {
                            console.warn('検索インデックス読み込み失敗:', meta.url, 'status:', response.status);
                            return null;
                        }

                        const html = await response.text();
                        const doc = parser.parseFromString(html, 'text/html');
                        const title = collapseWhitespace(doc.title || meta.title || meta.url);
                        const nodes = Array.from(doc.querySelectorAll(contentSelector));
                        const extractedText = nodes.map((node) => collapseWhitespace(node.textContent || '')).join(' ');
                        const content = collapseWhitespace(extractedText || meta.fallbackKeywords || '');

                        return {
                            url: meta.url,
                            title,
                            content,
                            searchText: normalizeText(title + ' ' + content)
                        };
                    } catch (error) {
                        console.warn('検索インデックス読み込み例外:', meta.url, error);
                        return null;
                    }
                })
            );

            const fetchedIndex = loadedPages.filter((entry) => entry && entry.searchText);
            pageIndex = fetchedIndex.length > 0 ? fetchedIndex : fallbackPageIndex;
            isLoadingIndex = false;

            if (normalizeText(searchInput.value)) {
                renderGlobalResults(searchInput.value);
            }
        };

        const performSearch = (query) => {
            filterTopPageByQuery(query);
            renderGlobalResults(query);
        };

        searchInput.addEventListener('input', (event) => {
            const query = event.target.value || '';

            if (inputDebounceTimer) {
                clearTimeout(inputDebounceTimer);
            }

            inputDebounceTimer = setTimeout(() => {
                performSearch(query);
            }, searchDebounceMs);
        });

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                resetToInitialView();
            }
        });

        if (homeResetTrigger) {
            homeResetTrigger.addEventListener('click', resetToInitialView);
        }

        buildSearchIndex();
    }

    window.setupIndexSearch = setupIndexSearch;
})();
