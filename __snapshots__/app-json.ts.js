exports['AppJson updateContent updates the app versions 1'] = `
{
  "expo": {
    "owner": "some-owner",
    "name": "Some Name",
    "slug": "some-slug",
    "version": "3.2.1",
    "orientation": "portrait",
    "icon": "./assets/icon-inverse.png",
    "scheme": "someschema",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#FFFFFF"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "some-url-here"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "bundleIdentifier": "com.somedomain",
      "buildNumber": "3.2.1",
      "supportsTablet": true,
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.somedomain",
      "versionCode": 440030201,
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-inverse.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}

`
