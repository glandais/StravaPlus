/**
 *   Contructor
 */
function Helper() {

}

/**
 * Define prototype
 */
Helper.prototype = {

};

/**
 * Static method call test
 */
Helper.log = function(tag, object) {
    if (env.debugMode) {
        console.log('<' + tag + '>');
        console.log(object);
        console.log('</' + tag + '>');
    }
};

Helper.HHMMSStoSeconds = function(str) {
    var p = str.split(':'),
        s = 0,
        m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
};

Helper.secondsToHHMMSS = function(secondsParam, trimLeadingZeros) {
    var sec_num = parseInt(secondsParam, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return trimLeadingZeros ? Helper.trimLeadingZerosHHMMSS(time) : time;
};

Helper.statistics = function statistics(values, optionsParam) {
    var list = [];
    var totValue = 0;
    var totWeight = 0;
    var options = optionsParam ? optionsParam : {};
    var weights = options.weights;
    var ratio = options.ratio ? options.ratio : 1;
    var treshold = options.treshold;
    var tresholdValue = options.tresholdValue;
    var percentiles = options.percentiles;
    var start = options.start ? options.start : 0;
    var end = options.end ? options.start : values.length - 1;
    var previous = null;
    var midValue;
    var weight;
    for (var i = start; i <= end; i++) {
        if (!treshold || !tresholdValue || treshold[i] > tresholdValue) {
            if (previous) {
                if (weights) {
                    weight = weights[i] - weights[i - 1];
                } else {
                    weight = 1;
                }
                midValue = (values[i] - (values[i] - previous) / 2) * ratio;
                list.push({ value : midValue, weight : weight});
                totWeight += weight;
                totValue += weight * midValue;
            }
            previous = values[i];
        } else {
            previous = null;
        }
    }
    var average = totValue / totWeight;
    var sumVariance = 0;
    for (var i = 0; i < list.length; i++) {
    }
    var percentileValues = [];
    // inspired from https://en.wikipedia.org/wiki/Weighted_median and https://en.wikipedia.org/wiki/Percentile#Definition_of_the_Weighted_Percentile_method
    list.sort(function(a, b) {
        return a.value - b.value;
    });
    if (percentiles) {
        for (var i = 0; i < percentiles.length; i++) {
            percentileValues.push(null);
        }
    }
    var cur = 0;
    for (var i = 0; i < list.length; i++) {
        sumVariance += list[i].weight * Math.pow(list[i].value - average, 2);
        if (percentiles) {
            for (var j = 0; j < percentiles.length; j++) {
                // found the sample matching the percentile
                if (!percentileValues[j] && cur < percentiles[j] * totWeight && (cur + list[i].weight) > (percentiles[j] - 0.00001) * totWeight) {
                    if ((cur + list[i].weight) >= (percentiles[j] * totWeight) && (i + 1 < list.length)) {
                        var r = (percentiles[j] * totWeight - cur) / list[i].weight;
                        percentileValues[j] = list[i].value + (list[i + 1].value - list[i].value) * r;
                    } else {
                        percentileValues[j] = list[i].value;
                    }
                }
            }
            cur += list[i].weight;
        }
    }
    if (percentiles) {
        for (var j = 0; j < percentiles.length; j++) {
            if (!percentileValues[j]) {
                percentileValues[j] = 0;
            }
        }
    }
    var variance = sumVariance / totWeight;
    var stdDeviation = Math.sqrt(variance);
    var result = { percentileValues : percentileValues, average : average, variance : variance, stdDeviation : stdDeviation };
    return result;
};

Helper.weightedPercentiles = function(values, weights, percentiles) {
    // inspired from https://en.wikipedia.org/wiki/Weighted_median and https://en.wikipedia.org/wiki/Percentile#Definition_of_the_Weighted_Percentile_method
    var list = [];
    var totWeight = 0;
    for (var i = 0; i < values.length; i++) {
        list.push({ value : values[i], weight : weights[i]});
        totWeight += weights[i];
    }
    list.sort(function(a, b) {
        return a.value - b.value;
    });
    var percentileValues = [];
    for (var i = 0; i < percentiles.length; i++) {
        percentileValues.push(null);
    }

    var cur = 0;
    var r;
    for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < percentiles.length; j++) {
            // found the sample matching the percentile
            if (cur < percentiles[j] * totWeight && (cur + list[i].weight) > (percentiles[j] - 0.00001) * totWeight) {
                percentileValues[j] = list[i].value;
            }
        }
        cur += list[i].weight;
    }
    for (var j = 0; j < percentiles.length; j++) {
        if (!percentileValues[j]) {
            percentileValues[j] = 0;
        }
    }

    return percentileValues;
};

// Use abstract equality == for "is number" test
Helper.isEven = function(n) {
    return n == parseFloat(n) ? !(n % 2) : void 0;
}


Helper.heartrateFromHeartRateReserve = function(hrr, maxHr, restHr) {
    return (parseFloat(hrr) / 100 * (parseInt(maxHr) - parseInt(restHr)) + parseInt(restHr)).toFixed(0);
};

Helper.heartRateReserveFromHeartrate = function(hr, maxHr, restHr) {
    return (parseFloat(hr) - parseInt(restHr)) / (parseInt(maxHr) - parseInt(restHr));
};


Helper.setToStorage = function(extensionId, storageType, key, value, callback) {

    // Sending message to background page
    chrome.runtime.sendMessage(extensionId, {
            method: StravistiX.setToStorageMethod,
            params: {
                storage: storageType,
                'key': key,
                'value': value
            }
        },
        function(response) {
            callback(response);
        }
    );
};

Helper.getFromStorage = function(extensionId, storageType, key, callback) {
    // Sending message to background page
    chrome.runtime.sendMessage(extensionId, {
            method: StravistiX.getFromStorageMethod,
            params: {
                storage: storageType,
                'key': key
            }
        },
        function(response) {
            callback(response);
        }
    );
};

Helper.includeJs = function(scriptUrl) {
    var link = document.createElement('link');
    link.href = chrome.extension.getURL(scriptUrl);
    link.type = 'text/css';
    link.rel = 'stylesheet';
    (document.head || document.documentElement).appendChild(link);
};

Helper.formatNumber = function(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

Helper.secondsToDHM = function(sec_num, trimZeros) {
    var days = Math.floor(sec_num / 86400);
    var hours = Math.floor((sec_num - (days * 86400)) / 3600);
    var minutes = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
    if (trimZeros && days === 0) {
        if (hours === 0) {
            return minutes + 'm';
        }
        return hours + 'h ' + minutes + 'm';
    }
    return days + 'd ' + hours + 'h ' + minutes + 'm';
};

Helper.trimLeadingZerosHHMMSS = function(time) {
    var result = time.replace(/^(0*:)*/, '').replace(/^0*/, '') || "0";
    if (result.indexOf(":") < 0) {
        return result + "s";
    }
    return result;
};

Helper.guid = function() {
    // from http://stackoverflow.com/a/105074
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

Helper.smoothAltitude = function smoothAltitude(activityStream, stravaElevation) {
    var activityAltitudeArray = activityStream.altitude;
    var distanceArray = activityStream.distance;
    var velocityArray = activityStream.velocity_smooth;
    var smoothingL = 10;
    var smoothingH = 600;
    var smoothing;
    var altitudeArray;
    while (smoothingH - smoothingL >= 1) {
        smoothing = smoothingL + (smoothingH - smoothingL) / 2;
        altitudeArray = Helper.lowPassDataSmoothing_(activityAltitudeArray, distanceArray, smoothing);
        var totalElevation = 0;
        for (var i = 0; i < altitudeArray.length; i++) { // Loop on samples
            if (i > 0 && velocityArray[i] * 3.6 > VacuumProcessor.movingThresholdKph) {
                var elevationDiff = altitudeArray[i] - altitudeArray[i - 1];
                if (elevationDiff > 0) {
                    totalElevation += elevationDiff;
                }
            }
        }

        if (totalElevation < stravaElevation) {
            smoothingH = smoothing;
        } else {
            smoothingL = smoothing;
        }
    }
    return altitudeArray;
};

Helper.lowPassDataSmoothing_ = function(data, distance, smoothing) {
    // Below algorithm is applied in this method
    // http://phrogz.net/js/framerate-independent-low-pass-filter.html
    if (data && distance) {
        var result = [];
        result[0] = data[0];
        for (i = 1, max = data.length; i < max; i++) {
            if (smoothing === 0) {
                result[i] = data[i];
            } else {
                result[i] = result[i - 1] + (distance[i] - distance[i - 1]) * (data[i] - result[i - 1]) / smoothing;
            }
        }
        return result;
    }
};
