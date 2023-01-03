cordova.define(
  'cordova-plugin-wallpaper.wallpaper',
  function (require, exports, module) {
    function wallpaper() {}

    wallpaper.prototype.setImage = function (image, type, callback) {
      var services = 'wallpaper';
      var dependentProperties = [];
      dependentProperties.push(image, false);

      var successCallback = function () {
        typeof callback === 'function' && callback();
      };

      var errorCallback = function (error) {
        var errorBack = error || 'unknown cordova error when setting wallpaper';
        typeof callback === 'function' && callback(errorBack);
      };

      var action = 'start'; //future actions new entries. Fixed.
      if (type == 'lock') {
        action = 'lockscreen';
      } else if (type == 'both') {
        action = 'both';
      }
      if (image) {
        cordova.exec(
          successCallback,
          errorCallback,
          services,
          action,
          dependentProperties
        );
      }
    };

    wallpaper.prototype.saveWallpaper = function (callback) {
      var services = 'wallpaper';
      var dependentProperties = [];

      var successCallback = function () {
        typeof callback === 'function' && callback();
      };

      var errorCallback = function (error) {
        var errorBack = error || 'unknown cordova error when setting wallpaper';
        typeof callback === 'function' && callback(errorBack);
      };

      var action = 'save_homescreen_wp';
      cordova.exec(
        successCallback,
        errorCallback,
        services,
        action,
        dependentProperties
      );
    };

    function setBase64(base64, type, callback) {
      var services = 'wallpaper';
      var dependentProperties = [];
      dependentProperties.push(base64, true);

      var successCallback = function () {
        typeof callback === 'function' && callback();
      };

      var errorCallback = function (error) {
        var errorBack = error || 'unknown cordova error when setting wallpaper';
        typeof callback === 'function' && callback(errorBack);
      };

      var action = 'start'; //future actions new entries. Fixed.
      if (type == 'lock') {
        action = 'lockscreen';
      }
      if (base64) {
        cordova.exec(
          successCallback,
          errorCallback,
          services,
          action,
          dependentProperties
        );
      }
    }

    wallpaper.prototype.setImageBase64 = function (base64, callback) {
      setBase64(base64, callback);
    };

    wallpaper.prototype.setImageHttp = function (url, type, callback) {
      var request = null;
      if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        try {
          request =
            new ActiveXObject('Msxml2.XMLHTTP.6.0') ||
            new ActiveXObject('Msxml2.XMLHTTP.3.0');
        } catch (e) {
          typeof callback === 'function' &&
            callback('XMLHttpRequest is not supported.');
        }
      }
      if (request == null) {
        typeof callback === 'function' &&
          callback('XMLHttpRequest is not supported.');
      } else {
        function XHRload() {
          var array = new Uint8Array(request.response);
          var raw = '';
          var chunk = 5000;
          for (i = 0; i < array.length; i += chunk) {
            var subArray = array.subarray(i, i + chunk);
            raw += String.fromCharCode.apply(null, subArray);
          }
          var base64 = btoa(raw);
          if (type == 'both') {
            setBase64(base64, 'both', callback);
          } else {
            setBase64(base64, type, callback);
          }
        }
        function XHRerror(error) {
          typeof callback === 'function' && callback(error);
        }
        function XHRabort(error) {
          typeof callback === 'function' && callback(error);
        }
        request.responseType = 'arraybuffer';
        request.addEventListener('load', XHRload);
        request.addEventListener('error', XHRerror);
        request.addEventListener('abort', XHRabort);
        request.open('GET', url, true);
        request.send();
      }
    };

    // Function that implements downloading an image, saving it to persistent storage, and setting it as a wp
    // POC for saving files in Cordova
    wallpaper.prototype.setImageHttpDL = function (url, type, callback) {
      var request = null;
      if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        try {
          request =
            new ActiveXObject('Msxml2.XMLHTTP.6.0') ||
            new ActiveXObject('Msxml2.XMLHTTP.3.0');
        } catch (e) {
          typeof callback === 'function' &&
            callback('XMLHttpRequest is not supported.');
        }
      }
      if (request == null) {
        typeof callback === 'function' &&
          callback('XMLHttpRequest is not supported.');
      } else {
        function XHRload() {
          var array = new Uint8Array(request.response);
          console.log(JSON.stringify(array));
          var raw = '';
          var chunk = 5000;
          for (i = 0; i < array.length; i += chunk) {
            var subArray = array.subarray(i, i + chunk);
            raw += String.fromCharCode.apply(null, subArray);
          }
          var base64 = btoa(raw);
          console.log('Content' + base64);
          var contentDispo = request.getResponseHeader('Content-Disposition');
          // https://stackoverflow.com/a/23054920/
          var fileName = contentDispo
            .match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1]
            .replaceAll('"', '');
          console.log(fileName.replaceAll('"', ''));

          window.requestFileSystem(
            LocalFileSystem.PERSISTENT,
            0,
            function (fs) {
              console.log('file system open: ' + fs.name);
              fs.root.getFile(
                fileName,
                { create: true, exclusive: false },
                function (fileEntry) {
                  console.log(
                    'fileEntry is file?' + fileEntry.isFile.toString()
                  );
                  writeFile(fileEntry, base64);
                },
                e => {
                  console.log('Error createfile');
                  JSON.stringify(e);
                }
              );
            },
            e => {
              console.log('Error filesystem');
              JSON.stringify(e);
            }
          );

          function writeFile(fileEntry, dataObj) {
            console.log(dataObj);
            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function (fileWriter) {
              fileWriter.onwriteend = function () {
                console.log('Successful file write...');
                readFile(fileEntry);
              };

              fileWriter.onerror = function (e) {
                console.log('Failed file write: ' + e.toString());
              };

              // If data object is not passed in,
              // create a new Blob instead.
              if (!dataObj) {
                dataObj = new Blob(['some file data'], { type: 'text/plain' });
              }

              fileWriter.write(dataObj);
            });
          }

          function readFile(fileEntry) {
            fileEntry.file(
              function (file) {
                var reader = new FileReader();

                reader.onloadend = function () {
                  console.log('Successful file read: ' + this.result);
                  setBase64(reader.result, callback);
                };
                reader.readAsText(file);
              },
              e => {
                console.log('Error createfile');
                JSON.stringify(e);
              }
            );
          }
        }

        function XHRerror(error) {
          typeof callback === 'function' && callback(error);
        }
        function XHRabort(error) {
          typeof callback === 'function' && callback(error);
        }
        request.responseType = 'arraybuffer';
        request.addEventListener('load', XHRload);
        request.addEventListener('error', XHRerror);
        request.addEventListener('abort', XHRabort);
        request.open('GET', url, true);
        request.send();
      }
    };

    wallpaper.install = function () {
      if (!window.plugins) {
        window.plugins = {};
      }

      window.plugins.wallpaper = new wallpaper();
      return window.plugins.wallpaper;
    };

    cordova.addConstructor(wallpaper.install);
  }
);
