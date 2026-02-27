(function () {
    const DEFAULT_INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, summary';

    function normalizePanels(targets) {
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

    function setupPanelNavigation(targets, options) {
        const config = options || {};
        const interactiveSelector = config.interactiveSelector || DEFAULT_INTERACTIVE_SELECTOR;
        const assignAccessibility = config.assignAccessibility !== false;
        const panels = normalizePanels(targets);

        panels.forEach((panel) => {
            if (!(panel instanceof Element)) {
                return;
            }

            if (assignAccessibility) {
                if (!panel.hasAttribute('tabindex')) {
                    panel.setAttribute('tabindex', '0');
                }
                if (!panel.hasAttribute('role')) {
                    panel.setAttribute('role', 'link');
                }
            }

            const navigate = () => {
                const url = panel.getAttribute('data-category-url');
                if (url) {
                    window.location.href = url;
                }
            };

            panel.addEventListener('click', (event) => {
                if (event.target.closest(interactiveSelector)) {
                    return;
                }
                navigate();
            });

            panel.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }
                if (event.target.closest(interactiveSelector)) {
                    return;
                }
                event.preventDefault();
                navigate();
            });
        });
    }

    window.setupPanelNavigation = setupPanelNavigation;
})();
