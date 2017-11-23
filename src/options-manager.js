var OptionNames = {
	randomOrder: "randomOrder",
	closeOpenTabs: "closeOpenTabs"
};

var OptionsManager = {
	setOptions: function(optionsObj) {
		return browser.storage.sync.set(optionsObj);
	},
	
	setSingleOption: function(settingName, settingValue) {
		var settingsObj = {};
		settingWrapper[settingName] = settingValue;
		return browser.storage.sync.set(settingWrapper);
	},
	
	getOption: function(settingName, defaultValue) {
		return browser.storage.sync.get(settingName).
			then(settingWrapper => {
				if(settingWrapper.hasOwnProperty(settingName)) {
					return settingWrapper[settingName];
				}
				else {
					return defaultValue;
				}
			});
	}
};