'use strict';

/**
 * string functions
 */
var trim = function (str) {
  return str.replace(/(^\s+|\s+$)/);
},

ltrim = function (str) {
  return str.replace(/(^\s+)/);
},

rtrim = function (str) {
  return str.replace(/(\s+$)/);
};
