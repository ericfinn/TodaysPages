const BOOKMARK_FOLDER_TITLE = "Today's Pages";
const FOLDER_TITLE_SUNDAY    = "U";
const FOLDER_TITLE_MONDAY    = "M";
const FOLDER_TITLE_TUESDAY   = "T";
const FOLDER_TITLE_WEDNESDAY = "W";
const FOLDER_TITLE_THURSDAY  = "H";
const FOLDER_TITLE_FRIDAY    = "F";
const FOLDER_TITLE_SATURDAY  = "S";
const FOLDER_TITLES = [
	FOLDER_TITLE_SUNDAY,
	FOLDER_TITLE_MONDAY,
	FOLDER_TITLE_TUESDAY,
	FOLDER_TITLE_WEDNESDAY,
	FOLDER_TITLE_THURSDAY,
	FOLDER_TITLE_FRIDAY,
	FOLDER_TITLE_SATURDAY
];

var bmFolder;
var daysToFolders = {};

function getDayOfWeekText(dayIndex) {
	var curDate = new Date();
	var todayIdx = curDate.getDay();
	var offset = dayIndex - todayIdx;
	curDate.setDate(curDate.getDate() + offset);
	return curDate.toLocaleString(browser.i18n.getUILanguage(), {weekday: 'long'});
}

function getShortDayOfWeekText(dayIndex) {
	var curDate = new Date();
	var todayIdx = curDate.getDay();
	var offset = dayIndex - todayIdx;
	curDate.setDate(curDate.getDate() + offset);
	return curDate.toLocaleString(browser.i18n.getUILanguage(), {weekday: 'short'});
}

var BookmarksSetup = {
	init: function() {
		browser.bookmarks
			.search({title:BOOKMARK_FOLDER_TITLE})
			.then(BookmarksSetup.handleSearchResults, error => console.error(`Error initializing Today's Pages: ${error}`));
	},
	
	handleSearchResults: function(searchResults) {
		if(searchResults.length === 0) {
			console.log("Making directory");
			BookmarksSetup.makeBookmarkDir();
		}
		else if(searchResults.length === 1) {
			console.log("Found directory");
			bmFolder = searchResults[0];
			BookmarksSetup.fetchSubdirs();
		}
		else {
			console.log("Too many results?!");
			//TODO
		}
	},
	
	makeBookmarkDir: function() {
		browser.bookmarks
			.create({
				title: BOOKMARK_FOLDER_TITLE
			})
			.then(createdFolder => {
					bmFolder = createdFolder;
					BookmarksSetup.fetchSubdirs();
				},
				error => console.error(`Error creating bookmark folder: ${error}`)
			);
	},
	
	fetchSubdirs: function() {
		browser.bookmarks.getChildren(bmFolder.id).then(subdirs => {
			if(subdirs === undefined) {
				console.log("No subdirs");
				subdirs = [];
			}
			for(let subdir of subdirs) {
				console.log("Found subdir " + subdir.title);
				if(FOLDER_TITLES.includes(subdir.title)) {
					daysToFolders[subdir.title] = subdir.id;
				}
			}
			
			//create any folders that aren't present
			//Go in reverse order to make the folders appear in the correct order
			for(var i = FOLDER_TITLES.length - 1; i >= 0; i--) {
				var title = FOLDER_TITLES[i];
				if(!(daysToFolders.hasOwnProperty(title))) {
					console.log("Creating folder " + title);
					browser.bookmarks.create({
						parentId: bmFolder.id,
						title: title
					}).then(
						node => daysToFolders[node.title] = node.id,
						error => console.error(`Error creating bookmark folder: ${error}`)
					);
				}
			}
		});
	}
};

var MenusSetup = {
	createMenus: function() {
		browser.menus.create({
			id: "menuRoot",
			contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
			title: browser.i18n.getMessage("addPageLabel")
		});
		
		browser.menus.create({
			id: "addEveryDay",
			contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
			title: browser.i18n.getMessage("dailyMenuItem"),
			parentId: "menuRoot",
			onclick: MenusSetup.makeAddPageCallback(FOLDER_TITLES)
		});
		MenusSetup.createAddPageItem([FOLDER_TITLE_MONDAY, FOLDER_TITLE_WEDNESDAY, FOLDER_TITLE_FRIDAY],
			getShortDayOfWeekText(1) + " / " + getShortDayOfWeekText(3) + " / " + getShortDayOfWeekText(5),
			"menuRoot");
			
		MenusSetup.createAddPageItem([FOLDER_TITLE_TUESDAY, FOLDER_TITLE_THURSDAY],
			getShortDayOfWeekText(2) + " / " + getShortDayOfWeekText(4),
			"menuRoot");
			
		browser.menus.create({
			contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
			type: browser.menus.ItemType.SEPARATOR,
			parentId: "menuRoot"
		});
		
		for(var dayIdx = 0; dayIdx < FOLDER_TITLES.length; dayIdx++) {
			MenusSetup.createAddPageItem([FOLDER_TITLES[dayIdx]], getDayOfWeekText(dayIdx), "menuRoot");
		}
	},

	createAddPageItem: function(folderTitles, displayDay, parentId) {
		browser.menus.create({
			id: "add" + folderTitles.join(""),
			contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
			title: displayDay,
			parentId: parentId,
			onclick: MenusSetup.makeAddPageCallback(folderTitles)
		});
	},

	makeAddPageCallback: function(folderTitles) {
		return (info, tab) => {
			addBookmark(tab.url, tab.title, folderTitles);
		}
	}
};

//https://stackoverflow.com/a/1527820/407071
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
Knuth/Fisher-Yates shuffle
https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
*/
function kfyShuffle(arr) {
	shuffling = arr.slice(0);
	for(var i = shuffling.length-1; i >= 1; i--) {
		var swapIdx = randomInt(0, i);
		var temp = shuffling[i];
		shuffling[i] = shuffling[swapIdx];
		shuffling[swapIdx] = temp;
	}
	return shuffling;
}

function openBookmarks(todaysPages) {
	for(var i = 0; i < todaysPages.length; i++) {
		var bookmark = todaysPages[i];
		if("url" in bookmark) {
			browser.tabs.create({
				url: bookmark.url
			});
		}
	}
}

function openPages() {
	var dayOfWeek = new Date().getDay();
	var folderTitle = FOLDER_TITLES[dayOfWeek];
	var folderId = daysToFolders[folderTitle];
	
	var gettingRandomOrderOption = OptionsManager.getOption(OptionNames.randomOrder);
	var gettingBookmarks = browser.bookmarks.getChildren(folderId);
	
	Promise.all([gettingRandomOrderOption, gettingBookmarks]).then(values => {
		var randomOrderOption = values[0];
		var todaysPages = values[1];
		if(randomOrderOption) {
			todaysPages = kfyShuffle(todaysPages);
		}
		openBookmarks(todaysPages);
	})
}

function addBookmark(url, title, folderTitles) {
	if(url) {
		folderTitles.forEach(folderTitle => {
			console.log("Adding bookmark to " + url + " in folder " + folderTitle);
			var parentId = daysToFolders[folderTitle];
			browser.bookmarks.create({parentId: parentId, title: title, url: url})
				.then(() => {}, error => console.error(`Failed to create bookmark: ${error}`));
		})
	}
	else {
		console.error("Can't add bookmark to empty url")
	}
}

BookmarksSetup.init();
MenusSetup.createMenus();

browser.browserAction.setTitle({title: browser.i18n.getMessage("openPagesTooltip")});
browser.browserAction.onClicked.addListener(openPages);
