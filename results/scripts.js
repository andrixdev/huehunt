/**
 * JS for Hue Hunt Results
 *
 * @author Alexandre Andrieux <alex@icosacid.com>
 * @since 03-2016
 */

var rounds;
var players = [];
var acidLevel1basePerf;
var acidLevel1learning;
var acidLevel1finalLearning;
var acidLevel1roundsNumber;
var acidLevel1learningPace;

rounds = {
  "KBxE015HXj3bV0jEenb" : {
    "performance" : "41",
    "roundLevel" : "1",
    "targetH" : "268",
    "targetL" : "50",
    "targetS" : "100",
    "username" : "Lindrox"
  },
  "KBxEDPJXxshVCk0Sl1t" : {
    "performance" : "62",
    "roundLevel" : "1",
    "targetH" : "26",
    "targetL" : "50",
    "targetS" : "100",
    "username" : "Lindrox"
  },
  "KCu4Ucc0bW5kjMf3mY1" : {
    "performance" : "59",
    "roundLevel" : "1",
    "targetH" : "318",
    "targetL" : "50",
    "targetS" : "100",
    "username" : "Icosacid"
  }
};

var myFirebaseRef = new Firebase("https://blistering-torch-4182.firebaseio.com/rounds");

myFirebaseRef.on("value", function(data) {
  rounds = data.val();
  getData();
  buildUI();
  showUI();
});

/* Base rendering functions */
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

  // Content 1-1 - Players
  for (var prop in rounds) {
    // Get username
    var username = rounds[prop].username;
    // Check if already in players
    var alreadyInPlayers = false;
    for (var j = 0; j < players.length; j++) {
      if (username == players[j]) {
        alreadyInPlayers = true;
      }
    }
    // If so, don't add player to list, otherwise do
    if (!alreadyInPlayers) {
      players.push(username);
    }
  }

  // Content 2-1 - Acid baseperf
  var minHue = 0, maxHue = 30;
  var significantPerfCount = Math.floor(1 + (maxHue - minHue) / 30);
  acidLevel1basePerf = 0;
  var acidLevel1Rounds = [];
  // Filter Acid rounds
  for (var prop in rounds) {
    var round = rounds[prop];
    if ((isPlayer(round.username, 'Lindrox') || false) && (round.roundLevel == 1 || true) && (isInHueRange(round.targetH, 0, 120)|| true)) {
      acidLevel1Rounds.push(rounds[prop]);
    }
  }
  console.log(acidLevel1Rounds);
  // Check if enough perf data
  if (acidLevel1Rounds.length < significantPerfCount) {
    acidLevel1basePerf = '/';
  } else {
    // OK, let's get the first perfs and average them
    for (var i = 0; i < significantPerfCount; i++) {
      acidLevel1basePerf += parseFloat(acidLevel1Rounds[i].performance);
    }
    acidLevel1basePerf /= significantPerfCount;
  }

  // Content 2-2 and 2-3 - Acid current learning and final learning
  var learningRoundScope = 3; // the last 3 rounds and the 3 before
  if (acidLevel1Rounds.length < 2 * learningRoundScope) {
    acidLevel1learning = '/';
    acidLevel1finalLearning = '/';
  } else {
    // Get most recent average perf
    var mostRecentAveragePerf = 0;
    var roundsNumber = acidLevel1Rounds.length;
    for (var i = 0; i < learningRoundScope; i++) {
      var roundPerf = acidLevel1Rounds[roundsNumber - 1 - i].performance;
      mostRecentAveragePerf += parseFloat(roundPerf);
    }
    mostRecentAveragePerf /= learningRoundScope;
    // Get previous average perf
    var previousAveragePerf = 0;
    for (var i = 0; i < learningRoundScope; i++) {
      var roundPerf = acidLevel1Rounds[roundsNumber - 1 - learningRoundScope - i].performance;
      previousAveragePerf += parseFloat(roundPerf);
    }
    previousAveragePerf /= learningRoundScope;
    // Current learning: do the diff, and make sure it's not negative (0 at worse)
    acidLevel1learning = Math.max(0, mostRecentAveragePerf - previousAveragePerf);
    // Final learning: diff with basePerf
    acidLevel1finalLearning = Math.max(0, mostRecentAveragePerf - acidLevel1basePerf);
  }
  // Content 2-4 - Acid rounds number (for learning pace)
  acidLevel1roundsNumber = acidLevel1Rounds.length;
  acidLevel1learningPace = acidLevel1finalLearning / acidLevel1roundsNumber;
}
function buildUI() {
  // Content 1-1 - Players
  jQuery('.content-1 .tile-container:nth-of-type(1) .data-data p').html(players.length);
  // Content 1-2 - Rounds
  jQuery('.content-1 .tile-container:nth-of-type(2) .data-data p').html(Object.keys(rounds).length);

  // Content 2-1 - Acid baseperf
  jQuery('.content-2 .tile-container:nth-of-type(1) .data-data p').html(0.01 * Math.floor(100*acidLevel1basePerf));
  // Content 2-2 - Acid learning
  jQuery('.content-2 .tile-container:nth-of-type(2) .data-data p').html(0.01 * Math.floor(100*acidLevel1learning));
  // Content 2-3 - Acid final learning
  jQuery('.content-2 .tile-container:nth-of-type(3) .data-data p').html(0.01 * Math.floor(100*acidLevel1finalLearning));
  // Content 2-4 - Acid learning pace
  jQuery('.content-2 .tile-container:nth-of-type(4) .data-data p').html(0.01 * Math.floor(100*acidLevel1learningPace));

}
function showUI() {
  // Undo loading icon
  jQuery('.huehunt-results .loading-icon').css('display', 'none');
  // Display UI
  jQuery('.huehunt-results .side-menu').show();
  jQuery('.huehunt-results .content').show();
  // Show first tab content
  jQuery('.huehunt-results .content .content-1').show();
  jQuery('.huehunt-results .side-menu p.tab:nth-of-type(1)').addClass('selected');
}

/* Data processing functions */
function isInHueRange(inputHue, minHue, maxHue) {
  // Only accept positive velues between 0 and 360
  if (minHue < maxHue) {
    if (inputHue >= minHue && inputHue <= maxHue) {
      return true;
    } else return false;
  } else {
    if (inputHue >= minHue || inputHue <= maxHue) {
      return true;
    } else return false;
  }
}
function isPlayer(inputPlayerName, playerNameToMatch) {
  if (inputPlayerName == playerNameToMatch) {
    return true;
  } else return false;
}

jQuery(document).ready(function() {
  // Menu tabs
  jQuery('.huehunt-results').on('click', '.side-menu p.tab', function() {
    var tabNumber = 1 + jQuery(this).index('.side-menu p.tab');
    // Show according content
    jQuery('.huehunt-results .content > div').hide();
    jQuery('.huehunt-results .content .content-' + tabNumber).show();
    // Highlight clicked tab
    jQuery('.huehunt-results .side-menu p.tab').removeClass('selected');
    jQuery(this).addClass('selected');
  });
});
