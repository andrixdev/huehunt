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
    usernamesSortedByRoundsPlayed = [],
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
filters.matchLevel = function(rounds, level, excludeThisLevel) {
  // excludeThisLevel is true if we want to reject rounds of this level
  excludeThisLevel = excludeThisLevel || false;
  // Do nothing if we want all
  if (level == 'all') return rounds;

  var outputRounds = [];
  for (var i = 0; i < rounds.length; i++) {
    var condition = (rounds[i].roundLevel == level);
    condition = (excludeThisLevel ? !condition : condition);
    if (condition) {
      outputRounds.push(rounds[i]);
    }
  }
  return outputRounds;
};
filters.inHueRange = function(rounds, minHue, maxHue) {
  var outputRounds = [];
  for (var i = 0; i < rounds.length; i++) {
    // Get username
    console.log(rounds[i].targetH, minHue, maxHue, isInHueRange(rounds[i].targetH, minHue, maxHue));
    if (isInHueRange(parseInt(rounds[i].targetH), parseInt(minHue), parseInt(maxHue))) {
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
filters.getUniqueUsernamesSortedByRoundsPlayed = function(rounds) {
  var outputUsernamesWithRoundsPlayed = [];
  for (var i = 0; i < rounds.length; i++) {
    var username = rounds[i].username;
    // If already in outputUsernames... increase counter
    var alreadyInResult = false;
    for (var j = 0; j < outputUsernamesWithRoundsPlayed.length; j++) {
      if (username == outputUsernamesWithRoundsPlayed[j].username) {
        alreadyInResult = true;
        outputUsernamesWithRoundsPlayed[j].rounds++;
      }
    }
    // If so, don't add player to list, otherwise do
    if (!alreadyInResult) {
      outputUsernamesWithRoundsPlayed.push({'username': username, 'rounds': 1});
    }
  }
  return _.sortBy(outputUsernamesWithRoundsPlayed, function(value) {
    return -value.rounds;
  });
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
  console.log('roundsNumber', roundsNumber);

  if (roundsNumber < 2 * learningRoundScope || typeof(basePerf) == 'string') {
    // Not enough data. We choose to render it as it zero.
    learning = 0;
    overallLearning = 0;
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
  this.processData();
  this.updateView();
};
UI.globalData.processData = function() {
  // Highscores
  bestRounds = filters.sortByPerformance(rounds).splice(0, 10);

  // Players
  players = filters.getUniqueUsernames(rounds);

  // Players that reached level 2
  reachedLevel2players = filters.getUniqueUsernames(filters.matchLevel(rounds, 2));

  // Players that reached level 4
  reachedLevel4players = filters.getUniqueUsernames(filters.matchLevel(rounds, 4));

  // Players sorted by number oo rounds played, without level 1
  usernamesSortedByRoundsPlayed = filters.getUniqueUsernamesSortedByRoundsPlayed(filters.matchLevel(rounds, 1, true));
};
UI.globalData.updateView = function() {
  // Players
  jQuery('.content-1 .tile-container:nth-of-type(1) .data-data p span.inner').html(players.length);
  // Rounds
  jQuery('.content-1 .tile-container:nth-of-type(2) .data-data p span.inner').html(rounds.length);
  // Players who reached level 2
  jQuery('.content-1 .tile-container:nth-of-type(3) .data-data p span.inner').html(reachedLevel2players.length);
  // Players who reached level 4
  jQuery('.content-1 .tile-container:nth-of-type(4) .data-data p span.inner').html(reachedLevel4players.length);
};

UI.focusData = {};
UI.focusData.build = function() {
  this.processData();
  this.updateView();
};
UI.focusData.processData = function() {
  interaction.updateFocusRounds(rounds);
  interaction.updateFocusData();
};
UI.focusData.updateView = function() {
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
UI.steamgraph.selected = {
  // Has initial state for first load
  players: ['Chloé', 'jouj', 'thnon', 'Konstantina'],
  hueRanges: ['hue-0-30', 'hue-30-70', 'hue-70-130', 'hue-130-190', 'hue-190-260', 'hue-260-310', 'hue-310-360'],
  levels: ['level-all'],
  update: function(whichArrayKey, dataValue, isActive) {
    var whichArray = this[whichArrayKey];
    var isValueInArray = (_.indexOf(whichArray, dataValue) != -1);
    if (isActive && !isValueInArray) {
      whichArray.push(dataValue);
    }
    if (!isActive && isValueInArray) {
      this[whichArrayKey] = _.without(whichArray, dataValue);
    }
    //console.log(this.players, this.hueRanges, this.levels);
  }
};
UI.steamgraph.build = function() {
  // Draw steam graph
  UI.steamgraph.shape();
  UI.steamgraph.update(true);
  UI.steamgraph.listen();
};
UI.steamgraph.shape = function() {
  // Initial call to build permanent elements

  // Generate select tags' names
  _.each(usernamesSortedByRoundsPlayed, function(element) {
    var playerSelect = "<div data-value='" + element.username + "'>" + element.username + "</div>";
    jQuery('.content-3 .controls-area[data-area-type=players] .tiles').append(playerSelect);
  });
  // Add .active classes to preselected players
  var jPlayers = jQuery('.content-3 .controls-area[data-area-type=players] .tiles');
  jPlayers.find('div[data-value=Chloé]').addClass('active');
  jPlayers.find('div[data-value=thnon]').addClass('active');
  jPlayers.find('div[data-value=Konstantina]').addClass('active');
  jPlayers.find('div[data-value=jouj]').addClass('active');

};
UI.steamgraph.listen = function() {
  // Controller for Streamgraph selection tiles

  // Default behavior
  jQuery('.huehunt-results .content-3').on('click', '.controls-area .tiles > div', function() {
    // Get data value stored in DOM attribute
    var dataValue = jQuery(this).attr('data-value') || 'error';
    if (dataValue == 'players-all' || dataValue == 'hue-layers-10' || dataValue.indexOf('level') != '-1') return;// Specific handlers
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

    UI.steamgraph.update(false);
  });

  // Specific select for all players
  var playersTilesSel = '.controls-area[data-area-type=players] .tiles > div';
  jQuery('.huehunt-results .content-3').on('click', playersTilesSel + '[data-value=players-all]', function() {

    if (!jQuery(this).hasClass('active')) {
      jQuery(this).html('Deselect all');
      jQuery(this).addClass('active');
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
      jQuery(this).removeClass('active');
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

    UI.steamgraph.update(false);
  });

  // Specific select for all hues by layers
  var hueTilesSel = '.controls-area[data-area-type=hueRanges] .tiles > div';
  jQuery('.huehunt-results .content-3').on('click', hueTilesSel + '[data-value=hue-layers-10]', function() {

    if (!jQuery(this).hasClass('active')) {
      jQuery(this).addClass('active');
      // Dectivate all other elements
      jQuery(hueTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        if (tileDataValue != 'hue-layers-10') {
          // View
          jQuery(this).removeClass('active');
          // Models
          UI.steamgraph.selected.update('hueRanges', tileDataValue, false);
        }
      });
      // Create and activate layer elements
      for (var hue = 0; hue <= 350; hue -= (-10)) {
        UI.steamgraph.selected.update('hueRanges', 'hue-' + hue + '-' + (hue - (-10)), true);
      }
    } else {
      jQuery(this).removeClass('active');
      // Deactivate created layer elements
      for (var hue = 0; hue <= 350; hue -= (-10)) {
        UI.steamgraph.selected.update('hueRanges', 'hue-' + hue + '-' + (hue - (-10)), false);
      }
    }

    UI.steamgraph.update(false);
  });

  // Specific selects for levels
  var levelsTilesSel = '.controls-area[data-area-type=levels] .tiles > div';
  jQuery('.huehunt-results .content-3').on('click', levelsTilesSel, function() {

    var myDataValue = jQuery(this).attr('data-value');
    if (!jQuery(this).hasClass('active')) {
      // Dectivate all elements
      jQuery(levelsTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        // View
        jQuery(this).removeClass('active');
        // Models
        UI.steamgraph.selected.update('levels', tileDataValue, false);
      });
      // Activate just me
      jQuery(this).addClass('active');
      UI.steamgraph.selected.update('levels', myDataValue, true);
    } else {
      // Just deactivate me
      jQuery(this).removeClass('active');
      UI.steamgraph.selected.update('levels', myDataValue, false);
    }

    UI.steamgraph.update(false);
  });

};
UI.steamgraph.update = function(isFirstTime) {
  // Arguments directly come from UI.steamgraph.selected
  var players = this.selected.players;
  var hueRanges = this.selected.hueRanges;
  var levels = this.selected.levels;

  var layersParams = this.formatLayersParams(players, hueRanges, levels);
  var stack = d3.layout.stack().offset("wiggle");// Adds the y0 coordinate to objects
  var layers0 = stack(layersParams.map(function(d, i) { return UI.steamgraph.getSteamgraphLayers(d); }));

  // The graph container (.container-3 is hidden at first so there's no way to get its width)
  // We have to use what's already plotted
  var width = jQuery('.huehunt-results').width() * 0.8,
      height = jQuery('.huehunt-results').height() * 0.75;

  var x = d3.scale.linear()
      .domain([0, d3.max(layers0.concat(layers0), function(layer) { return d3.max(layer, function(d) {
        // Detects maximal x with non-null learning and adjusts domain max width
        return (d.y == 0 ? 0 : d.x);
      }); })])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, d3.max(layers0.concat(layers0), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height, 0]);

  var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });


  var svg = d3.select(".huehunt-results .content-3 .steam-content svg");

  if (isFirstTime) {
    svg.attr("width", width).attr("height", height);
  }

  // Transition
  var paths = svg.selectAll("path")
    // layers is bound to a playername, otherwise exit() just removes the last added path rather than the
  // one corresponding to the deselected player. Same for color, and level so we concatenate into a unique ID
    .data(layers0, function(d) { return d[0].player + '_' + d[0].color + '_' + d[0].level; });

  paths.transition()
      .duration(2000)
      .attr("d", area);

  paths.exit().style("fill", function(d) { return 'hsl(' + d[0].color + ', 60%, 50%)'; }).remove();

  setTimeout(function() {
    paths.enter().append("path")
      .attr("d", area)
      .style("fill", function(d) { return 'hsl(' + d[0].color + ', 60%, 50%)'; });
  }, 2000);

};
UI.steamgraph.formatLayersParams = function(players, hueRanges, levels) {

  var layersParams = [];
  var self = this;
  _.each(players, function(player) {
    _.each(hueRanges, function(hueDOMkey) {
      _.each(levels, function(levelDOMkey) {
        var hueLimits = self.parseDOMkey('hue', hueDOMkey);
        var level = self.parseDOMkey('level', levelDOMkey);
        layersParams.push({
          'player': player,
          'minHue': hueLimits[0],
          'maxHue': hueLimits[1],
          'level': level
        });
      });
    });
  });

  // return pure layer objects, format:
  // {'player': 'lorem', 'minHue': 0, 'maxHue': 60, 'level': 1}
  return layersParams;
};
UI.steamgraph.parseDOMkey = function(keyType, DOMkey) {
  // keyType is either 'player', 'hue' or 'level'
  // DOMkey is like: 'El Loco', 'hue-0-30', 'level-1'...
  if (keyType == 'hue') {
    // split based on '-' separator
    var split = DOMkey.split('-');
    var minHue = split[1],
        maxHue = split[2];
    return [minHue, maxHue];
  } else if (keyType == 'player') {

  } else if (keyType == 'level') {
    // split based on '-' separator
    var split = DOMkey.split('-');
    var lvl = split[1];
    return lvl;
  }
};
UI.steamgraph.getSteamgraphLayers = function(d) {

  var focusRounds = filters.matchLevel(filters.inHueRange(filters.matchUsername(rounds, d.player), d.minHue, d.maxHue), d.level);

  var basePerf = analysis.getBasePerf(focusRounds);
  console.log('focusRounds length for '+d.minHue+ d.maxHue+ d.level+ d.player, focusRounds.length);
  console.log(focusRounds);
  var learnings = analysis.getCurrentLearningAndOverallLearning(focusRounds, basePerf);
  var learning = learnings[0];

  console.log(basePerf, learning);
  // Players have different numbers of rounds played, we must fill the data gap
  // The learning.round attribute turns out to be neglected :o
  var steamGraphCoordinates = d3.range(100).map(function(datah, i) {
    return {
      x: i,
      y: (function() {return (learning[i] ? learning[i].learning : 0);})(),
      color: (parseInt(d.maxHue) + parseInt(d.minHue)) / 2,
      player: d.player,
      level: d.level
    };
  });

  return steamGraphCoordinates;
};

UI.showYourself = function() {
  jQuery('.huehunt-results').removeClass('loading');
  // Show first tab content
  jQuery('.huehunt-results .content .content-1').show();
  jQuery('.huehunt-results .side-menu p.tab:nth-of-type(1)').addClass('selected');
};

/* Data processing functions */
function isInHueRange(inputHue, minHue, maxHue) {
  // Only accept positive values between 0 and 360
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

    UI.globalData.build();
    UI.focusData.build();
    UI.showYourself();
    UI.steamgraph.build();

  });

});
