angular.module("plainish-text-demo", ["plainish-text"])
.filter('escapeHtml', function() {
    return function(text) {
        if (text) {
            return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
        }
        return '';
    };
})
.controller('demoCtrl', function($scope) {
    $scope.d = {
        demoText: "<p>Edit this text...</p>"
    };

    $scope.$watch("d.demoText", function(val) {        
        $scope.storedHtml = val;
        $scope.renderedHtml = $("[plainish-text]").html() || val;
    });
});