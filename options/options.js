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
	browser.storage.sync.set({
		randomOrder: document.querySelector("#randomOrder").checked,
		closeOpenTabs: document.querySelector("#closeOpenTabs").checked
	});
	e.preventDefault();
}

function restoreOptions() {
	var gettingItem = browser.storage.sync.get(null);
	gettingItem.then((res) => {
		document.querySelector("#randomOrder").checked = res.randomOrder || false;
		document.querySelector("#closeOpenTabs").checked = res.closeOpenTabs || false;
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.addEventListener('DOMContentLoaded', populateText);
document.querySelector("form").addEventListener("submit", saveOptions);