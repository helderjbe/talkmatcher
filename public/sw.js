const workboxFolder = '/third_party/workbox-v3.6.3/';

importScripts(workboxFolder + 'workbox-sw.js');

workbox.setConfig(
  {modulePathPrefix: workboxFolder}
);

workbox.precaching.precacheAndRoute([
  {
    "url": "assets/icons/favicon.png",
    "revision": "62b294c90eeedf860512655e3e0aae1a"
  },
  {
    "url": "assets/icons/icon-128x128.png",
    "revision": "c0cf50399cb2ad90208c61e388949d52"
  },
  {
    "url": "assets/icons/icon-144x144.png",
    "revision": "f60c74f53dcfeded3cf33309c9881240"
  },
  {
    "url": "assets/icons/icon-152x152.png",
    "revision": "36ca34c3fac085ab9ddf24af6ff13611"
  },
  {
    "url": "assets/icons/icon-192x192.png",
    "revision": "3a94355c3e59c8659ff973f4418550df"
  },
  {
    "url": "assets/icons/icon-384x384.png",
    "revision": "0773043292600a5591f6f60f316dc417"
  },
  {
    "url": "assets/icons/icon-512x512.png",
    "revision": "7cd137012d432674340047e2d4c4aa3a"
  },
  {
    "url": "assets/icons/icon-72x72.png",
    "revision": "9a2134dcfab1f5e41b8fdff61808a7e9"
  },
  {
    "url": "assets/icons/icon-96x96.png",
    "revision": "833c3d24d1a9ea30cdc5d03ecd272a2f"
  },
  {
    "url": "assets/icons/microphone-all-slash.svg",
    "revision": "52e47718f7e366e39a1d151d1ce09a87"
  },
  {
    "url": "assets/icons/microphone-all.svg",
    "revision": "7ece75bdfe4bfcfa2458f3bc7f2249d3"
  },
  {
    "url": "assets/icons/microphone-slash.svg",
    "revision": "e40d2b6e70e81d1d946994f6b09f166f"
  },
  {
    "url": "assets/icons/microphone.svg",
    "revision": "24e102849f119f522aeb26b1dbc354c1"
  },
  {
    "url": "assets/icons/note-slash.svg",
    "revision": "2409bf0d6da382f8633bc23b9a16a301"
  },
  {
    "url": "assets/icons/note.svg",
    "revision": "03683be41f9033d4b2f821f4f8dff652"
  },
  {
    "url": "assets/icons/volume-off.svg",
    "revision": "aee80802dd5ca5ca062b5dc2169f0023"
  },
  {
    "url": "assets/icons/volume-up.svg",
    "revision": "90211f58ff0422363e67327f8f1bfa82"
  },
  {
    "url": "assets/sounds/enter.mp3",
    "revision": "ffd80e7de1517395f04ae612fa535fc4"
  },
  {
    "url": "assets/sounds/leave.mp3",
    "revision": "131d9a18c792170f7ad600db195959b0"
  },
  {
    "url": "css/main.css",
    "revision": "c99cfb47085d9b4c939707ad519fd315"
  },
  {
    "url": "css/vendors.css",
    "revision": "8f8c900354d97cb56dd4ee02226d1930"
  },
  {
    "url": "index.html",
    "revision": "b352b7b6617cb110f51e70569256556d"
  },
  {
    "url": "js/main.js",
    "revision": "033832948bd16da9f2fa01b296b7b207"
  },
  {
    "url": "js/vendors.js",
    "revision": "d98abfb6a6977f3ea1fcf943cd5cacb9"
  },
  {
    "url": "manifest.json",
    "revision": "8232aa0b5a2031168cfcc62ce63831b9"
  },
  {
    "url": "privacypolicy.html",
    "revision": "c1b585d7ffbf76d9a7cf9cbc2c1ad6fe"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-background-sync.dev.js",
    "revision": "9aea71255fb0f298098812aa11db65b2"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-background-sync.prod.js",
    "revision": "eeaa9c051d9e99a3c5c88b41228c8d74"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-broadcast-cache-update.dev.js",
    "revision": "7acc14de3f5d9f507623f224591ab5b1"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-broadcast-cache-update.prod.js",
    "revision": "a458ad9c8b901966b4d59ce3b4f5a869"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-cache-expiration.dev.js",
    "revision": "7bd916bedfe4c6328761b0fc58f3507b"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-cache-expiration.prod.js",
    "revision": "af8f9fdbc8cae90f380c9bac6f7f78df"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-cacheable-response.dev.js",
    "revision": "195010b28149d1d8ceb4b7b7fd2084e1"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-cacheable-response.prod.js",
    "revision": "f1405e389d94a436707877491034e935"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-core.dev.js",
    "revision": "fe14f58bdd553537c71a1c0c48b23b43"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-core.prod.js",
    "revision": "52d19b122c5b0914811bade1f76a3faa"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-google-analytics.dev.js",
    "revision": "8235344cb0caddf7ddbf05e64a8f26b4"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-google-analytics.prod.js",
    "revision": "cd66b64748b4437ac643840a76db18f6"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-navigation-preload.dev.js",
    "revision": "26cff10167061cbac9fb52b1cce5e16f"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-navigation-preload.prod.js",
    "revision": "71b459464250cd4997deede4cc13f5cc"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-precaching.dev.js",
    "revision": "567166969a683137db14508f116c205a"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-precaching.prod.js",
    "revision": "f2f0c2810fea85a46c0cb28ff78a9159"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-range-requests.dev.js",
    "revision": "8a8f4a1cd7d38748256282c4e7d57172"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-range-requests.prod.js",
    "revision": "0b2f458c203b920658c7a2d651682355"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-routing.dev.js",
    "revision": "81d794cb695830612f95b9124b79a293"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-routing.prod.js",
    "revision": "3a26532a0a1c4b5245575cce26ba87dc"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-strategies.dev.js",
    "revision": "6579284dddfffea4982c49ab86c759ce"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-strategies.prod.js",
    "revision": "ab888eaebd74c39206b73ace248c343e"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-streams.dev.js",
    "revision": "02254027b2737cef8a4b98071c2eb2f0"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-streams.prod.js",
    "revision": "02a6ea213a32d95e931003eb280a2dbf"
  },
  {
    "url": "third_party/workbox-v3.6.3/workbox-sw.js",
    "revision": "cde784bf7f3ea826506b80c778226e75"
  }
]);

//workbox.googleAnalytics.initialize();