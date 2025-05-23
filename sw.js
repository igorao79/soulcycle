/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-54d0af47'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "assets/chunks/vendor-react-legacy.M6U8ifbV.js",
    "revision": null
  }, {
    "url": "assets/chunks/vendor-react.C9K60yqu.js",
    "revision": null
  }, {
    "url": "assets/entry/index-legacy.Dilys1UZ.js",
    "revision": null
  }, {
    "url": "assets/entry/index.DiKWQqRk.js",
    "revision": null
  }, {
    "url": "assets/entry/polyfills-legacy.Dayvzo0m.js",
    "revision": null
  }, {
    "url": "env.js",
    "revision": "3fa56c5afad29feecd464ab64b63764b"
  }, {
    "url": "index.html",
    "revision": "bae5cb7cd46f96ec76e4ac64794c6deb"
  }, {
    "url": "registerSW.js",
    "revision": "107d25ba177cf74ed19e96db1c3d25a5"
  }, {
    "url": "pwa-192x192.png",
    "revision": "7215ee9c7d9dc229d2921a40e899ec5f"
  }, {
    "url": "pwa-512x512.png",
    "revision": "7215ee9c7d9dc229d2921a40e899ec5f"
  }, {
    "url": "manifest.webmanifest",
    "revision": "b37b82b8fde900cd3fd27bbb906af954"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
