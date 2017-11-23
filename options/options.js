var Messages = {
	header: browser.i18n.getMessage("optionsHeader"),
	loadRandomLabel: browser.i18n.getMessage("optionsLoadRandomLabel"),
	closeOpenTabsLabel: browser.i18n.getMessage("optionsCloseOpenTabsLabel"),
	allowDupeSitesLabel: browser.i18n.getMessage("optionsAllowDupeSitesLabel"),
	saveButton: browser.i18n.getMessage("optionsSaveButton")
};

function populateText() {
	document.querySelector("#optionsHeader").innerHTML = Messages.header;
	document.querySelector("#loadRandomLabel").innerHTML = Messages.loadRandomLabel;
	document.querySelector("#closeOpenTabsLabel").innerHTML = Messages.closeOpenTabsLabel;
	document.querySelector("#saveButton").innerHTML = Messages.saveButton;
}

function saveOptions(e) {
	OptionsManager.setOptions({
		[OptionNames.randomOrder]: document.querySelector("#randomOrder").checked,
		[OptionNames.closeOpenTabs]: document.querySelector("#closeOpenTabs").checked
	});
	e.preventDefault();
}

function restoreOptions() {
	OptionsManager.getOption(OptionNames.randomOrder, false).
		then(val => document.querySelector("#randomOrder").checked = val);
	OptionsManager.getOption(OptionNames.closeOpenTabs, false).
		then(val => document.querySelector("#closeOpenTabs").checked = val);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.addEventListener('DOMContentLoaded', populateText);
document.querySelector("form").addEventListener("submit", saveOptions);