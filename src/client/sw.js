const workboxFolder = '/third_party/workbox-v3.6.3/';

importScripts(workboxFolder + 'workbox-sw.js');

workbox.setConfig(
  {modulePathPrefix: workboxFolder}
);

workbox.precaching.precacheAndRoute([]);

//workbox.googleAnalytics.initialize();