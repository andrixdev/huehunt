/**
 * JS for Hue Hunt Results
 *
 * @author Alexandre Andrieux <alex@icosacid.com>
 * @since 03-2016
 */

var firebaseRounds,
    rounds,
    players = [],
    bestRounds,
    focus = {},
    filters = {},
    analysis = {},
    interaction = {};

focus.player = 'Lindrox';
focus.level = 1;
focus.minHue = 0;
focus.maxHue = 360;
focus.rounds = [];
focus.basePerf = '';
focus.learning = [];
focus.overallLearning = '';
focus.learningPace = '';

focus.roundsNumber = '';

// Input dataset model
firebaseRounds = {
  "KBxE015HXj3bV0jEenb" : {
    "performance" : "41",
    "roundLevel" : "1",
    "targetH" : "268",
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
  firebaseRounds = data.val();
  rounds = firebaseRounds;
  getData();
  buildUI();
  showUI();
});

filters.formatFirebaseDataset = function(firebaseRounds) {
  // Remove the unnecessary random object names and make an array of objects
  var rounds = [];
  for (var prop in firebaseRounds) {
    // Add round to array
    rounds.push(firebaseRounds[prop]);
  }
  return rounds;
};
filters.matchUsername = function(rounds, username) {
  var outputRounds = [];
  for (var i = 0; i < rounds.length; i++) {
    if (rounds[i].username == username) {
      outputRounds.push(rounds[i]);
    }
  }
  return outputRounds;
};
filters.matchLevel = function(rounds, level) {
  var outputRounds = [];
  for (var i = 0; i < rounds.length; i++) {
    if (rounds[i].roundLevel == level) {
      outputRounds.push(rounds[i]);
    }
  }
  return outputRounds;
};
filters.inHueRange = function(rounds, minHue, maxHue) {
  var outputRounds = [];
  for (var i = 0; i < rounds.length; i++) {
    // Get username
    if (isInHueRange(rounds[i].targetH, minHue, maxHue)) {
      outputRounds.push(rounds[i]);
    }
  }
  return outputRounds;
};
filters.getUsernames = function(rounds) {
  var outputUsernames = [];
  for (var i = 0; i < rounds.length; i++) {
    outputUsernames.push(rounds[i].username);
  }
  return outputUsernames;
};
filters.getUniqueUsernames = function(rounds) {
  var outputUsernames = [];
  for (var i = 0; i < rounds.length; i++) {
    var username = rounds[i].username;
    // Check if already in outputUsernames
    var alreadyInResult = false;
    for (var j = 0; j < outputUsernames.length; j++) {
      if (username == outputUsernames[j]) {
        alreadyInResult = true;
      }
    }
    // If so, don't add player to list, otherwise do
    if (!alreadyInResult) {
      outputUsernames.push(username);
    }
  }
  return outputUsernames;
};
filters.sortByPerformance = function(rounds) {
  var sortedRounds = _.sortBy(rounds, function(value) {
    // Sort them by ascending performance
    return parseInt(value.performance);
  });
  // Put the best performances first
  return sortedRounds.reverse();
};
filters.sortByDate = function(rounds) {
    var sortedRounds = _.sortBy(rounds, function(value) {
        // Sort them by ascending performance
        return (value.timestamp ? parseInt(value.timestamp) : false);
    });
    return sortedRounds;
};

analysis.getBasePerf = function(rounds) {
  var basePerf = 0;
  var significantPerfCount = Math.floor(1 + (focus.maxHue - focus.minHue) / 30);
  // Check if enough perf data
  if (rounds.length < significantPerfCount) {
    basePerf = '/';
  } else {
    // OK, let's get the first perfs and average them
    for (var i = 0; i < significantPerfCount; i++) {
      basePerf += parseFloat(rounds[i].performance);
    }
    basePerf /= significantPerfCount;
  }
  return basePerf;
};
analysis.getCurrentLearningAndOverallLearning = function(rounds, basePerf) {
  var learning = [],
      overallLearning = 0;
  var learningRoundScope = 3; // the last 3 rounds and the 3 before
  var roundsNumber = rounds.length;

  if (rounds.length < 2 * learningRoundScope) {
    learning = '/';
    overallLearning = '/';
  } else {
    // For each round on the way (starting from 6th round, when enough data)
    for (var r = 2 * learningRoundScope; r <= roundsNumber; r++) {
      var mostRecentAveragePerf = 0;

      // Get most recent average perf
      for (var i = 0; i < learningRoundScope; i++) {
        var roundPerf = rounds[r - 1 - i].performance;
        mostRecentAveragePerf += parseFloat(roundPerf);
      }
      mostRecentAveragePerf /= learningRoundScope;

      // Then get previous average perf
      var previousAveragePerf = 0;
      for (var i = 0; i < learningRoundScope; i++) {
        var roundPerf = rounds[r - 1 - learningRoundScope - i].performance;
        previousAveragePerf += parseFloat(roundPerf);
      }
      previousAveragePerf /= learningRoundScope;

      // Round current learning: do the diff, and make sure it's not negative (0 at worse)
      learning.push({
        'round': r,
        'learning': Math.max(0, mostRecentAveragePerf - previousAveragePerf)
      });

      // Update overall learning: diff with basePerf (in the loop because more convenient)
      overallLearning = Math.max(0, mostRecentAveragePerf - basePerf);
    }
  }
  return [learning, overallLearning];
};

interaction.updateFocusRounds = function(rounds) {
  focus.rounds = filters.sortByDate(filters.inHueRange(filters.matchLevel(filters.matchUsername(rounds, focus.player), focus.level), focus.minHue, focus.maxHue));
};

/* Base rendering functions */
function getData() {
  // Content 0 - Highscores
  var thisLevelRounds = _.filter(rounds, function(value) {
    // Remove scores that are not for this level
    return value.roundLevel == 1;
  });
  var sortedRounds = _.sortBy(thisLevelRounds, function(value) {
    // Sort them by ascending performance
    return parseInt(value.performance);
  });
  // Put the best performances on top
  sortedRounds = sortedRounds.reverse();
  // Pick the very bests
  bestRounds = sortedRounds.splice(0, 10);

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

  // Content 2-1 - Focus baseperf
  var significantPerfCount = Math.floor(1 + (focus.maxHue - focus.minHue) / 30);
  focus.basePerf = 0;
  var focusRounds = [];
  // Filter rounds by username
  for (var prop in rounds) {
    var round = rounds[prop];
    if ((isPlayer(round.username, focus.player) || false) && (round.roundLevel == focus.level || true) && (isInHueRange(round.targetH, focus.minHue, focus.maxHue) || false)) {
      focusRounds.push(rounds[prop]);
    }
  }
  // Check if enough perf data
  if (focusRounds.length < significantPerfCount) {
    focus.basePerf = '/';
  } else {
    // OK, let's get the first perfs and average them
    for (var i = 0; i < significantPerfCount; i++) {
      focus.basePerf += parseFloat(focusRounds[i].performance);
    }
    focus.basePerf /= significantPerfCount;
  }

  // Content 2-2 and 2-3 - Focus current learning and overall learning
  var learningRoundScope = 3; // the last 3 rounds and the 3 before
  var roundsNumber = focusRounds.length;

  if (focusRounds.length < 2 * learningRoundScope) {
    focus.learning = '/';
    focus.overallLearning = '/';
  } else {
    // For each round on the way (starting from 6th round, when enough data)
    for (var r = 2 * learningRoundScope; r <= roundsNumber; r++) {
      var mostRecentAveragePerf = 0;

      // Get most recent average perf
      for (var i = 0; i < learningRoundScope; i++) {
        var roundPerf = focusRounds[r - 1 - i].performance;
        mostRecentAveragePerf += parseFloat(roundPerf);
      }
      mostRecentAveragePerf /= learningRoundScope;

      // Then get previous average perf
      var previousAveragePerf = 0;
      for (var i = 0; i < learningRoundScope; i++) {
        var roundPerf = focusRounds[r - 1 - learningRoundScope - i].performance;
        previousAveragePerf += parseFloat(roundPerf);
      }
      previousAveragePerf /= learningRoundScope;

      // Round current learning: do the diff, and make sure it's not negative (0 at worse)
      focus.learning.push({
        'round': r,
        'learning': Math.max(0, mostRecentAveragePerf - previousAveragePerf)
      });

      // Update overall learning: diff with basePerf (in the loop because more convenient)
      focus.overallLearning = Math.max(0, mostRecentAveragePerf - focus.basePerf);

    }


  }
  // Content 2-4 - Focus rounds number (for learning pace)
  focus.roundsNumber = focusRounds.length;
  focus.learningPace = focus.overallLearning / focus.roundsNumber;


  // Content 3 - Players that reached level 4 (exclude cheaters)
  var reachedLevel4players = [];
  var reachedLevel4 = _.filter(rounds, function(value) {
    if (value.roundLevel == 4) {
      // Check if already in reachedLevel4players
      var alreadyInPlayers = false;
      for (var j = 0; j < reachedLevel4players.length; j++) {
        if (value.username == reachedLevel4players[j]) {
          alreadyInPlayers = true;
        }
      }
      // If so, don't add player to list, otherwise do
      if (!alreadyInPlayers) {
        reachedLevel4players.push(value.username);
      }
    }
    // Remove scores that are not for this level
    return value.roundLevel == 4;
  });

}
function buildUI() {
  // Content 1-1 - Players
  jQuery('.content-1 .tile-container:nth-of-type(1) .data-data p').html(players.length);
  // Content 1-2 - Rounds
  jQuery('.content-1 .tile-container:nth-of-type(2) .data-data p').html(Object.keys(rounds).length);

  // Content 2-1 - Focus baseperf
  jQuery('.content-2 .tile-container:nth-of-type(1) .data-data p').html(twoDecimalsOf(focus.basePerf));
  // Content 2-2 - Focus learning
  jQuery('.content-2 .tile-container:nth-of-type(2) .data-data p').html(twoDecimalsOf(focus.learning));
  // Content 2-3 - Focus overall learning
  jQuery('.content-2 .tile-container:nth-of-type(3) .data-data p').html(twoDecimalsOf(focus.overallLearning));
  // Content 2-4 - Focus learning pace
  jQuery('.content-2 .tile-container:nth-of-type(4) .data-data p').html(twoDecimalsOf(focus.learningPace));

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
function twoDecimalsOf(inputFloat) {
  return Math.floor(parseInt(100 * inputFloat)) / 100;
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
