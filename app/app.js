/**
 * HueHunt, a game for hawk-eyed designers
 * by Alexandre Andrieux @October2105
 */

window.app = angular.module('huehunt', ['ngRoute', 'ngCookies', 'firebase']);

// Allows full replacement of DOM elements with ngInclude
window.app.directive('includeReplace', function() {
    return {
        require: 'ngInclude',
        link: function (scope, el, attrs) {
            el.replaceWith(el.children());
        }
    };
});
