const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const screenshotmachine = require("screenshotmachine");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

const customerKey = "1f8491";
secretPhrase = ""; //leave secret phrase empty, if not needed
options = [
	{
		//mandatory parameter
		url: "https://ifunded.de/en/",
		// all next parameters are optional, see our website screenshot API guide for more details
		dimension: "1920x1080",
		device: "desktop",
		format: "jpg",
	},
	{
		//mandatory parameter
		url: "https://www.propertypartner.co",
		// all next parameters are optional, see our website screenshot API guide for more details
		dimension: "1920x1080",
		device: "desktop",
		format: "jpg",
	},
	{
		//mandatory parameter
		url: "https://propertymoose.co.uk",
		// all next parameters are optional, see our website screenshot API guide for more details
		dimension: "1920x1080",
		device: "desktop",
		format: "jpg",
	},
	{
		//mandatory parameter
		url: "https://www.homegrown.co.uk",
		// all next parameters are optional, see our website screenshot API guide for more details
		dimension: "1920x1080",
		device: "desktop",
		format: "jpg",
	},
	{
		//mandatory parameter
		url: "https://www.realtymogul.com",
		// all next parameters are optional, see our website screenshot API guide for more details
		dimension: "1920x1080",
		device: "desktop",
		format: "jpg",
	},
];
const fileNames = [
	"1_iFunded.jpg",
	"2_PropertyPartner.jpg",
	"3_PropertyMoose.jpg",
	"4_Homegrown.jpg",
	"5_RealtyMogul.jpg",
];

for (let i = 0; i <= options.length - 1; i++) {
	const apiUrl = screenshotmachine.generateScreenshotApiUrl(
		customerKey,
		secretPhrase,
		options[i]
	);

	//or save screenshot as an image
	const fss = require("fs");
	const output = `files/${fileNames[i]}`;
	screenshotmachine.readScreenshot(apiUrl).pipe(
		fss.createWriteStream(output).on("close", function () {
			console.log("Screenshot saved as " + output);
		})
	);
}

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (err) {
		return null;
	}
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
	let client = await loadSavedCredentialsIfExist();
	if (client) {
		return client;
	}
	client = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
}

/**
 * Create a folder and prints the folder ID
 * @return{obj} folder Id
 * */
async function createPopulateFolder(authClient) {
	const fs = require("fs");
	const service = google.drive({ version: "v3", auth: authClient });
	const folderMetadata = {
		name: "Data4You application",
		mimeType: "application/vnd.google-apps.folder",
	};
	const media = [
		{
			mimeType: "image/jpeg",
			body: fs.createReadStream(`files/${fileNames[0]}`),
		},
		{
			mimeType: "image/jpeg",
			body: fs.createReadStream(`files/${fileNames[1]}`),
		},
		{
			mimeType: "image/jpeg",
			body: fs.createReadStream(`files/${fileNames[2]}`),
		},
		{
			mimeType: "image/jpeg",
			body: fs.createReadStream(`files/${fileNames[3]}`),
		},
		{
			mimeType: "image/jpeg",
			body: fs.createReadStream(`files/${fileNames[4]}`),
		},
	];
	try {
		const folder = await service.files.create({
			resource: folderMetadata,
			fields: "id",
		});
		console.log("Folder Id:", folder.data.id);
		for (let i = 0; i < media.length; i++) {
			const file = await service.files.create({
				resource: {
					name: fileNames[i],
					parents: [folder.data.id],
				},
				media: media[i],
				fields: "id",
			});
			console.log("File Id:", file.data.id);
		}
	} catch (err) {
		// TODO(developer) - Handle error
		throw err;
	}
}

authorize().then(createPopulateFolder).catch(console.error);
