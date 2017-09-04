/**
 * LiuChan Dictionary Class
 * @constructor
 */
function dictTest() {
    //this.loadDictionary();
}

dictTest.prototype = {
    fileRead: function (filename, field) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", filename);

            xhr.onload = function () {
                self.parseDict(this.responseText, field);
                resolve();
            };

            xhr.onerror = function (e) {
                reject(e);
            };

            xhr.send(null);
        })
    },

    loadDictionary: function () {
        return Promise.all([
            this.fileRead("../data/cedict_ts.u8", "hanzi")])
            .then(function () {
                onDictionaryLoaded();
            });
    },

    parseDict: function (dict, field) {
        var reg = /(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+)\//gi;

        var array = [];
        while (result = reg.exec(dict)) {
            var traditional = result[1];
            var simplified = result[2];
            var pinyin = result[3];
            var definition = result[4].split("/");

            array.push(
                {"simp": simplified,
                "trad": traditional,
                "pinyin": pinyin,
                "def": definition})
        }

        this[field] = array;
    }
};

console.log("Starting...");
test = new dictTest();
test.loadDictionary();


function onDictionaryLoaded(string) {
    console.log ("Dictionary Loaded:");
    //console.log(JSON.stringify(test.hanzi));
    //document.write(JSON.stringify(test.hanzi));
    char = "光";
    chartrad = "龜";
    word = "铝合金脚";
    p = test.hanzi;

    wordSearch(test.hanzi, "视频");
    //wordSearch(test.hanzi, "合金脚");
    //wordSearch(test.hanzi, "提供安装说明书");
    //indexSearch(test.hanzi, chartrad);
}

function indexSearch(dict, char) {
    // What this function does is quickly try to find all entries in the dictionary
    // that match the first character of the word that we're trying to look up.
    // It returns a start and end index number of the dictionary to use when looking for words
    console.log("Index Search");
    var foundMatch = false,
        firstMatch, lastMatch;

    for (var key in dict) {
        if (char === dict[key].simp.charAt(0) || char ===  dict[key].trad.charAt(0)) {

            console.log(dict[key].simp, dict[key].def);
            if (foundMatch === false) firstMatch = key;
            foundMatch = true;
        } else if (firstMatch == (key - 1)) {
            // Some weird variants mess things up, so in that case keeps iterating. Inefficient,
            //  but better than losing out on definitions
            console.log(key-1);
            foundMatch = false;
        } else if (foundMatch) {
            lastMatch = key - 1;
            break;
        }
    }

    if (!foundMatch) return null
    return [firstMatch, lastMatch]
}

function wordSearch(dict, word) {

    var index = indexSearch(dict, word.charAt(0));
    //console.log("Word Search");
    //console.log(index[0], index[1]);
    var results = {};
    results.data = [];

    while (word.length > 0) {
        for (i = index[0]; i <= index[1]; i++) {
            //console.log('Iteration: ' + i)
            if (dict[i].trad === word || dict[i].simp === word) {
                results.data.push(dict[i]);
            }
        }
        word = word.substr(0, word.length - 1);
    }

    results.matchLen = 0;
    for (var key in results.data) {
        // Set highlight length to longest match
        if (results.data[key].simp.length > results.matchLen) {
            results.matchLen = results.data[key].simp.length;
        }
    }
    console.log(results);
    return results;
}
