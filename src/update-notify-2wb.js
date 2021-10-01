/*v. 1.0.0*/
var deviceName = "system";
var packagesControl = "New ";

checkUpdate();

defineRule("cron_check_update", {
    when: cron("0 0 5,11 * *"),
    then: function () {
        checkUpdate();
    }
})

function checkUpdate() {
    clearStatus();
    runShellCommand("apt update", {
        captureOutput: true,
        exitCallback: function (exitCode, capturedOutput) {
            if (exitCode === 0) {
                packagesCount = getPackagesCount(capturedOutput);
                thereAreUpdates = packagesCount !== 0;
                if (thereAreUpdates) {
                    writeUpdatePackageList();
                } else {
                    clearStatus();
                }
                return;
            }
        }
    });
}

function clearStatus() {
    removeControl(packagesControl);
}

function writeUpdatePackageList() {
    writePackagesList("");
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
    device = getDevice(deviceName);
    ctrlID = packagesControl;

    if (!device.isControlExists(ctrlID)) {
        newControl = { type: "text", value: "", readonly: true };
        device.addControl(ctrlID, newControl);
    }

    dev["{}/{}".format(device.getId(), ctrlID)] = list;
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