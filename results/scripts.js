/**
 * JS for Hue Hunt Results
 *
 * @author Alexandre Andrieux <alex@icosacid.com>
 * @since 03-2016
 */

var myFirebaseRef = new Firebase("https://blistering-torch-4182.firebaseio.com/rounds");
var rounds;

myFirebaseRef.on("value", function(data) {
  rounds = data.val();
  getData();
  buildUI();
  showUI();
});

function getData() {
  // Remove scores that are not for this level
  var thisLevelRounds = _.filter(rounds, function(value) {
    return value.roundLevel == 1;
  });

  // Sort them by ascending performance
  var sortedRounds = _.sortBy(thisLevelRounds, function(value) {
    return parseInt(value.performance);
  });
  // Put the best performances on top
  sortedRounds = sortedRounds.reverse();

  // Pick the very bests
  var bestRounds = sortedRounds.splice(0, 10);
  console.log(bestRounds);
}

function buildUI() {

}
function showUI() {
  // Undo loading icon

  // Display UI

}

jQuery(document).ready(function() {
  // Menu tabs
  jQuery('.huehunt-results').on('click', '.side-menu p.tab', function() {
    var tabNumber = 1 + jQuery(this).index('.side-menu p.tab');
    // Show according content
    jQuery('.huehunt-results .content').hide();
    jQuery('.huehunt-results .content.content-' + tabNumber).show();
    // Highlight clicked tab
    jQuery('.huehunt-results .side-menu p.tab').removeClass('selected');
    jQuery(this).addClass('selected');
  });
});
