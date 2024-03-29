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
    filters = {},
    analysis = {},
    UI = {};

filters.formatFirebaseDataset = function(firebaseRounds) {
  // Remove the unnecessary random object names and make an array of objects
  var rawRounds = [];
  for (var prop in firebaseRounds) {
    // Add round to array
    rawRounds.push(firebaseRounds[prop]);
  }
  return rawRounds;
};
filters.enrichRoundsDataset = function(rawRounds) {
  // How many rounds has the user already played when playing this round?
  var rounds = [];
  var players = filters.getUniqueUsernames(rawRounds);
  _(players).each(function(p) {
    // Sort by date (just in case but useless atm) and THEN sort by level for a clean stacking up
    var focusRounds = filters.sortByLevel(filters.sortByDate(filters.matchUsername(rawRounds, p)));
    // Add some more information about round position
    var enrichedRounds = _(focusRounds).map(function(d, i) {
      d.nthRoundPlayed = i + 1;
      return d;
    });
    // Add them to the lot
    _(enrichedRounds).each(function(d) {
      rounds.push(d);
    });
  });

  return rounds;
};
filters.matchUsername = function(rounds, username, excludeThisPlayer) {
  // excludeThisPlayer is true if we want to reject rounds of this player
  excludeThisPlayer = excludeThisPlayer || false;
  var outputRounds = [];
  for (var i = 0; i < rounds.length; i++) {
    var condition = (rounds[i].username == username);
    condition = (excludeThisPlayer ? !condition : condition);
    if (condition) {
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
  return (_.sortBy(rounds, function(value) {
    // Sort them by ascending performance
    return parseInt(value.performance);
  })).reverse();
};
filters.sortByDate = function(rounds) {
    var sortedRounds = _.sortBy(rounds, function(value) {
        // Sort them by ascending timestamp
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
filters.sortByLevel = function(rounds) {
  return _.sortBy(rounds, function(value) {
    // Sort them by ascending level
    return parseInt(value.roundLevel);
  });
};

analysis.getRoundsLearning = function(rounds) {
  var learning = [];
  var learningRoundScope = 3; // the last 3 rounds and the 3 before
  var roundsNumber = rounds.length;

  if (roundsNumber < 2 * learningRoundScope) {
    // Not enough data. We choose to render it as it zero.
    learning = 0;
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
      for (var j = 0; j < learningRoundScope; j++) {
        var roundPerf = rounds[r - 1 - learningRoundScope - j].performance;
        previousAveragePerf += parseFloat(roundPerf);
      }
      previousAveragePerf /= learningRoundScope;

      // Round current learning: do the diff, and make sure it's not negative (0 at worse)
      learning.push({
        'nthRoundPlayed': rounds[r-1].nthRoundPlayed,
        'learning': Math.max(0, mostRecentAveragePerf - previousAveragePerf)
      });
    }
  }

  return learning;
};
analysis.getOverallHueLearningCurve = function(rounds, subsetHueRange) {
  // OHLC (Overall Hue Learning Curve) is an array of objects containing a hue, a learning value, and the number of contributions to the average learning
  // The learning corresponds to the average learning for all players, within a hue subset centered in 'centralHue' and of a 'subsetHueRange' range
  // The OHLC array has 360 elements, and index is equal to hue
  var OHLC = [];

  // Initialize OHLC
  _(_.range(361)).each(function(d, i) {
    OHLC.push({h: i, l: 0, contributors: 0});
  });

  // Loop on all hues
  _(_.range(361)).each(function(centralHue, i) {
    var minHue = centralHue - subsetHueRange / 2;
    var maxHue = centralHue + subsetHueRange / 2;
    var hueSubset = filters.inHueRange(rounds, minHue, maxHue);

    // Loop on (nearly) all players
    _(reachedLevel2players).each(function(p) {
      // Get the overall learning for the given hue range by summing up all learnings
      var focus = filters.matchUsername(hueSubset, p);
      var learning = analysis.getRoundsLearning(focus);
      var totalSubsetLearning = 0;
      _(learning).each(function(d) {
        totalSubsetLearning += parseFloat(d.learning);
      });
      // If there's something, add it!
      if (totalSubsetLearning > 0) {
        var currentHueObject = OHLC[i];
        currentHueObject.contributors++;
        currentHueObject.l += totalSubsetLearning;
      }
    });

  });

  var averageContributors = 0;
  // Now average all learnings with their contributors count, 'cause so far it's just a sum
  _(OHLC).each(function(d) {
    d.l /= (d.contributors > 0 ? d.contributors : 1);
    averageContributors += d.contributors;
  });

  console.log(averageContributors / 360);

  return OHLC;
};
analysis.smoothOverallHueLearningCurve = function(OHLC) {
  var newOHLC = [];

  _(_.range(361)).each(function(d, i) {
    var smoothLearning = 0;
    var indexes = [(360 + i - 2) % 360, (360 + i - 1) % 360, ((360 + i) % 360) , (360 + i + 1) % 360, (360 + i + 2) % 360];

    _(indexes).each(function(d) {
      smoothLearning -= -OHLC[d].l;
    });
    smoothLearning /= indexes.length;

    newOHLC.push({h: i, l: smoothLearning, contributors: OHLC[i].contributors});
  });

  return newOHLC;
};
analysis.getHuePerformanceCurve = function(rounds, subsetHueRange) {
  // HPC (Hue Performance Curve) is an array of objects containing a hue, a performance value, and the number of contributions to the average learning
  // The performance corresponds to the average performance for all players, within a hue subset centered in 'centralHue' and of a 'subsetHueRange' range
  // The HPC array has 360 elements, and index is equal to hue
  var HPC = [];

  // Initialize HPC
  _(_.range(361)).each(function(d, i) {
    HPC.push({h: i, p: 0, contributors: 0});
  });

  // Loop on all hues
  _(_.range(361)).each(function(centralHue) {
    var minHue = centralHue - subsetHueRange / 2;
    var maxHue = centralHue + subsetHueRange / 2;
    var hueSubset = filters.inHueRange(rounds, minHue, maxHue);

    // Loop on all subset rounds
    var totalSubsetPerformance = 0;
    var totalSubsetContributors = 0;
    _(hueSubset).each(function(r) {
      // Get the overall performance for the given hue range by summing up all performance
      totalSubsetContributors++;
      totalSubsetPerformance -= -r.performance;
    });

    HPC[centralHue].p -= -totalSubsetPerformance;
    HPC[centralHue].contributors -= -totalSubsetContributors;
  });


  // Now average all performance with their contributors count, 'cause so far it's just a sum
  _(HPC).each(function(d) {
    d.p /= (d.contributors > 0 ? d.contributors : 1);
  });

  return HPC;
};
analysis.smoothHuePerformanceCurve = function(HPC) {
  var newHPC = [];

  _(_.range(361)).each(function(d, i) {
    var smoothPerformance = 0;
    var indexes = [(360 + i - 2) % 360, (360 + i - 1) % 360, ((360 + i) % 360) , (360 + i + 1) % 360, (360 + i + 2) % 360];

    _(indexes).each(function(d) {
      smoothPerformance -= -HPC[d].p;
    });
    smoothPerformance /= indexes.length;

    newHPC.push({h: i, p: smoothPerformance, contributors: HPC[i].contributors});
  });

  return newHPC;
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
  jQuery('.content-global .tile-container:nth-of-type(1) .data-data p span.inner').html(players.length);
  // Rounds
  jQuery('.content-global .tile-container:nth-of-type(2) .data-data p span.inner').html(rounds.length);
  // Players who reached level 2
  jQuery('.content-global .tile-container:nth-of-type(3) .data-data p span.inner').html(reachedLevel2players.length);
  // Players who reached level 4
  jQuery('.content-global .tile-container:nth-of-type(4) .data-data p span.inner').html(reachedLevel4players.length);
};

UI.rankings = {};
UI.rankings.build = function() {

  // Template for a score div
  var scoreView = _.template("" +
      "<div class='score flexrow'>" +
      "<p class='username'><%= username %></p>" +
      "<div class='shotcolor' style='background: hsl(<%= targetH %>, <%= targetS %>%, <%= targetL %>%)'></div>" +
      "<p class='performance'><%= performance %> <span class='points'>points</span></p>");

  // Fill all 4 levels' rankings
  for (var level = 1; level <= 4; level++) {
    // Get 10 best scores
    var bestScores = filters.sortByPerformance(filters.matchLevel(rounds, level)).slice(0, 10);
    // Create view and append
    for (var i = 0; i < 10; i++) {
      var score = bestScores[i];
      var scoreHTML = scoreView({
        username: score.username,
        targetH: score.targetH,
        targetS: score.targetS,
        targetL: score.targetL,
        performance: score.performance
      });
      jQuery('.content-rankings .tile-container:nth-of-type(' + level + ') .hall-of-fame .scores').append(scoreHTML);
    }
  }
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
  UI.steamgraph.shape();
  UI.steamgraph.update(true);
  UI.steamgraph.listen();
};
UI.steamgraph.shape = function() {
  // Initial call to build permanent elements

  // Generate select tags' names
  _.each(usernamesSortedByRoundsPlayed, function(d, i) {
    var fakeName = UI.steamgraph.fakenames[i];
    var playerSelect = "<div data-value='" + d.username + "' data-fakename='" + fakeName + "'>" + fakeName + "</div>";
    jQuery('.content-steamgraph .controls-area[data-area-type=players] .tiles').append(playerSelect);
  });
  // Add .active classes to preselected players
  var jPlayers = jQuery('.content-steamgraph .controls-area[data-area-type=players] .tiles');
  jPlayers.find('div[data-value=Chloé]').addClass('active');
  jPlayers.find('div[data-value=thnon]').addClass('active');
  jPlayers.find('div[data-value=Konstantina]').addClass('active');
  jPlayers.find('div[data-value=jouj]').addClass('active');

};
UI.steamgraph.listen = function() {
  // Streamgraph selection tiles default behavior
  jQuery('.content-steamgraph').on('click', '.controls-area .tiles > div', function() {
    // Get data value stored in DOM attribute
    var dataValue = jQuery(this).attr('data-value') || 'error';
    if (dataValue == 'players-all' || dataValue.indexOf('hue-layers-') != -1 || dataValue.indexOf('level') != '-1') return;// Specific handlers
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
  jQuery('.content-steamgraph').on('click', playersTilesSel + '[data-value="players-all"]', function() {

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
  jQuery('.content-steamgraph').on('click', hueTilesSel + '.hue-layer', function() {
    var layerDataValue = jQuery(this).attr('data-value');
    // Get just the number (btw, make sure it's a divisor of 360)
    var layerHueWidth = layerDataValue.slice(11, layerDataValue.length);
    // I add a small hue offset to hue layers just to avoid conflicts with other ranges without impacting the data too much
    var offset = Math.floor(layerHueWidth / 20);

    function removeLayers() {
      // Deactivate created layer elements
      // Unless the layer is 100° large, the offsets will likely be lower than 10°...
      // Unselect all hueRanges that are not multiples of 10°! (sooo ugly)
      _(UI.steamgraph.selected.hueRanges).each(function(d) {
        var startHue = d.split('-')[1];
        if (startHue % 10 != 0) {
          UI.steamgraph.selected.update('hueRanges', d, false);
        }
      });
    }

    if (!jQuery(this).hasClass('active')) {
      jQuery(this).addClass('active');

      // Dectivate all other elements
      jQuery(hueTilesSel).each(function() {
        var tileDataValue = jQuery(this).attr('data-value');
        if (tileDataValue != layerDataValue) {
          // View
          jQuery(this).removeClass('active');
          // Models
          UI.steamgraph.selected.update('hueRanges', tileDataValue, false);
          // Special treat for layers (need to remove all their damn ranges)
          removeLayers();
        }
      });

      // Create and activate layer elements
      for (var hue = offset; hue < 360; hue -= (-layerHueWidth)) {
        UI.steamgraph.selected.update('hueRanges', 'hue-' + hue + '-' + (hue - (-layerHueWidth)), true);
      }
    } else {
      jQuery(this).removeClass('active');
      removeLayers();
    }

    UI.steamgraph.update(false);
  });

  // Specific selects for levels
  var levelsTilesSel = '.controls-area[data-area-type="levels"] .tiles > div';
  jQuery('.content-steamgraph').on('click', levelsTilesSel, function() {

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

  // Onkeyup deanonymization (S key)
  jQuery(window).on('keyup', function(event) {
    if (event.which == 83) {
      // Change player names into their real values
      jQuery('.content-steamgraph .controls-area[data-area-type=players] .tiles > div').each(function() {
        var dataValue = jQuery(this).attr('data-value') || 'error';
        if (dataValue != 'players-all') {
          jQuery(this).html(jQuery(this).attr('data-value'));
        }
      });
      // Remove indication that it is anonymized
      jQuery('.content-steamgraph .controls-area[data-area-type=players] p.title span.anonymous').hide();
    }
  });

};
UI.steamgraph.update = function(isFirstTime) {
  // Arguments directly come from UI.steamgraph.selected
  var players = this.selected.players;
  var hueRanges = this.selected.hueRanges;
  var levels = this.selected.levels;

  var layersParams = this.formatLayersParams(players, hueRanges, levels);
  var stack = d3.layout.stack().offset("wiggle");// Adds the y0 coordinate to objects
  var layers0 = stack(layersParams.map(function(d) { return UI.steamgraph.getSteamgraphLayers(d); }));

  // The graph container (.container-3 is hidden at first so there's no way to get its width)
  // We have to use what's already plotted
  var width = jQuery('.huehunt-results').width() * 0.8,
      height = jQuery('.huehunt-results').height() - 250;

  var x = d3.scale.linear()
      .domain([0, d3.max(layers0, function(layer) { return d3.max(layer, function(d) {
        // Detects maximal x with non-null learning and adjusts domain max width
        // Add 1 to offset 0-based count and another 1 for some space
        return (d.y == 0 ? 0 : d.x + 2);
      }); })])
      .range([40, width - 40]);

  var y = d3.scale.linear()
      .domain([0, d3.max(layers0, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height - 100, 10]);

  var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });


  var graph = d3.select(".content-steamgraph .steam-content svg g.graph");

  if (isFirstTime) {
    d3.select(".content-steamgraph .steam-content svg").attr("width", width).attr("height", height);
  }

  // Transition
  var paths = graph.selectAll("path")
    // layers is bound to a playername, otherwise exit() just removes the last added path rather than the
    // one corresponding to the deselected player. Same for color, and level so we concatenate into a unique ID
    .data(layers0, function(d) { return d[0].player + '_' + d[0].color + '_' + d[0].level; });

  paths.transition()
      .duration(2000)
      .attr("d", area);

  paths.exit().style("fill", function(d) { return d[0].color; }).remove();

  setTimeout(function() {
    paths.enter().append("path")
      .attr("d", area)
      .style("fill", function(d) { return d[0].color; });
  }, 2000);

  // Add some horizontal axis
  var hAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickValues(_.range(x.domain()[1] + 1).filter(function(d, i) {
        return !(i % 10);
      }))
      .tickFormat(function(d) {
        return d;
      });

  var hGuide = d3.select('.content-steamgraph .steam svg g.axis');

  hAxis(hGuide);

  hGuide.attr('transform', 'translate(' + 0 + ', ' + 0.9 * height + ')')
      .attr('font-family','Lucida Console')
      .attr('font-size', '16');

  hGuide.selectAll('path')
      .style('fill', 'none')
      .style('stroke', '#FFF');
  hGuide.selectAll('line')
      .style('stroke', '#FFF');
  hGuide.selectAll('text')
      .style('stroke', '#FFF')
      .style('fill', '#FFF');

};
UI.steamgraph.formatLayersParams = function(players, hueRanges, levels) {

  var layersParams = [];
  var self = this;
  _.each(hueRanges, function(hueDOMkey) {
    _.each(players, function(player) {
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
  var focusRounds = filters.sortByLevel(filters.matchLevel(filters.inHueRange(filters.matchUsername(rounds, d.player), d.minHue, d.maxHue), d.level));
  var learning = analysis.getRoundsLearning(focusRounds);

  var color = (d.maxHue - d.minHue <= 180 ? 'hsl(' + (parseInt(d.maxHue) + parseInt(d.minHue)) / 2 + ', 60%, 50%)' : 'hsl(200, 10%, 70%)');

  var layer = [];
  for (var i = 0; i < UI.steamgraph.maxX; i++) {
    layer.push({
      x: i,
      y: 0,
      color: color,
      player: d.player,
      level: d.level
    });
  }

  // Players have different numbers of rounds played, we must fill the data gap
  // Also, the learning array provides very few data, few x values
  // And only some of them have a positive learning
  _(learning).each(function(dd) {
    layer[dd.nthRoundPlayed].y = dd.learning;
  });

  return UI.steamgraph.smoothSteamgraphLayer(UI.steamgraph.smoothSteamgraphLayer(UI.steamgraph.smoothSteamgraphLayer(layer)));
};
UI.steamgraph.smoothSteamgraphLayer = function(layer) {
  var newLayer = [];
  
  // Build new layer with smoothed y data
  for (var i = 0; i < UI.steamgraph.maxX; i++) {
    var smoothY = 0;
    var indexes = [i - 2, i - 1, i, i + 1, i + 2];

    var smoothers = 0;
    _(indexes).each(function(ii) {
      if (layer[ii]) {
        smoothY -= -layer[ii].y;
        smoothers++;
      }
    });
    smoothY /= smoothers;

    newLayer.push({
      x: i,
      y: smoothY,
      color: layer[i].color,
      player: layer[i].player,
      level: layer[i].level
    });
  }

  return newLayer;
};
UI.steamgraph.maxX = 180;
UI.steamgraph.fakenames = [
  'Abbott', 'Abergavenny', 'Abhorson', 'Achilles', 'Aediles', 'Aegeon',
  'Aeneas', 'Agamemnon', 'Ajax', 'Alarbus', 'Alcibiades', 'Alexas', 'Amiens',
  'Aguecheek', 'Andromache', 'Andronicus', 'Angelica', 'Angus', 'Antenor',
  'Antigonus', 'Antiochus', 'Antipholus', 'Apemantus', 'Archidamus', 'Arcite',
  'Arragon', 'Artemidorus', 'Arviragus', 'Aumerle', 'Autolycus',
  'Balthasar', 'Banquo', 'Bardolph', 'Bassanio', 'Belarius', 'Berowne',
  'Bertram', 'Biondello', 'Bolingbroke', 'Boult', 'Boyet', 'Brackenbury',
  'Bromodideuterio', 'Bullcalf', 'Burgundy', 'Bushy',
  'Cawdal', 'Caius', 'Calchas', 'Caliban', 'Calphurnia', 'Camillo', 'Canidius',
  'Caphis', 'Capulet', 'Catesby', 'Caithness', 'Cinna', 'Clarence', 'Claudio',
  'Cleomines', 'Cleon', 'Cleopatra', 'Clifford', 'Cloten', 'Cobweb',
  'Cominius', 'Conrade', 'Constance', 'Corambis', 'Cordelia', 'Corin', 'Cornelius',
  'Costard', 'Crab', 'Cressida', 'Cromwell', 'Curan', 'Curio', 'Curtis', 'Cymbeline',
  'Dardanius', 'Davy', 'Deiphobus', 'Demetrius', 'Dennis', 'Dercetus', 'Desdemona',
  'Diana', 'Diomedes', 'Dion', 'Dionyza', 'Dogberry', 'Dolabella', 'Dorcas',

  'Lennox', 'Macduff', 'Macbeth',
  'Ross', 'Duncan', 'Malcolm', 'Donalbain', 'Fleance', 'Siward', 'Seyton', 'Menteith'
];

UI.huePerformanceCurve = {};
UI.huePerformanceCurve.build = function() {
  UI.huePerformanceCurve.processData();
  UI.huePerformanceCurve.update();
};
UI.huePerformanceCurve.processData = function() {
  this.HPC = analysis.getHuePerformanceCurve(rounds, 2);
};
UI.huePerformanceCurve.update = function() {
  // Draw HPC
  UI.huePerformanceCurve.drawHPC(analysis.smoothHuePerformanceCurve(UI.huePerformanceCurve.HPC));
};
UI.huePerformanceCurve.drawHPC = function(HPC) {
  // Graph dimensions
  var width = jQuery('.huehunt-results').width() * 0.8,
      height = jQuery('.huehunt-results').height();

  d3.select('.content-hpc .hpc svg').attr("width", width).attr("height", height);

  // Scales
  var x = d3.scale.ordinal()
      .domain(d3.range(0, 361))
      .rangeBands([0.05 * width, 0.95 * width], 0.15, 0);

  var y = d3.scale.linear()
      .domain([0, d3.max(HPC, function(d, i) {
        return d.p;
      })])
      .range([0.05 * height, 0.9 * height]);

  // Draw the bar chart
  var bars = d3.select('.content-hpc .hpc svg g.graph')
      .selectAll('rect').data(HPC);

  bars.enter()
      .append('rect')
      .style('fill', function(d, i) {
        return 'hsl(' + i + ', 60%, 50%)';
      });

  bars.transition().duration(500)
      .attr('width', x.rangeBand())
      .attr('x', function(d, i) {
        return x(i);
      })
      .attr('height', function(d, i) {
        return y(d.p);
      })
      .attr('y', function(d, i) {
        return 0.95 * height - y(d.p);
      });

  // And the horizontal axis
  var hAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickValues(x.domain().filter(function(d, i) {
        return !(i % 30);
      }))
      .tickFormat(function(d) {
        return d + '°';
      });

  var hGuide = d3.select('.content-hpc .hpc svg g.axis');

  hAxis(hGuide);

  hGuide.attr('transform', 'translate(' + 0 + ', ' + 0.95 * height + ')')
      .attr('font-family','Lucida Console')
      .attr('font-size', '20');

  hGuide.selectAll('path')
      .style('fill', 'none')
      .style('stroke', '#FFF');
  hGuide.selectAll('line')
      .style('stroke', '#FFF');
  hGuide.selectAll('text')
      .style('stroke', '#FFF');

  // Inspired of http://codepen.io/darrengriffith/pen/RPwrxp
};

UI.overallHueLearningCurve = {};
UI.overallHueLearningCurve.OHLC = [];
UI.overallHueLearningCurve.build = function() {
  UI.overallHueLearningCurve.processData();
  UI.overallHueLearningCurve.update(UI.overallHueLearningCurve.rangeValue);
  UI.overallHueLearningCurve.listen();
};
UI.overallHueLearningCurve.processData = function() {
  this.OHLC = analysis.getOverallHueLearningCurve(rounds, UI.overallHueLearningCurve.rangeValue);
};
UI.overallHueLearningCurve.update = function(subsetHueRange) {
  // Get new OHLC and smooth it a bit
  var OHLC = analysis.getOverallHueLearningCurve(rounds, subsetHueRange);
  UI.overallHueLearningCurve.OHLC = analysis.smoothOverallHueLearningCurve(OHLC);

  // Force range input value, and indicator
  jQuery('.content-ohlc .ohlc .controls .range input').val(subsetHueRange);
  jQuery('.content-ohlc .ohlc .controls .range p.value-insight').html(subsetHueRange + '°');

  // Draw OHLC
  UI.overallHueLearningCurve.drawOHLC(UI.overallHueLearningCurve.OHLC);
};
UI.overallHueLearningCurve.drawOHLC = function(OHLC) {
  // Graph dimensions
  var width = jQuery('.huehunt-results').width() * 0.8,
      height = jQuery('.huehunt-results').height() - 180;

  d3.select('.content-ohlc .ohlc svg').attr("width", width).attr("height", height);

  // Scales
  var x = d3.scale.ordinal()
      .domain(d3.range(0, 361))
      .rangeBands([0.05 * width, 0.95 * width], 0.15, 0);

  var y = d3.scale.linear()
      .domain([0, d3.max(OHLC, function(d, i) {
        return d.l;
      })])
      .range([0.05 * height, 0.9 * height]);

  // Draw the bar chart
  var bars = d3.select('.content-ohlc .ohlc svg g.graph')
      .selectAll('rect').data(OHLC);

  bars.enter()
      .append('rect')
      .style('fill', function(d, i) {
        return 'hsl(' + i + ', 60%, 50%)';
      });

  bars.transition().duration(500)
      .attr('width', x.rangeBand())
      .attr('x', function(d, i) {
        return x(i);
      })
      .attr('height', function(d, i) {
        return y(d.l);
      })
      .attr('y', function(d, i) {
        return 0.95 * height - y(d.l);
      });

  // And the horizontal axis
  var hAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickValues(x.domain().filter(function(d, i) {
        return !(i % 30);
      }))
      .tickFormat(function(d) {
        return d + '°';
      });

  var hGuide = d3.select('.content-ohlc .ohlc svg g.axis');

  hAxis(hGuide);

  hGuide.attr('transform', 'translate(' + 0 + ', ' + 0.95 * height + ')')
      .attr('font-family','Lucida Console')
      .attr('font-size', '20');

  hGuide.selectAll('path')
      .style('fill', 'none')
      .style('stroke', '#FFF');
  hGuide.selectAll('line')
      .style('stroke', '#FFF');
  hGuide.selectAll('text')
      .style('stroke', '#FFF');

  // Inspired of http://codepen.io/darrengriffith/pen/RPwrxp
};
UI.overallHueLearningCurve.listen = function() {
  // Range input listener
  jQuery('.content-ohlc .ohlc .controls .range input').on('change', function() {
    var subsetHueRange = jQuery(this).val();
    // Update graph
    UI.overallHueLearningCurve.update(subsetHueRange);
    // Save current selection (in case of animation)
    UI.overallHueLearningCurve.rangeValue = subsetHueRange;
  });

  // Animation button listener
  jQuery('.content-ohlc .ohlc .controls .animate').on('click', function() {
    if (!jQuery(this).hasClass('active')) {
      UI.overallHueLearningCurve.animationOn();
    } else {
      UI.overallHueLearningCurve.animationOff();
    }

  });
};
UI.overallHueLearningCurve.animationOn = function() {
  var animationDiv = jQuery('.content-ohlc .ohlc .controls .animate');
  animationDiv.addClass('active').find('p').html('Stop');
  animationDiv.find('span.fa').removeClass('fa-play-circle').addClass('fa-stop-circle');
  // Start animation
  var i = 10;
  UI.overallHueLearningCurve.animation = setInterval(function() {
    UI.overallHueLearningCurve.update(i);
    i++;
    if (i > 121) {
      UI.overallHueLearningCurve.animationOff();
    }
  }, 1000);

};
UI.overallHueLearningCurve.animationOff = function() {
  var animationDiv = jQuery('.content-ohlc .ohlc .controls .animate');
  animationDiv.removeClass('active').find('p').html('Animate');
  animationDiv.find('span.fa').removeClass('fa-stop-circle').addClass('fa-play-circle');
  // Stop animation
  clearInterval(UI.overallHueLearningCurve.animation);
  // Restore initial graph state
  UI.overallHueLearningCurve.update(UI.overallHueLearningCurve.rangeValue);
};
UI.overallHueLearningCurve.rangeValue = 60;
UI.overallHueLearningCurve.megaOHLC = [];
UI.overallHueLearningCurve.generateMegaOHLC = function(minSHR, maxSHR, smoothingDegree) {
  // This calculation averages ALL the OHLCs with Subset Hue Ranges from 10° to 80°
  // OMG it takes so much time we have to space out all calculation steps
  var megaOHLC = [];
  for (var i = 0; i < 361; i++) {
    megaOHLC.push({h: i, l: 0, contributors: 0});
  }

  // Global loading
  jQuery('.huehunt-results').addClass('loading');

  // This will last 90 seconds
  for (var SHR = minSHR; SHR <= maxSHR; SHR++) {
    (function(j) {
      setTimeout(function() {
        var OHLC = analysis.getOverallHueLearningCurve(rounds, j);
        for (var i = 0; i < 361; i++) {
          megaOHLC[i].l += OHLC[i].l;
        }
      }, 1000 * (SHR - minSHR));
    })(SHR);
  }
  // This has to be launched after 80 seconds + extra lag
  setTimeout(function() {
    // Several smoothing moments maybe?
    for (var i = 0; i < smoothingDegree; i++) {
      megaOHLC = analysis.smoothOverallHueLearningCurve(megaOHLC);
    }
    UI.overallHueLearningCurve.megaOHLC = megaOHLC;// For future use
    UI.overallHueLearningCurve.drawOHLC(megaOHLC);

    // Undo global loading
    jQuery('.huehunt-results').removeClass('loading');
  }, 1000 * (maxSHR - minSHR + 5)); // 5sec lag allowed

};

UI.showYourself = function() {
  jQuery('.huehunt-results').removeClass('loading');
  // Show first tab content
  jQuery('.content .content-1').show();
  jQuery('.side-menu p.tab:nth-of-type(1)').addClass('selected');
};

/* Data processing functions */
function isInHueRange(inputHue, minHue, maxHue) {
  var result = false;
  // Try several values
  for (var hueMod = -720; hueMod <= 720; hueMod += 360) {
    var h = inputHue + parseInt(hueMod);

    if (minHue < maxHue) {
      if (h >= minHue && h <= maxHue) {
        result = true;
      }
    } else {
      if (h >= minHue || h <= maxHue) {
        result = true;
      }
    }
  }

  return result;
}
function twoDecimalsOf(value) {
  return (typeof(value) == 'string' ? value : Math.floor(parseInt(100 * value)) / 100);
}
function absoluteHueDistanceBetween(minHue, maxHue) {
  // Note: doesn't work if the difference is too big
  return Math.min(Math.abs(maxHue - minHue), Math.abs(minHue - maxHue), Math.abs(maxHue - minHue - 360));
}

// DOM listeners
jQuery(document).ready(function() {
  // Menu tabs
  jQuery('.huehunt-results').on('click', '.side-menu p.tab', function() {
    var tabNumber = 1 + jQuery(this).index('.side-menu p.tab');
    // Show according content
    jQuery('.content > div').hide();
    jQuery('.content .content-' + tabNumber).show();
    // Highlight clicked tab
    jQuery('.side-menu p.tab').removeClass('selected');
    jQuery(this).addClass('selected');
  });
  
  // To the game and To the report buttons
  jQuery('.huehunt-results').on('click', '.side-menu .to-the-game', function() {
    jQuery('.huehunt-results a.to-game').click();
  });
  jQuery('.huehunt-results').on('click', '.side-menu .to-the-report', function() {
    jQuery('.huehunt-results a.to-report').click();
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
  myFirebaseRef.once("value", function(data) {
    firebaseRounds = data.val();
    // Cleanup data format (from dirty JSON to array of objects)
    rounds = filters.enrichRoundsDataset(filters.formatFirebaseDataset(firebaseRounds));

    UI.globalData.build();
    UI.rankings.build();
    UI.showYourself();
    UI.steamgraph.build();
    UI.huePerformanceCurve.build();
    UI.overallHueLearningCurve.build();

  });

});
