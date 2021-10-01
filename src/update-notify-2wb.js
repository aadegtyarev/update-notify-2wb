/*v. 1.1.1*/
var deviceName = "update-sensor";
var logControlName = "Log";
var btnControlName = "Check for updates"; 
var updateIsRunning = false;


init();

function checkUpdate() {
  if (!updateIsRunning){
    updateIsRunning = true;
    writeStatus("Looking for an update…"); 
    runShellCommand("apt update", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
        log("{} | {}".format(exitCode, capturedOutput))
        if (exitCode === 0) {
          packagesCount = getPackagesCount(capturedOutput);
          thereAreUpdates = packagesCount !== 0;
          if (thereAreUpdates) {
            writeUpdatePackageList();
          } else {
            writeStatus("No updates");
          }
          
          updateIsRunning = false;
          return;
        }        
      }
    });
  }
}

function init() {
  createVirtualDevice();

  defineRule("cron_check_update", {
    when: cron("0 0 5,11 * *"),
    then: function () {
      checkUpdate();
    }
  });

  defineRule("click_update_button", {
    whenChanged: "{}/{}".format(deviceName, btnControlName),
    then: function (newValue, devName, cellName) {
      checkUpdate();
    }
  });

  checkUpdate();
}

function createVirtualDevice() {
  device = defineVirtualDevice(deviceName, {
    cells: {}
  });

  device.addControl(logControlName, { type: "text", value: "", readonly: true });
  device.addControl(btnControlName, { type: "pushbutton", value: false, readonly: false });

}

function writeStatus(newStatus) {
  writePackagesList(newStatus);
}

function setButtonDisable(status) {
  dev["{}/{}#readonly".format(deviceName, btnControlName)] = status;
}

function writeUpdatePackageList() {
  writePackagesList("I'm getting a list of packages…");
  runShellCommand("apt list --upgradable", {
    captureOutput: true,
    exitCallback: function (exitCode, capturedOutput) {
      if (exitCode === 0) {
        strings = getArrayString(capturedOutput);
        packagesList = getPackages(strings);

        writePackagesList(packagesList);
        return;
      }
    }
  });
}

function writePackagesList(list) {
  dev[deviceName][logControlName] = list;
}

function getTimeStamp() {
  return new Date();
}

function getPackages(strings) {
  packagesList = "";
  strings.forEach(function (item, _index, _array) {
    indexSlash = item.indexOf("/");
    if (indexSlash > 0) {
      packagesList += "{}, ".format(item.slice(0, indexSlash));
    }
  });

  packagesList = packagesList.trim();
  return packagesList.slice(0, packagesList.length - 1);
}

function getPackagesCount(commandOut) {
  lastString = getLastString(commandOut);
  return getNumber(lastString);
}

function getLastString(text) {
  strings = getArrayString(text);
  return strings[strings.length - 2];
}

function getArrayString(text) {
  return text.split("\n");
}

function getNumber(text) {
  return Number(text.replace(/[^+\d]/g, ''));
}

function removeControl(name) {
  device = getDevice(deviceName);
  device.removeControl(name);
}