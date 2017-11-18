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

init();

browser.browserAction.setTitle({title: "Open today's pages"});
browser.browserAction.onClicked.addListener(openPages);
 