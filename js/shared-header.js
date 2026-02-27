(() => {
    const homeUrl = 'index.html';
    const homeLabel = '📚 xFormly ユーザーガイド';

    const navContents = document.querySelectorAll('.top-nav .nav-content');
    navContents.forEach((navContent) => {
        navContent.innerHTML = '';

        const homeLink = document.createElement('a');
        homeLink.href = homeUrl;
        homeLink.className = 'home-link';
        homeLink.textContent = homeLabel;

        navContent.appendChild(homeLink);
    });
})();
