(function ($) {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    Ss_input.tools = {
        dirname: function (path) {
            return path.replace(/\\/g, '/')
             .replace(/\/[^\/]*\/?$/, '');
        },
        getExtension: function (file) {
            return file.split('.').pop().toLowerCase();
        },
        basename: function (url) {
            return url.replace(/\\/g, '/').replace(/.*\//, '')
        },
        parseDate: function (input) {
            var parts = input.match(/(\d+)/g);
            return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
        },
        //@author http://weblog.west-wind.com/posts/2008/Oct/13/Client-Templating-with-jQuery
        template: function (str, data) {
            var err = "";
            try {
                var strFunc =
                 "var p=[],print=function(){p.push.apply(p,arguments);};" +
                 "with(obj){p.push('" +
                 str.replace(/[\r\t\n]/g, " ")
                  .replace(/'(?=[^#]*#>)/g, "\t")
                  .split("'").join("\\'")
                  .split("\t").join("'")
                  .replace(/<#=(.+?)#>/g, "',$1,'")
                  .split("<#").join("');")
                  .split("#>").join("p.push('")
                 + "');}return p.join('');";
                var func = new Function("obj", strFunc);
                return func(data);
            } catch (e) {
                err = e.message;
                console.log("< # ERROR: " + err + " # >");
                console.log(e);
            }

        },

        dataReplace: function (str, dataVariable) {
            dataVariable = dataVariable || 'data';
            return '"' + str.replace(/field:\((\w+)\)/g, (str.indexOf('condition:(') > -1 ? '' + dataVariable + '["$1"]' : '"+' + dataVariable + '["$1"]+"')).replace(/condition:(\(.*\))/g, '"+$1+"') + '"';

        }, getField: function (str) {
            return str.replace(/[\s\S]*field:\((\w+)\)[\s\S]*/, '$1')
        }
        , objReplace: function (str, dataVariable) {
            dataVariable = dataVariable || 'data';
            return str.replace(/field:\((\w+)\)/g, (dataVariable + '["$1"]').replace(/condition:(\(.*\))/g, '"+$1+"'));

        },
        fieldReplace: function (str, dataVariable) {
            dataVariable = dataVariable || 'data';
            return str.replace(/field:\((\w+)\)/g, dataVariable + '["$1"]');

        },
        arrayValuesInArray: function (valueArray, array) {
            valueArray = this.toArray(valueArray);

            var unmatched = [];
            for (var i = 0, length = valueArray.length; i < length; i++) {
                if (valueArray[i] && $.inArray(valueArray[i], array) === -1) {
                    unmatched.push(valueArray[i]);
                }
            }
            return unmatched;
        },
        arrayValueInArray: function (array1, array2) {
            for (var i = 0, length = array1.length; i < length; i++) {
                if (array1[i] && $.inArray(array1[i], array2) !== -1) {
                    return true;
                }
            }
            return false;
        },
        keyExists: function (array, obj) {
            array = this.toArray(array);
            var unmatched = [];
            for (var i = 0, length = array.length; i < length; i++) {
                if (array[i] && !obj.hasOwnProperty(array[i])) {
                    unmatched.push(array[i]);
                }
            }
            return unmatched;
        },
        getDate: function () {
            var d = new Date();
            var month = d.getMonth() + 1;
            var day = d.getDate();
            return d.getFullYear() + '-' + (('' + month).length < 2 ? '0' : '') + month + '-' +
             (('' + day).length < 2 ? '0' : '') + day;
        },
        urlUnion: function (url1, url2) {
            var lastIndex = url1.length - 1;
            if (url1[lastIndex] != '/' && url2[0] != '/') url1 += '/';
            else if (url1[lastIndex] === '/' && url2[0] === '/')url2 = url2.substr(1);
            return url1 += url2;
        },
        //@author http://stackoverflow.com/a/7847366/4801797
        cachedImage: function (url) {
            var test = document.createElement("img");
            test.src = url;
            return test.complete || test.width + test.height > 0;
        },
        cutFileName: function (word, ext, maxLength) {
            if (typeof ext === 'undefined')ext = '';
            if (typeof maxLength === 'undefined')maxLength = 10;
            var min = 4;
            if (maxLength < min)return;
            var extLength = ext.length;
            var wordLength = word.length;
            if ((wordLength - 2) > maxLength) {
                word = word.substring(0, maxLength);
                var wl = word.length - extLength;
                word = word.substring(0, wl);
                return word + '...' + ext;

            } else return word;

        },
        toArray: function (element) {
            if (!(element instanceof Array)) {
                element = [element];
            }
            return element;
        },
        findKey: function (value, obj) {
            for (var key in obj) {
                try {
                    if (obj[key] === value)
                        return key;
                } catch (err) {

                }
            }
        }, findByKey: function (array, key, value) {
            for (var i = 0, length = array.length; i < length; i++) {
                if (array[i][key] == value) {
                    return array[i];
                }
            }
            return false;
        },
        editUrl: function (url, path, toRemove) {
            if (path === '')return url.replace(toRemove, '');
            if (url.indexOf(path) < 0) {
                url = this.urlUnion(path, url);
            }
            return url
        },
        removeMirrorValues: function (array) {
            var mirrors;
            do {
                mirrors = false;
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === array[i + 1]) {
                        array.splice(i, 1);
                        mirrors = true;
                    }
                }
            } while (mirrors == true);

        },
        arraySum: function (arr) {
            var sum = 0;
            for (var i = 0; i < arr.length; i++) {
                sum += arr[i];
            }
            return sum;
        },
        loadImage: function (element, image, callback) {
            element = element || $();
            var ssi = this.ssi;
            if (!image || image == 'undefined'){
                element.parents('.ssi-itemWrapper').addClass('ssi-empty')
                return;
            }
            if (!Ss_input.tools.cachedImage(image)) {
                var spinner = $('<div class="ssi-loadingIcon ssi-itemLoader"></div>');
                element.append(spinner);
                $('<img/>').attr('src', image).load(function () {
                    $(this).remove();
                    spinner.remove();
                    if (typeof callback === 'function') {
                        callback(true);
                    } else {
                        element.css('background-image', 'url("' + image + '")');
                    }
                }).error(function () {
                    $(this).remove();
                    spinner.remove();
                    if (typeof callback === 'function') {
                        callback(false);
                    } else {
                        element.css('background-image', 'url("' + image + '")');
                    }
                    element.parents('.ssi-itemWrapper').addClass('ssi-empty')
                });
            } else {
                element.css('background-image', 'url("' + image + '")');
            }
        },
        escape: function (text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        },
        escapeHtml: function (string) {
            return String(string).replace(/[&<>"'\/]/g, function (s) {
                return entityMap[s];
            });
        },
        removeObjFromArray: function (array, key, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] === value) {
                    array.splice(i, 1);
                    break;
                }
            }
        },
        getFirstKey: function (obj) {
            for (var key in obj) return key;
        },
        sanitizeInput: function (str) {
            str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
            return str.trim();
        }
        ,
        removeFromArray: function (array, value) {
            value = this.toArray(value);
            for (var y = 0, vLength = value.length; y < vLength; y++) {
                for (var i = 0, length = array.length; i < length; i++) {
                    if (array[i] === value[y]) {
                        array.splice(i, 1);
                    }
                }
            }
        }
        ,
        removeByKey: function (array, key) {
            key = this.toArray(key);
            for (var i = 0; i < key.length; i++) {
                delete array[key[i]];
            }
        }
        ,
        tooltip: function ($target, text, returnOnly) {
            $target = $($target);
            text = text || $target.data('title');
            if (!text)text = $target.attr('title');
            if (!text)return;
            var $toolTip = $('<div class="ssi-fadeOut ssi-fade ssi-tooltipText">'
             + text +
             '</div>').insertBefore($target);
            $target.one('mouseleave', function () {
                $toolTip.remove();
            });
            if (returnOnly)return $toolTip;
            $toolTip.css({top: $target.position().top - $toolTip.height() - 12, left: $target.position().left})
             .removeClass('ssi-fadeOut');

            return $toolTip;
        }
        ,
        getDataUri: function (url, callback) {//@author https://davidwalsh.name/convert-image-data-uri-javascript
            var image = new Image();
            image.setAttribute('crossOrigin', 'anonymous');
            image.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                canvas.getContext('2d').drawImage(this, 0, 0);
                callback(canvas.toDataURL('image/png'));
            };
            image.src = url;
        }
    }
    ;

    String.prototype.isFile = function (array) {
        if (array)
            return array.indexOf(this.split('/').pop().split('.').pop()) > -1;
        return this
          .split('/').pop()
          .split('.').length > 1;
    };
    String.prototype.fixUrl = function () {
        var length = this.length;
        var url = this;
        if (url[length - 1] !== '/') {
            url += '/'
        }
        return url
    };
    String.prototype.replaceText = function () {
        var args = Array.apply(null, arguments);
        var text = this;
        for (var i = 0; i < args.length; i++) {
            text = text.replace('$' + (i + 1), args[i])
        }
        return text;
    };

    $('body').on('mouseenter', '.ssi-tooltip', function (e) { //----------------------------tooltip----------------------------------------------
         Ss_input.tools.tooltip(e.currentTarget);
     }
    ).on('mouseover', 'div.ssi-dropDownWrapper .parent', function (e) {//----------------------------dropDownMenu----------------------------------------------
        $(e.currentTarget).children('ul').addClass('ssi-show');
        $(e.currentTarget).closest('ul').css('overflow', 'visible')
    }).on('mouseout', 'div.ssi-dropDownWrapper .parent,.ssi-dropOptions li>a', function (e) {
        $(e.currentTarget).children('ul').removeClass('ssi-show');
        $(e.currentTarget).closest('ul').css('overflow', '')
    });

})(jQuery);








