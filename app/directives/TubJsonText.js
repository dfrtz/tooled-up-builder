/**
 * @file A Tooled Up - Builder app directive for displaying JSON formatted text in an element.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').directive('tubJsonText', function() {
    return {
          restrict: 'A',
          require: 'ngModel',
          link: function(scope, element, attr, ngModel) {
            function into(input) {
              return JSON.parse(input);
            }
            function out(data) {
              return JSON.stringify(data, undefined, 2);
            }
            ngModel.$parsers.push(into);
            ngModel.$formatters.push(out);
          }
      };
});
