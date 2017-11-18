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
	  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];
}

function init() {
	browser.bookmarks
		.search({title:BOOKMARK_FOLDER_TITLE})
		.then(handleSearchResults, error => console.error(`Error initializing Today's Pages: ${error}`));
}

function handleSearchResults(searchResults) {
	if(searchResults.length === 0) {
		console.log("Making directory");
		makeBookmarkDir();
	}
	else if(searchResults.length === 1) {
		console.log("Found directory");
		bmFolder = searchResults[0];
		fetchSubdirs();
	}
	else {
		console.log("Too many results?!");
		//TODO
	}
}

function makeBookmarkDir() {
	browser.bookmarks
		.create({
			title: BOOKMARK_FOLDER_TITLE
		})
		.then(createdFolder => {
				bmFolder = createdFolder;
				fetchSubdirs();
			},
			error => console.error(`Error creating bookmark folder: ${error}`)
		);
}

function fetchSubdirs() {
	browser.bookmarks.getChildren(bmFolder.id).then(subdirs => {
		if(subdirs === undefined) {
			console.log("No subdirs");
			subdirs = [];
		}
		for(let subdir of subdirs) {
			console.log("Found subdir " + subdir.title);
			if(FOLDER_TITLES.includes(subdir.title)) {
				daysToFolders[subdir.title] = subdir;
			}
		}
		
		//create any folders that aren't present
		for(var i = 0; i < FOLDER_TITLES.length; i++) {
			var title = FOLDER_TITLES[i];
			if(!(daysToFolders.hasOwnProperty(title))) {
				console.log("Creating folder " + title);
				createPromise = browser.bookmarks.create({
					parentId: bmFolder.id,
					title: title
				});
				createPromise.then(
					node => daysToFolders[title] = node,
					error => console.error(`Error creating bookmark folder: ${error}`)
				);
			}
		}
	});
}

function openPages() {
	var dayOfWeek = new Date().getDay();
	var folderTitle = FOLDER_TITLES[dayOfWeek];
	var folder = daysToFolders[folderTitle];
	
	var bookmarks = browser.bookmarks.getChildren(folder.id).then(todaysPages => {
		for(var i = 0; i < todaysPages.length; i++) {
			var bookmark = todaysPages[i];
			if("url" in bookmark) {
				browser.tabs.create({
					url: bookmark.url
				});
			}
		}
	})
}

function createAddPageItem(folderTitles, displayDay, parentId) {
	browser.menus.create({
		id: "add" + folderTitles.join(""),
		contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
		title: displayDay,
		parentId: parentId,
		onclick: makeAddPageCallback(folderTitles)
	});
}

function makeAddPageCallback(folderTitles) {
	return () => {
		getActiveTab(tabs => {
			if(tabs[0]) {
				tab = tabs[0];
				addBookmark(tab.url, tab.title, folderTitles);
			}
		});
	}
}

function getActiveTab(callback) {
	browser.tabs.query({active: true, currentWindow: true}).then(callback);
}

function addBookmark(url, title, folderTitles) {
	if(url) {
		folderTitles.forEach(folderTitle => {
			console.log("Adding bookmark to " + url + " in folder " + folderTitle);
			var parentId = daysToFolders[folderTitle].id;
			browser.bookmarks.create({parentId: parentId, title: title, url: url})
				.then(() => {}, error => console.error(`Failed to create bookmark: ${error}`));
		})
	}
	else {
		console.error("Can't add bookmark to empty url")
	}
}

function createMenus() {
	browser.menus.create({
		id: "menuRoot",
		contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
		title: "Add Page to Today's Pages..."
	});
	
	browser.menus.create({
		id: "addEveryDay",
		contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
		title: "Daily",
		parentId: "menuRoot",
		onclick: makeAddPageCallback(FOLDER_TITLES)
	});
	createAddPageItem([FOLDER_TITLE_MONDAY, FOLDER_TITLE_WEDNESDAY, FOLDER_TITLE_FRIDAY],
		"Mon / Wed / Fri",
		"menuRoot");
		
	createAddPageItem([FOLDER_TITLE_TUESDAY, FOLDER_TITLE_THURSDAY],
		"Tue / Thu",
		"menuRoot");
		
	browser.menus.create({
		contexts: [browser.menus.ContextType.ALL, browser.menus.ContextType.TAB],
		type: browser.menus.ItemType.SEPARATOR,
		parentId: "menuRoot"
	});
	
	for(var dayIdx = 0; dayIdx < FOLDER_TITLES.length; dayIdx++) {
		createAddPageItem([FOLDER_TITLES[dayIdx]], getDayOfWeekText(dayIdx), "menuRoot");
	}
}

init();
createMenus();

browser.browserAction.setTitle({title: "Open today's pages"});
browser.browserAction.onClicked.addListener(openPages);
 