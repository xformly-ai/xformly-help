(function () {
    function normalizeText(text) {
        return (text || '').toLowerCase().trim();
    }

    function resolveTargets(targets) {
        if (!targets) {
            return [];
        }

        if (typeof targets === 'string') {
            return Array.from(document.querySelectorAll(targets));
        }

        if (targets instanceof Element) {
            return [targets];
        }

        return Array.from(targets);
    }

    function setupPageSearch(config) {
        if (!config || !config.input) {
            return;
        }

        const searchInput = config.input;
        const statusElement = config.status;
        const targets = resolveTargets(config.targets);
        const debounceMs = typeof config.debounceMs === 'number' ? config.debounceMs : 150;
        const noResultText = config.noResultText || '該当する項目は見つかりませんでした。';
        const countText = config.countText || ((count) => count + '件を表示中（部分一致）');

        let debounceTimer = null;

        const setStatus = (text, visible) => {
            if (!statusElement) {
                return;
            }
            statusElement.textContent = text;
            statusElement.hidden = !visible;
        };

        const resetSearch = () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            searchInput.value = '';
            targets.forEach((target) => {
                target.style.display = '';
            });
            setStatus('', false);
        };

        const runSearch = (query) => {
            const normalizedQuery = normalizeText(query);

            if (!normalizedQuery) {
                resetSearch();
                return;
            }

            let visibleCount = 0;

            targets.forEach((target) => {
                const text = normalizeText(target.textContent);
                const isMatch = text.includes(normalizedQuery);
                target.style.display = isMatch ? '' : 'none';
                if (isMatch) {
                    visibleCount += 1;
                }
            });

            if (visibleCount === 0) {
                setStatus(noResultText, true);
                return;
            }

            const text = typeof countText === 'function' ? countText(visibleCount) : String(countText);
            setStatus(text, true);
        };

        searchInput.addEventListener('input', (event) => {
            const query = event.target.value || '';
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                runSearch(query);
            }, debounceMs);
        });

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                resetSearch();
            }
        });
    }

    window.setupPageSearch = setupPageSearch;
})();
