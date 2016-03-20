var nerdboxPlayer = new NerdboxPlayer({
    api: 'wss://api.nerdbox.fr/illuphisa',
    cover: 'https://api.nerdbox.fr/cover',
    stream: '//nerdbox.fr/streamproxy.php',
    updateInterval: 500
});

nerdboxPlayer.start();
