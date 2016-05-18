/**
 * JS for Hue Hunt Results
 *
 * @author Alexandre Andrieux <alex@icosacid.com>
 * @since 03-2016
 */

/* Global data */
var firebaseRounds,
    rounds,
    players = [],
    bestRounds,
    reachedLevel2players = [],
    reachedLevel4players = [],
    focus = {},
    filters = {},
    analysis = {},
    interaction = {},
    UI = {};

/* Data specific to the current focus */
focus.player = '184';
focus.level = 4;
focus.minHue = 200;
focus.maxHue = 250;
focus.rounds = [];
focus.basePerf = '';
focus.learning = [];
focus.overallLearning = '';
focus.learningPace = '';

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

  if (roundsNumber < 2 * learningRoundScope || typeof(basePerf) == 'string') {
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

  // Some data formatting on learning:
  // chop down to 100 elements if bigger, fill my dummy data if smaller
/*
  var learningLength = learning.length;
  if (learningLength >= 100) {
    learning = learning.slice(0, 100);
  } else {
    var howManyToAdd = 100 - learningLength;
    for (var i = 0; i < howManyToAdd; i++) {
      learning.push('/zfzefzefzef');
    }
  }*/

  return [learning, overallLearning];
};

interaction.updateFocusRounds = function(rounds) {
  focus.rounds = filters.sortByDate(filters.inHueRange(filters.matchLevel(filters.matchUsername(rounds, focus.player), focus.level), focus.minHue, focus.maxHue));
};
interaction.updateFocusData = function() {
  // Focus baseperf
  focus.basePerf = analysis.getBasePerf(focus.rounds);

  // Focus current learning and overall learning
  var learnings = analysis.getCurrentLearningAndOverallLearning(focus.rounds, focus.basePerf);
  focus.learning = learnings[0];
  focus.overallLearning = learnings[1];

  // Focus learning pace
  focus.learningPace = focus.overallLearning / focus.rounds.length || '/';
};

UI.globalData = {};
UI.globalData.build = function() {
  // Players
  jQuery('.content-1 .tile-container:nth-of-type(1) .data-data p').html(players.length);
  // Rounds
  jQuery('.content-1 .tile-container:nth-of-type(2) .data-data p').html(rounds.length);
  // Players who reached level 2
  jQuery('.content-1 .tile-container:nth-of-type(3) .data-data p').html(reachedLevel2players.length);
  // Players who reached level 4
  jQuery('.content-1 .tile-container:nth-of-type(4) .data-data p').html(reachedLevel4players.length);
};
UI.focusData = {};
UI.focusData.build = function() {
  // Focus baseperf
  jQuery('.content-2 .tile-container:nth-of-type(1) .data-data p').html(twoDecimalsOf(focus.basePerf));
  // Focus learning
  jQuery('.content-2 .tile-container:nth-of-type(2) .data-data p').html(twoDecimalsOf(focus.learning[focus.learning.length - 1].learning));
  // Focus overall learning
  jQuery('.content-2 .tile-container:nth-of-type(3) .data-data p').html(twoDecimalsOf(focus.overallLearning));
  // Focus learning pace
  jQuery('.content-2 .tile-container:nth-of-type(4) .data-data p').html(twoDecimalsOf(focus.learningPace));
};
UI.steamgraph = {};
UI.steamgraph.build = function() {
  // Generate select tags' names
  _.each(reachedLevel2players, function(element) {
    var playerSelect = "<div data-value='" + element + "'>" + element + "</div>";
    jQuery('.content-3 .controls-area[data-area-type=players] .tiles').append(playerSelect);
  });

  // Draw steam graph
  UI.steamgraph.graph();
};
UI.steamgraph.selected = {
  players: [],
  hueRanges: [],
  levels: [],
  update: function(whichArrayKey, dataValue, isActive) {
    var whichArray = this[whichArrayKey];
    var isValueInArray = (_.indexOf(whichArray, dataValue) != -1);
    if (isActive && !isValueInArray) {
      whichArray.push(dataValue);
    }
    if (!isActive && isValueInArray) {
      this[whichArrayKey] = _.without(whichArray, dataValue);
    }
  }
};
UI.steamgraph.listen = function() {
  // Default behavior
  jQuery('.huehunt-results .content-3').on('click', '.controls-area .tiles > div', function() {
    // Get data value stored in DOM attribute
    var dataValue = jQuery(this).attr('data-value') || 'error';
    // Figure out which array it's about, i.e. which controls area
    var whichControlsAreaKey = jQuery(this).parents('.controls-area').attr('data-area-type');
    // Toggle .active class and update model
    if (jQuery(this).hasClass('active')) {
      jQuery(this).removeClass('active');
      UI.steamgraph.selected.update(whichControlsAreaKey, dataValue, false);
    } else {
      jQuery(this).addClass('active');
      UI.steamgraph.selected.update(whichControlsAreaKey, dataValue, true);
    }
  });

  // Specific select for all players
  var playersTilesSel = '.controls-area[data-area-type=players] .tiles > div';
  jQuery('.huehunt-results .content-3').on('click', playersTilesSel + '[data-value=players-all]', function() {
    // Warning!!! .Active class has already been toggled in first listener
    if (jQuery(this).hasClass('active')) {
      jQuery(this).html('Deselect all');
      // Activate all other elements
      jQuery(playersTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        if (tileDataValue != 'players-all') {
          // View
          jQuery(this).addClass('active');
          // Models
          UI.steamgraph.selected.update('players', tileDataValue, true);
        }
      });
    } else {
      jQuery(this).html('All players');
      // Deactivate all other elements
      jQuery(playersTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        if (tileDataValue != 'players-all') {
          // View
          jQuery(this).removeClass('active');
          // Model
          UI.steamgraph.selected.update('players', tileDataValue, false);
        }
      });
    }
  });

  // Specific select for all hues
  var hueTilesSel = '.controls-area[data-area-type=hueRanges] .tiles > div';
  jQuery('.huehunt-results .content-3').on('click', hueTilesSel + '[data-value=hue-all]', function() {
    // Warning!!! .Active class has already been toggled in first listener
    if (jQuery(this).hasClass('active')) {
      jQuery(this).html('Deselect all');
      // Activate all other elements
      jQuery(hueTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        if (tileDataValue != 'hue-all' && tileDataValue != 'hue-20-layers') {
          // View
          jQuery(this).addClass('active');
          // Models
          UI.steamgraph.selected.update('hueRanges', tileDataValue, true);
        }
      });
    } else {
      jQuery(this).html('All players');
      // Deactivate all other elements
      jQuery(playersTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        if (tileDataValue != 'hue-all' && tileDataValue != 'hue-20-layers') {
          // View
          jQuery(this).removeClass('active');
          // Model
          UI.steamgraph.selected.update('hueRanges', tileDataValue, false);
        }
      });
    }
  });
};
UI.steamgraph.graph = function() {
  var n = 1; // number of layers / PLAYERS
  var m = 100; // number of samples per layer
  var stack = d3.layout.stack().offset("wiggle");
  var layers0 = stack(['184', 'maelys'].map(function(playerName, index) { return playerLearning(playerName); }));

  // The graph container (.container-3 is hidden at first so there's no way to get its width)
  // We have to use what's already plotted
  var width = jQuery('.huehunt-results .content-1').width(),
      height = jQuery('.huehunt-results .content-1').height() * 0.75;

  var x = d3.scale.linear()
      .domain([0, m - 1])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, d3.max(layers0.concat(layers0), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height, 0]);

  var color = d3.scale.linear()
      .range(["#aad", "#556"]);

  var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });

  var svg = d3.select(".huehunt-results .content-3 .steam-content").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.selectAll("path")
      .data(layers0)
      .enter().append("path")
      .attr("d", area)
      .style("fill", function() { return color(Math.random()); });

  function transition() {
    d3.selectAll("path")
        .data(function() {
          var d = layers1;
          layers1 = layers0;
          return layers0 = d;
        })
        .transition()
        .duration(2500)
        .attr("d", area);
  }

  function playerLearning(playerName) {

    console.log(playerName);
    var playerRounds = filters.matchUsername(rounds, playerName);

    var basePerf = analysis.getBasePerf(playerRounds);
    var learnings = analysis.getCurrentLearningAndOverallLearning(playerRounds, basePerf);
    var learning = learnings[0];

    // Players have different numbers of rounds played, we must fill the data gap
    // The learning.round attribute turns out to be neglected :o
    var steamGraphCoordinates = d3.range(100).map(function(d, i) {
      return {
        x: i,
        y: (function() {return (learning[i] ? learning[i].learning : 0);})()
      };
    });

    return steamGraphCoordinates;
  }

};
UI.steamgraph.graph2 = function() {
  var n = 20, // number of layers
      m = 200, // number of samples per layer
      stack = d3.layout.stack().offset("wiggle"),
      layers0 = stack(d3.range(n).map(function() { return bumpLayer(m); })),
      layers1 = stack(d3.range(n).map(function() { return bumpLayer(m); }));

  var width = 960,
      height = 500;

  var x = d3.scale.linear()
      .domain([0, m - 1])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height, 0]);

  var color = d3.scale.linear()
      .range(["#aad", "#556"]);

  var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });

  var svg = d3.select(".huehunt-results .content-3 .steam-content").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.selectAll("path")
      .data(layers0)
      .enter().append("path")
      .attr("d", area)
      .style("fill", function() { return color(Math.random()); });

  function transition() {
    d3.selectAll("path")
        .data(function() {
          var d = layers1;
          layers1 = layers0;
          return layers0 = d;
        })
        .transition()
        .duration(2500)
        .attr("d", area);
  }

  // Inspired by Lee Byron's test data generator.
  function bumpLayer(n) {

    function bump(a) {
      var x = 1 / (.1 + Math.random()),
          y = 2 * Math.random() - .5,
          z = 10 / (.1 + Math.random());
      for (var i = 0; i < n; i++) {
        var w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
      }
    }

    var a = [], i;
    for (i = 0; i < n; ++i) a[i] = 0;
    for (i = 0; i < 5; ++i) bump(a);
    return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
  }

};

/* Base rendering functions */
function processData() {
  /** Global data **/
  // Highscores
  bestRounds = filters.sortByPerformance(rounds).splice(0, 10);

  // Players
  players = filters.getUniqueUsernames(rounds);

  // Players that reached level 2
  reachedLevel2players = filters.getUniqueUsernames(filters.matchLevel(rounds, 2));

  // Players that reached level 4
  reachedLevel4players = filters.getUniqueUsernames(filters.matchLevel(rounds, 4));

  /** Initial focus data **/
  interaction.updateFocusRounds(rounds);
  interaction.updateFocusData();

}
function showUI() {
  jQuery('.huehunt-results').removeClass('loading');
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
function twoDecimalsOf(value) {
  return (typeof(value) == 'string' ? value : Math.floor(parseInt(100 * value)) / 100);
}

// DOM listeners
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

  // Dummy input dataset model
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

  // Get the data!
  var myFirebaseRef = new Firebase("https://blistering-torch-4182.firebaseio.com/rounds");
  myFirebaseRef.on("value", function(data) {
    firebaseRounds = data.val();
    // Cleanup data format (from dirty JSON to array of objects)
    rounds = filters.formatFirebaseDataset(firebaseRounds);
    processData();
    showUI();
    UI.globalData.build();
    UI.focusData.build();
    UI.steamgraph.build();
  });

  // Streamgraph selection tiles
  UI.steamgraph.listen();
});
