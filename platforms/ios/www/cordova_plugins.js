cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.telerik.plugins.wkwebview/www/wkwebview.js",
        "id": "com.telerik.plugins.wkwebview.wkwebview",
        "clobbers": [
            "wkwebview"
        ]
    },
    {
        "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
        "id": "cordova-plugin-statusbar.statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.0.0",
    "com.telerik.plugins.wkwebview": "0.6.1",
    "cordova-plugin-statusbar": "1.0.1",
    "cordova-plugin-webserver": "1.0.3"
}
// BOTTOM OF METADATA
});